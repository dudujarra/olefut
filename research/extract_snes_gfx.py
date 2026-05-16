#!/usr/bin/env python3
"""
SNES ROM Graphics Extractor for International Superstar Soccer Deluxe
Extracts 4bpp tiles, sprites, and scans for compressed graphics data.

SNES 4bpp tile format:
- Each 8x8 tile = 32 bytes
- Bytes are organized in bitplane pairs:
  - Bytes 0-15: bitplanes 0,1 (interleaved per row)
  - Bytes 16-31: bitplanes 2,3 (interleaved per row)
- Each row: [bp0_byte, bp1_byte] then later [bp2_byte, bp3_byte]
"""

import struct
import os
from PIL import Image

ROM_PATH = "International Superstar Soccer Deluxe (USA).sfc"
OUTPUT_DIR = "issd_extracted"

# SNES default palette approximation (grayscale for tiles without palette)
def make_grayscale_palette(num_colors=16):
    """Generate a grayscale palette for 4bpp tiles."""
    pal = []
    for i in range(num_colors):
        v = int(i * 255 / (num_colors - 1))
        pal.append((v, v, v))
    return pal

# Konami ISSD uses some known palettes - these are typical SNES football game colors
TEAM_PALETTE_GENERIC = [
    (0, 0, 0),        # 0 - transparent/black
    (255, 255, 255),   # 1 - white
    (200, 200, 200),   # 2 - light gray
    (150, 150, 150),   # 3 - gray
    (100, 100, 100),   # 4 - dark gray
    (50, 50, 50),      # 5 - darker gray
    (0, 128, 0),       # 6 - green (field)
    (0, 200, 0),       # 7 - bright green
    (255, 0, 0),       # 8 - red (team)
    (0, 0, 255),       # 9 - blue (team)
    (255, 255, 0),     # 10 - yellow
    (255, 128, 0),     # 11 - orange
    (128, 64, 0),      # 12 - brown (skin)
    (200, 150, 100),   # 13 - light skin
    (64, 64, 64),      # 14 - dark
    (128, 128, 128),   # 15 - mid gray
]

def decode_4bpp_tile(data, offset=0):
    """
    Decode a single SNES 4bpp 8x8 tile (32 bytes) into pixel indices.
    Returns 8x8 array of palette indices (0-15).
    """
    pixels = [[0]*8 for _ in range(8)]
    
    for row in range(8):
        # Bitplanes 0,1 are in bytes 0-15
        bp0 = data[offset + row * 2]
        bp1 = data[offset + row * 2 + 1]
        # Bitplanes 2,3 are in bytes 16-31
        bp2 = data[offset + 16 + row * 2]
        bp3 = data[offset + 16 + row * 2 + 1]
        
        for col in range(8):
            bit = 7 - col
            pixel = ((bp0 >> bit) & 1) | \
                    (((bp1 >> bit) & 1) << 1) | \
                    (((bp2 >> bit) & 1) << 2) | \
                    (((bp3 >> bit) & 1) << 3)
            pixels[row][col] = pixel
    
    return pixels


def decode_2bpp_tile(data, offset=0):
    """
    Decode a single SNES 2bpp 8x8 tile (16 bytes).
    Returns 8x8 array of palette indices (0-3).
    """
    pixels = [[0]*8 for _ in range(8)]
    
    for row in range(8):
        bp0 = data[offset + row * 2]
        bp1 = data[offset + row * 2 + 1]
        
        for col in range(8):
            bit = 7 - col
            pixel = ((bp0 >> bit) & 1) | (((bp1 >> bit) & 1) << 1)
            pixels[row][col] = pixel
    
    return pixels


