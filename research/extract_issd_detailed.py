#!/usr/bin/env python3
"""
Detailed ISSD ROM extractor - focuses on readable tile regions
and attempts Konami decompression.
"""
import struct
import os
from PIL import Image

ROM_PATH = "International Superstar Soccer Deluxe (USA).sfc"
OUTPUT_DIR = "issd_detailed"
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(ROM_PATH, 'rb') as f:
    rom = bytearray(f.read())


def extract_snes_palette(data, offset, num_colors=16):
    """Extract SNES 15-bit BGR555 palette."""
    pal = []
    for i in range(num_colors):
        pos = offset + i * 2
        if pos + 1 >= len(data):
            pal.append((0, 0, 0))
            continue
        c = struct.unpack_from('<H', data, pos)[0]
        r = (c & 0x1F) << 3
        g = ((c >> 5) & 0x1F) << 3
        b = ((c >> 10) & 0x1F) << 3
        pal.append((r, g, b))
    return pal


def decode_4bpp_tile(data, offset=0):
    """Decode SNES 4bpp 8x8 tile (32 bytes)."""
    pixels = [[0]*8 for _ in range(8)]
    for row in range(8):
        bp0 = data[offset + row * 2]
        bp1 = data[offset + row * 2 + 1]
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
    """Decode SNES 2bpp 8x8 tile (16 bytes)."""
    pixels = [[0]*8 for _ in range(8)]
    for row in range(8):
        bp0 = data[offset + row * 2]
        bp1 = data[offset + row * 2 + 1]
        for col in range(8):
            bit = 7 - col
            pixel = ((bp0 >> bit) & 1) | (((bp1 >> bit) & 1) << 1)
            pixels[row][col] = pixel
    return pixels