def tiles_to_image(rom_data, start_offset, num_tiles, tiles_per_row=16, bpp=4, palette=None):
    """
    Render multiple tiles into a single image.
    """
    if palette is None:
        palette = make_grayscale_palette(16 if bpp == 4 else 4)
    
    tile_size = 32 if bpp == 4 else 16
    decode_fn = decode_4bpp_tile if bpp == 4 else decode_2bpp_tile
    
    rows = (num_tiles + tiles_per_row - 1) // tiles_per_row
    img_w = tiles_per_row * 8
    img_h = rows * 8
    
    img = Image.new('RGBA', (img_w, img_h), (0, 0, 0, 0))
    
    for i in range(num_tiles):
        offset = start_offset + i * tile_size
        if offset + tile_size > len(rom_data):
            break
        
        pixels = decode_fn(rom_data, offset)
        
        tx = (i % tiles_per_row) * 8
        ty = (i // tiles_per_row) * 8
        
        for row in range(8):
            for col in range(8):
                idx = pixels[row][col]
                if idx == 0:
                    # Transparent
                    img.putpixel((tx + col, ty + row), (0, 0, 0, 0))
                else:
                    r, g, b = palette[idx % len(palette)]
                    img.putpixel((tx + col, ty + row), (r, g, b, 255))
    
    return img


def scan_for_graphics_regions(rom_data, min_tiles=32):
    """
    Heuristic scan to find regions that likely contain valid 4bpp tile data.
    Looks for regions with good entropy distribution typical of graphics.
    """
    regions = []
    tile_size = 32
    window = 1024  # Check 1KB chunks
    
    for offset in range(0, len(rom_data) - window, window):
        chunk = rom_data[offset:offset + window]
        
        # Heuristic: graphics data has moderate byte entropy
        # and isn't all zeros or all FF
        byte_counts = [0] * 256
        for b in chunk:
            byte_counts[b] += 1
        
        zeros = byte_counts[0]
        ffs = byte_counts[255]
        
        # Skip if mostly zeros or FF
        if zeros > window * 0.8 or ffs > window * 0.8:
            continue
        
        # Count unique bytes - graphics data typically has moderate variety
        unique = sum(1 for c in byte_counts if c > 0)
        
        if 10 < unique < 200:
            # Try decoding tiles and check if they have reasonable content
            has_content = False
            for t in range(0, min(window, 320), 32):
                tile = decode_4bpp_tile(rom_data, offset + t)
                non_zero = sum(1 for row in tile for px in row if px != 0)
                if 5 < non_zero < 60:  # Not empty, not full
                    has_content = True
                    break
            
            if has_content:
                regions.append(offset)
    
    # Merge adjacent regions
    merged = []
    if regions:
        start = regions[0]
        end = regions[0] + window
        for r in regions[1:]:
            if r <= end:
                end = r + window
            else:
                if (end - start) >= min_tiles * tile_size:
                    merged.append((start, end))
                start = r
                end = r + window
        if (end - start) >= min_tiles * tile_size:
            merged.append((start, end))
    
    return merged


def extract_snes_palette(rom_data, offset, num_colors=16):
    """
    Extract SNES 15-bit palette (BBBBBGGGGGRRRRR format).
    Each color is 2 bytes, little-endian.
    """
    palette = []
    for i in range(num_colors):
        if offset + i * 2 + 1 >= len(rom_data):
            palette.append((0, 0, 0))
            continue
        color = struct.unpack_from('<H', rom_data, offset + i * 2)[0]
        r = (color & 0x1F) << 3
        g = ((color >> 5) & 0x1F) << 3
        b = ((color >> 10) & 0x1F) << 3
        palette.append((r, g, b))
    return palette


def scan_for_palettes(rom_data, min_colors=8):
    """
    Scan for potential SNES 15-bit color palettes.
    Look for sequences of valid SNES colors (values <= 0x7FFF).
    """
    palettes = []
    
    for offset in range(0, len(rom_data) - min_colors * 2, 2):
        valid = True
        non_zero = 0
        
        for i in range(min_colors):
            color = struct.unpack_from('<H', rom_data, offset + i * 2)[0]
            if color > 0x7FFF:
                valid = False
                break
            if color != 0:
                non_zero += 1
        
        if valid and non_zero >= min_colors // 2:
            # Check if first color is black/dark (common for index 0)
            first = struct.unpack_from('<H', rom_data, offset)[0]
            if first <= 0x0010:  # Very dark/black
                pal = extract_snes_palette(rom_data, offset, 16)
                # Check palette variety
                unique_colors = len(set(pal))
                if unique_colors >= 4:
                    palettes.append((offset, pal))
    
    return palettes


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    with open(ROM_PATH, 'rb') as f:
        rom = f.read()
    
    print(f"ROM loaded: {len(rom)} bytes ({len(rom)//1024} KB)")
    print(f"Title: SUPERSTAR SOCCER 2 (Konami, USA)")
    print()
    
    # === 1. Scan for known graphics regions ===
    print("=== Scanning for graphics regions... ===")
    regions = scan_for_graphics_regions(rom)
    print(f"Found {len(regions)} potential graphics regions")
    
    # Extract the largest regions
    regions.sort(key=lambda r: r[1] - r[0], reverse=True)
    
    for idx, (start, end) in enumerate(regions[:20]):
        size = end - start
        num_tiles = size // 32
        print(f"  Region {idx}: 0x{start:06X}-0x{end:06X} ({size} bytes, ~{num_tiles} tiles)")
        
        # Render with grayscale palette
        img = tiles_to_image(rom, start, min(num_tiles, 512), tiles_per_row=16, bpp=4)
        fname = f"{OUTPUT_DIR}/region_{idx:02d}_0x{start:06X}.png"
        
        # Scale up 3x for visibility
        img_scaled = img.resize((img.width * 3, img.height * 3), Image.NEAREST)
        img_scaled.save(fname)
        print(f"    Saved: {fname} ({img.width}x{img.height} -> {img_scaled.width}x{img_scaled.height})")
    
    # === 2. Known offsets for ISSD graphics ===
    # These are commonly documented offsets for ISS Deluxe graphics
    known_regions = [
        (0x040000, 4096, "Player sprites area 1"),
        (0x060000, 4096, "Player sprites area 2"),
        (0x080000, 4096, "Background/field tiles"),
        (0x0A0000, 2048, "UI/Menu graphics"),
        (0x0C0000, 2048, "Font/text tiles"),
        (0x100000, 4096, "Additional sprites"),
        (0x140000, 4096, "Team logos/flags area"),
        (0x180000, 4096, "Animation frames"),
        (0x1C0000, 2048, "Title screen area"),
    ]
    
    print("\n=== Extracting known graphic areas... ===")
    for start, num_tiles, desc in known_regions:
        if start + num_tiles * 32 > len(rom):
            continue
        
        img = tiles_to_image(rom, start, num_tiles, tiles_per_row=16, bpp=4)
        safe_desc = desc.replace(' ', '_').replace('/', '_')
        fname = f"{OUTPUT_DIR}/known_{safe_desc}_0x{start:06X}.png"
        
        img_scaled = img.resize((img.width * 3, img.height * 3), Image.NEAREST)
        img_scaled.save(fname)
        print(f"  {desc}: 0x{start:06X} ({num_tiles} tiles) -> {fname}")
    
    # === 3. Scan for palettes ===
    print("\n=== Scanning for color palettes... ===")
    palettes = scan_for_palettes(rom)
    print(f"Found {len(palettes)} potential palettes")
    
    # Save palette previews
    for idx, (offset, pal) in enumerate(palettes[:30]):
        # Create palette swatch image
        swatch = Image.new('RGB', (16 * 16, 16), (0, 0, 0))
        for i, (r, g, b) in enumerate(pal):
            for x in range(16):
                for y in range(16):
                    swatch.putpixel((i * 16 + x, y), (r, g, b))
        
        fname = f"{OUTPUT_DIR}/palette_{idx:02d}_0x{offset:06X}.png"
        swatch_scaled = swatch.resize((swatch.width * 2, swatch.height * 2), Image.NEAREST)
        swatch_scaled.save(fname)
    
    if palettes:
        print(f"  Saved {min(30, len(palettes))} palette previews")
        
        # Re-render some regions with found palettes
        print("\n=== Re-rendering with found palettes... ===")
        for pal_idx, (pal_offset, pal) in enumerate(palettes[:5]):
            for reg_idx, (start, end) in enumerate(regions[:5]):
                num_tiles = min((end - start) // 32, 256)
                img = tiles_to_image(rom, start, num_tiles, tiles_per_row=16, bpp=4, palette=pal)
                fname = f"{OUTPUT_DIR}/colored_reg{reg_idx:02d}_pal{pal_idx:02d}.png"
                img_scaled = img.resize((img.width * 3, img.height * 3), Image.NEAREST)
                img_scaled.save(fname)
            print(f"  Palette {pal_idx} (0x{pal_offset:06X}): {pal[:4]}...")
    
    # === 4. Full ROM tile dump (sample every 64KB) ===
    print("\n=== Full ROM tile scan (sampled)... ===")
    for block_start in range(0, len(rom), 0x10000):
        num_tiles = min(256, (len(rom) - block_start) // 32)
        img = tiles_to_image(rom, block_start, num_tiles, tiles_per_row=16, bpp=4)
        fname = f"{OUTPUT_DIR}/block_0x{block_start:06X}.png"
        img_scaled = img.resize((img.width * 3, img.height * 3), Image.NEAREST)
        img_scaled.save(fname)
    print(f"  Saved {len(rom) // 0x10000 + 1} block samples")
    
    # === 5. Assembly code analysis ===
    print("\n=== Code Analysis (65816 disassembly snapshot) ===")
    # The reset vector points to the entry point
    reset_vector = struct.unpack_from('<H', rom, 0x7FFC)[0]
    print(f"Reset Vector: ${reset_vector:04X}")
    
    # Show first bytes at entry point (mapped via LoROM)
    # LoROM: Bank $80-$FF -> address & 0x7FFF for each bank
    # Reset at $FF97 -> Bank $00, offset $FF97 -> file offset $7F97
    entry_offset = reset_vector & 0x7FFF
    print(f"Entry point file offset: 0x{entry_offset:04X}")
    print(f"First 32 bytes at entry:")
    for i in range(0, 32, 16):
        hex_str = ' '.join(f'{rom[entry_offset+i+j]:02X}' for j in range(16))
        print(f"  ${reset_vector+i:04X}: {hex_str}")
    
    print(f"\n=== Done! Output in {OUTPUT_DIR}/ ===")
    print(f"Total files generated: {len(os.listdir(OUTPUT_DIR))}")


if __name__ == '__main__':
    main()