def tiles_to_image(rom_data, start, num_tiles, tpr=16, bpp=4, palette=None, scale=3, bg_color=(40, 40, 40)):
    """Render tiles as image with optional background color."""
    if palette is None:
        if bpp == 4:
            palette = [(i*17, i*17, i*17) for i in range(16)]
        else:
            palette = [(i*85, i*85, i*85) for i in range(4)]
    
    tile_bytes = 32 if bpp == 4 else 16
    decode_fn = decode_4bpp_tile if bpp == 4 else decode_2bpp_tile
    
    rows = (num_tiles + tpr - 1) // tpr
    w, h = tpr * 8, rows * 8
    img = Image.new('RGBA', (w, h), (*bg_color, 255))
    
    for i in range(num_tiles):
        off = start + i * tile_bytes
        if off + tile_bytes > len(rom_data):
            break
        pixels = decode_fn(rom_data, off)
        tx, ty = (i % tpr) * 8, (i // tpr) * 8
        for r in range(8):
            for c in range(8):
                idx = pixels[r][c]
                if idx == 0:
                    continue  # transparent
                color = palette[idx % len(palette)]
                img.putpixel((tx + c, ty + r), (*color, 255))
    
    if scale > 1:
        img = img.resize((w * scale, h * scale), Image.NEAREST)
    return img


def find_text_strings(data, min_len=4):
    """Find ASCII text strings in ROM."""
    strings = []
    current = ""
    start = 0
    for i, b in enumerate(data):
        if 32 <= b < 127:
            if not current:
                start = i
            current += chr(b)
        else:
            if len(current) >= min_len:
                strings.append((start, current))
            current = ""
    return strings


def try_konami_decompress(data, offset, max_output=0x10000):
    """
    Attempt to decompress Konami LZSS-style compressed data.
    Konami SNES games typically use a variant of LZSS compression.
    
    Common format:
    - Header: 2 bytes = decompressed size (little-endian)
    - Then bitfield-driven: 
      - bit=1: literal byte
      - bit=0: backreference (offset, length)
    """
    output = bytearray()
    
    if offset + 2 >= len(data):
        return None
    
    decomp_size = struct.unpack_from('<H', data, offset)[0]
    if decomp_size == 0 or decomp_size > max_output:
        return None
    
    pos = offset + 2
    
    try:
        while len(output) < decomp_size and pos < len(data):
            flags = data[pos]
            pos += 1
            
            for bit in range(8):
                if len(output) >= decomp_size:
                    break
                if pos >= len(data):
                    break
                
                if flags & (1 << bit):
                    # Literal byte
                    output.append(data[pos])
                    pos += 1
                else:
                    # Back reference
                    if pos + 1 >= len(data):
                        break
                    b1 = data[pos]
                    b2 = data[pos + 1]
                    pos += 2
                    
                    length = (b2 & 0x0F) + 3
                    back_offset = ((b2 & 0xF0) << 4) | b1
                    
                    if back_offset == 0:
                        break
                    
                    for _ in range(length):
                        if len(output) >= decomp_size:
                            break
                        if back_offset <= len(output):
                            output.append(output[-back_offset])
                        else:
                            output.append(0)
        
        if len(output) >= decomp_size * 0.5:
            return bytes(output)
    except:
        pass
    
    return None


# ============================================================
# 1. EXTRACT TEXT STRINGS FROM ROM
# ============================================================
print("=== 1. TEXT STRINGS FOUND IN ROM ===")
strings = find_text_strings(rom, min_len=5)
interesting_strings = [(off, s) for off, s in strings if any(
    keyword in s.upper() for keyword in [
        'BRAZIL', 'ARGEN', 'ITALY', 'GERMANY', 'GOAL', 'MATCH',
        'PLAYER', 'TEAM', 'KONAMI', 'SOCCER', 'SUPER', 'INTER',
        'DELUXE', 'WORLD', 'CUP', 'LEAGUE', 'SCORE', 'TIME',
        'HALF', 'SHOOT', 'PASS', 'KICK', 'FOUL', 'PENALTY',
        'CORNER', 'OFFSIDE', 'FORMATION', 'TACTICS',
        'OPTION', 'START', 'SELECT', 'MENU', 'SAVE', 'LOAD',
        'NAME', 'SUBSTITUT'
    ]
)]

# Also grab all strings for reference
with open(f"{OUTPUT_DIR}/all_strings.txt", 'w') as f:
    for off, s in strings:
        f.write(f"0x{off:06X}: {s}\n")
        
print(f"Total strings: {len(strings)}")
print(f"Game-related strings: {len(interesting_strings)}")
for off, s in interesting_strings[:80]:
    print(f"  0x{off:06X}: {s}")


# ============================================================
# 2. EXTRACT THE FONT/TEXT REGION IN DETAIL (0x0C0000+)
# ============================================================
print("\n=== 2. FONT & UI TILES (Detail) ===")

# The 0x0C0000 region clearly had readable text/numbers
# Let's extract subsections more carefully

# Green/white palette for text (typical Konami soccer)
text_palette = [
    (0, 48, 0),       # 0 bg dark green
    (255, 255, 255),   # 1 white
    (200, 200, 200),   # 2 light gray
    (160, 160, 160),   # 3 gray
    (120, 120, 120),   # 4 
    (80, 80, 80),      # 5
    (255, 255, 0),     # 6 yellow
    (255, 200, 0),     # 7
    (255, 128, 0),     # 8 orange
    (255, 0, 0),       # 9 red
    (0, 128, 255),     # 10 blue
    (0, 200, 0),       # 11 green
    (200, 150, 100),   # 12 skin
    (255, 220, 180),   # 13 light skin
    (40, 40, 40),      # 14 dark
    (0, 0, 0),         # 15 black
]

# Extract multiple sub-regions from the font area
font_offsets = [
    (0x0CC000, 512, "font_upper"),
    (0x0D0000, 512, "font_mid"),
    (0x0D4000, 512, "font_numbers"),
    (0x0D8000, 512, "font_lower"),
    (0x0DC000, 512, "ui_elements"),
]

for start, ntiles, name in font_offsets:
    if start + ntiles * 32 <= len(rom):
        img = tiles_to_image(rom, start, ntiles, tpr=16, bpp=4, palette=text_palette, scale=4)
        img.save(f"{OUTPUT_DIR}/{name}_0x{start:06X}.png")
        print(f"  {name}: saved ({ntiles} tiles)")


# ============================================================
# 3. SCAN FOR UNCOMPRESSED SPRITE REGIONS
# ============================================================
print("\n=== 3. SPRITE-QUALITY TILE REGIONS ===")

# Score each 32-byte tile on how "sprite-like" it is
def tile_quality_score(data, offset):
    """
    Score how likely a 32-byte chunk is a real 4bpp sprite tile.
    Good sprites have: moderate fill, some symmetry, not random noise.
    """
    if offset + 32 > len(data):
        return 0
    
    pixels = decode_4bpp_tile(data, offset)
    flat = [p for row in pixels for p in row]
    
    # Count non-zero pixels
    nonzero = sum(1 for p in flat if p != 0)
    if nonzero == 0 or nonzero == 64:
        return 0  # empty or full = not interesting
    
    # Count unique colors used
    unique = len(set(flat))
    if unique < 2 or unique > 12:
        return 0
    
    # Check for some row continuity (real sprites have coherent rows)
    continuity = 0
    for row in pixels:
        for i in range(1, 8):
            if row[i] == row[i-1] and row[i] != 0:
                continuity += 1
    
    fill_ratio = nonzero / 64
    score = 0
    if 0.1 < fill_ratio < 0.9:
        score += 10
    score += min(continuity, 20)
    score += unique * 2
    
    return score


# Find the best sprite regions
print("  Scanning entire ROM for high-quality tile regions...")
block_scores = []
BLOCK = 2048  # 64 tiles

for offset in range(0, len(rom) - BLOCK, BLOCK):
    total_score = 0
    for t in range(64):
        total_score += tile_quality_score(rom, offset + t * 32)
    block_scores.append((offset, total_score))

block_scores.sort(key=lambda x: x[1], reverse=True)

print(f"  Top 20 sprite regions:")
for i, (offset, score) in enumerate(block_scores[:20]):
    ntiles = BLOCK // 32
    img = tiles_to_image(rom, offset, ntiles, tpr=16, bpp=4, scale=4)
    fname = f"{OUTPUT_DIR}/best_sprites_{i:02d}_0x{offset:06X}_s{score}.png"
    img.save(fname)
    print(f"    #{i}: 0x{offset:06X} (score={score})")


# ============================================================
# 4. TRY DECOMPRESSION AT VARIOUS OFFSETS
# ============================================================
print("\n=== 4. ATTEMPTING KONAMI DECOMPRESSION ===")

decomp_count = 0
for offset in range(0, len(rom) - 2, 256):
    result = try_konami_decompress(rom, offset)
    if result and len(result) >= 256:
        # Check if decompressed data looks like tiles
        score = 0
        for t in range(min(8, len(result) // 32)):
            score += tile_quality_score(result, t * 32)
        
        if score > 50:
            ntiles = len(result) // 32
            if ntiles >= 4:
                img = tiles_to_image(result, 0, ntiles, tpr=16, bpp=4, scale=4)
                fname = f"{OUTPUT_DIR}/decomp_{decomp_count:02d}_0x{offset:06X}.png"
                img.save(fname)
                print(f"  Decompressed at 0x{offset:06X}: {len(result)} bytes, {ntiles} tiles, score={score}")
                decomp_count += 1
                
                if decomp_count >= 30:
                    break

print(f"  Total decompressed regions: {decomp_count}")


# ============================================================
# 5. EXTRACT ALL PALETTES AND RENDER BEST TILES WITH THEM
# ============================================================
print("\n=== 5. PALETTE-ACCURATE RENDERS ===")

# Find strong palettes (with black as first color)
good_palettes = []
for offset in range(0, len(rom) - 32, 2):
    first = struct.unpack_from('<H', rom, offset)[0]
    if first != 0:
        continue
    
    valid = True
    non_zero = 0
    colors = []
    for i in range(16):
        c = struct.unpack_from('<H', rom, offset + i * 2)[0]
        if c > 0x7FFF:
            valid = False
            break
        if c != 0:
            non_zero += 1
        r = (c & 0x1F) << 3
        g = ((c >> 5) & 0x1F) << 3
        b = ((c >> 10) & 0x1F) << 3
        colors.append((r, g, b))
    
    if valid and non_zero >= 6:
        unique = len(set(colors))
        if unique >= 6:
            good_palettes.append((offset, colors, unique))

good_palettes.sort(key=lambda x: x[2], reverse=True)
print(f"  Found {len(good_palettes)} good palettes")

# Render the top sprite region with the top palettes
top_regions = block_scores[:5]
for pi, (pal_off, pal_colors, unique) in enumerate(good_palettes[:10]):
    # Create palette swatch
    swatch = Image.new('RGB', (256, 32))
    for i, (r, g, b) in enumerate(pal_colors):
        for x in range(16):
            for y in range(32):
                swatch.putpixel((i * 16 + x, y), (r, g, b))
    swatch.save(f"{OUTPUT_DIR}/pal_swatch_{pi:02d}_0x{pal_off:06X}.png")
    
    for ri, (reg_off, _) in enumerate(top_regions):
        ntiles = min(256, (len(rom) - reg_off) // 32)
        img = tiles_to_image(rom, reg_off, ntiles, tpr=16, bpp=4, 
                           palette=pal_colors, scale=3, bg_color=(0, 48, 16))
        fname = f"{OUTPUT_DIR}/render_pal{pi:02d}_reg{ri:02d}.png"
        img.save(fname)

print(f"  Rendered {min(10, len(good_palettes))} palettes × {len(top_regions)} regions")


# ============================================================
# 6. ROM MAP SUMMARY
# ============================================================
print("\n=== 6. ROM STRUCTURE MAP ===")

# Categorize each 4KB block
for offset in range(0, len(rom), 0x1000):
    chunk = rom[offset:offset + 0x1000]
    zeros = sum(1 for b in chunk if b == 0)
    ffs = sum(1 for b in chunk if b == 255)
    
    total = len(chunk)
    if zeros > total * 0.9:
        cat = "EMPTY"
    elif ffs > total * 0.9:
        cat = "EMPTY(FF)"
    else:
        # Check if it looks like code (65816)
        # Code tends to have many bytes in 0x00-0x7F range
        code_like = sum(1 for b in chunk if b < 0x80)
        if code_like > total * 0.7:
            cat = "CODE/DATA"
        else:
            cat = "GFX/COMPRESSED"
    
    if offset % 0x10000 == 0:
        print(f"  Bank 0x{offset:06X}-0x{offset+0xFFFF:06X}: ", end="")
        # Categorize the whole 64KB bank
        bank = rom[offset:offset + 0x10000]
        bank_zeros = sum(1 for b in bank if b == 0)
        bank_ffs = sum(1 for b in bank if b == 255)
        bank_code = sum(1 for b in bank if b < 0x80)
        
        if bank_zeros > len(bank) * 0.8:
            print("MOSTLY EMPTY")
        elif bank_ffs > len(bank) * 0.8:
            print("MOSTLY EMPTY (0xFF)")
        elif bank_code > len(bank) * 0.65:
            print("CODE/TABLES")
        else:
            print("GRAPHICS/COMPRESSED DATA")


print(f"\n=== Done! Total files: {len(os.listdir(OUTPUT_DIR))} ===")
