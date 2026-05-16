#!/usr/bin/env python3
"""
ISSD ROM Graphics Extractor — Konami SNES decompressor (ported from C++)
Based on ProtonNoir's Konami SNES decompressor v1.02
https://github.com/ProtonNoir/SNES-decompression-tools

Scans both ROM files for compressed graphics and renders tiles.
"""
import struct
import os
import sys
from PIL import Image

WINDOW_SIZE = 0x400
DATA_SIZE = 0x10000

# ─── Konami Decompressor ─────────────────────────────────────────────

def konami_decompress(data, offset, game_type=1):
    """
    Decompress Konami-compressed data from ROM.
    
    Args:
        data: ROM bytes
        offset: Start offset of compressed block
        game_type: 0 or 1 (affects RLE_E0 handling)
    
    Returns:
        bytearray of decompressed data, or None on failure
    """
    if offset + 2 > len(data):
        return None
    
    # Read 2-byte header: compressed block size
    b1 = data[offset]
    b2 = data[offset + 1]
    comp_size = (b1 | (b2 << 8)) & 0x7FFF
    
    if comp_size < 3 or comp_size > DATA_SIZE:
        return None
    
    if offset + comp_size > len(data):
        return None
    
    # Copy input data
    in_buf = data[offset + 2 : offset + comp_size]
    if len(in_buf) < comp_size - 2:
        return None
    
    out_buf = bytearray()
    win_buf = bytearray(WINDOW_SIZE)
    
    in_pos = 0
    buf_pos = 0
    
    try:
        while in_pos < len(in_buf) and len(out_buf) < DATA_SIZE:
            ctrl = (in_buf[in_pos] >> 5) & 0x07
            
            if ctrl == 0x04:
                # RAW (0x80-0x9F): copy literal bytes
                cnt = in_buf[in_pos] & 0x1F
                in_pos += 1
                if cnt == 0:
                    continue
                for _ in range(cnt):
                    if in_pos >= len(in_buf):
                        return bytes(out_buf) if len(out_buf) > 0 else None
                    b = in_buf[in_pos]
                    out_buf.append(b)
                    win_buf[buf_pos] = b
                    buf_pos = (buf_pos + 1) % WINDOW_SIZE
                    in_pos += 1
            
            elif ctrl == 0x05:
                # RLE_A0 (0xA0-0xBF): pairs of (0x00, byte)
                cnt = (in_buf[in_pos] & 0x1F) + 2
                in_pos += 1
                for _ in range(cnt):
                    if in_pos >= len(in_buf):
                        return bytes(out_buf) if len(out_buf) > 0 else None
                    ch = in_buf[in_pos]
                    in_pos += 1
                    
                    win_buf[buf_pos] = 0x00
                    buf_pos = (buf_pos + 1) % WINDOW_SIZE
                    out_buf.append(0x00)
                    
                    win_buf[buf_pos] = ch
                    buf_pos = (buf_pos + 1) % WINDOW_SIZE
                    out_buf.append(ch)
            
            elif ctrl == 0x06:
                # RLE_C0 (0xC0-0xDF): repeat single byte
                cnt = (in_buf[in_pos] & 0x1F) + 2
                in_pos += 1
                if in_pos >= len(in_buf):
                    return bytes(out_buf) if len(out_buf) > 0 else None
                ch = in_buf[in_pos]
                in_pos += 1
                for _ in range(cnt):
                    out_buf.append(ch)
                    win_buf[buf_pos] = ch
                    buf_pos = (buf_pos + 1) % WINDOW_SIZE
            
            elif ctrl == 0x07:
                # RLE_E0 (0xE0-0xFF): repeat zeros
                if game_type == 0:
                    cnt = (in_buf[in_pos] & 0x1F) + 2
                    in_pos += 1
                    for _ in range(cnt):
                        win_buf[buf_pos] = 0x00
                        buf_pos = (buf_pos + 1) % WINDOW_SIZE
                        out_buf.append(0x00)
                else:
                    if in_buf[in_pos] != 0xFF:
                        cnt = (in_buf[in_pos] & 0x1F) + 2
                        in_pos += 1
                        for _ in range(cnt):
                            win_buf[buf_pos] = 0x00
                            buf_pos = (buf_pos + 1) % WINDOW_SIZE
                            out_buf.append(0x00)
                    else:
                        in_pos += 1
                        if in_pos >= len(in_buf):
                            return bytes(out_buf) if len(out_buf) > 0 else None
                        cnt = (in_buf[in_pos] & 0xFF) + 2
                        in_pos += 1
                        for _ in range(cnt):
                            win_buf[buf_pos] = 0x00
                            buf_pos = (buf_pos + 1) % WINDOW_SIZE
                            out_buf.append(0x00)
            
            else:
                # LZ (0x00-0x7F): back-reference from window
                lz1 = in_buf[in_pos]
                in_pos += 1
                if in_pos >= len(in_buf):
                    return bytes(out_buf) if len(out_buf) > 0 else None
                lz2 = in_buf[in_pos]
                in_pos += 1
                
                lz_len = (lz1 >> 2) + 2
                lz_off = ((lz1 << 8) | lz2) & 0x3FF
                lz_off = (lz_off - 0x3DF) & 0x3FF
                
                for _ in range(lz_len):
                    lz_off = lz_off % WINDOW_SIZE
                    b = win_buf[lz_off]
                    win_buf[buf_pos] = b
                    buf_pos = (buf_pos + 1) % WINDOW_SIZE
                    out_buf.append(b)
                    lz_off += 1
    
    except (IndexError, OverflowError):
        pass
    
    if len(out_buf) >= 32:
        return bytes(out_buf)
    return None


# ─── SNES Tile Decoders ──────────────────────────────────────────────

def decode_4bpp_tile(data, offset=0):
    """Decode SNES 4bpp 8x8 tile (32 bytes) to pixel indices."""
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
    """Decode SNES 2bpp 8x8 tile (16 bytes) to pixel indices."""
    pixels = [[0]*8 for _ in range(8)]
    for row in range(8):
        bp0 = data[offset + row * 2]
        bp1 = data[offset + row * 2 + 1]
        for col in range(8):
            bit = 7 - col
            pixel = ((bp0 >> bit) & 1) | (((bp1 >> bit) & 1) << 1)
            pixels[row][col] = pixel
    return pixels


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


# ─── Tile Renderer ───────────────────────────────────────────────────

def tiles_to_image(tile_data, tpr=16, bpp=4, palette=None, scale=3, bg_color=(30, 30, 30)):
    """Render tile data as an image."""
    tile_bytes = 32 if bpp == 4 else 16
    num_tiles = len(tile_data) // tile_bytes
    
    if num_tiles == 0:
        return None
    
    if palette is None:
        if bpp == 4:
            palette = [(i * 17, i * 17, i * 17) for i in range(16)]
        else:
            palette = [(i * 85, i * 85, i * 85) for i in range(4)]
    
    decode_fn = decode_4bpp_tile if bpp == 4 else decode_2bpp_tile
    
    rows = (num_tiles + tpr - 1) // tpr
    w, h = tpr * 8, rows * 8
    img = Image.new('RGBA', (w, h), (*bg_color, 255))
    
    for i in range(num_tiles):
        off = i * tile_bytes
        if off + tile_bytes > len(tile_data):
            break
        pixels = decode_fn(tile_data, off)
        tx, ty = (i % tpr) * 8, (i // tpr) * 8
        for r in range(8):
            for c in range(8):
                idx = pixels[r][c]
                if idx == 0:
                    continue
                color = palette[idx % len(palette)]
                img.putpixel((tx + c, ty + r), (*color, 255))
    
    if scale > 1:
        img = img.resize((w * scale, h * scale), Image.NEAREST)
    return img


def tile_quality_score(tile_data, offset):
    """Score how likely a region is actual sprite data (not noise)."""
    if offset + 32 > len(tile_data):
        return 0
    try:
        pixels = decode_4bpp_tile(tile_data, offset)
    except:
        return 0
    flat = [p for row in pixels for p in row]
    nonzero = sum(1 for p in flat if p != 0)
    if nonzero == 0 or nonzero >= 60:
        return 0
    unique = len(set(flat))
    if unique < 2 or unique > 13:
        return 0
    # Check row coherence
    coherence = 0
    for row in pixels:
        for i in range(1, 8):
            if row[i] == row[i - 1] and row[i] != 0:
                coherence += 1
    score = 0
    fill = nonzero / 64
    if 0.1 < fill < 0.85:
        score += 15
    score += min(coherence, 25)
    score += unique * 3
    return score


# ─── Palette presets ─────────────────────────────────────────────────

PALETTES = {
    'soccer_green': [
        (0, 48, 0), (255, 255, 255), (200, 220, 200), (0, 180, 0),
        (0, 128, 0), (0, 80, 0), (255, 255, 0), (255, 200, 0),
        (255, 128, 0), (255, 0, 0), (0, 0, 200), (128, 64, 0),
        (200, 150, 100), (255, 220, 180), (80, 80, 80), (0, 0, 0),
    ],
    'skin_tones': [
        (0, 0, 0), (255, 220, 180), (220, 180, 140), (180, 140, 100),
        (140, 100, 60), (255, 255, 255), (200, 0, 0), (0, 0, 180),
        (255, 255, 0), (0, 150, 0), (128, 128, 128), (80, 80, 80),
        (255, 200, 160), (160, 80, 40), (40, 40, 40), (200, 200, 200),
    ],
    'grayscale': [
        (0, 0, 0), (17, 17, 17), (34, 34, 34), (51, 51, 51),
        (68, 68, 68), (85, 85, 85), (102, 102, 102), (119, 119, 119),
        (136, 136, 136), (153, 153, 153), (170, 170, 170), (187, 187, 187),
        (204, 204, 204), (221, 221, 221), (238, 238, 238), (255, 255, 255),
    ],
    'konami_ui': [
        (0, 0, 48), (255, 255, 255), (200, 200, 220), (128, 128, 180),
        (80, 80, 140), (40, 40, 100), (255, 200, 0), (255, 128, 0),
        (255, 0, 0), (0, 200, 0), (0, 160, 255), (200, 200, 200),
        (120, 120, 120), (60, 60, 60), (255, 255, 128), (0, 0, 0),
    ],
}


# ─── Main ────────────────────────────────────────────────────────────

def main():
    OUTPUT_DIR = "issd_konami_extracted"
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    rom_files = [
        ("International Superstar Soccer Deluxe (USA).sfc", "original"),
        ("International Superstar Soccer Deluxe 30 years version .smc", "30yr"),
    ]
    
    for rom_path, tag in rom_files:
        if not os.path.exists(rom_path):
            print(f"[SKIP] {rom_path} not found")
            continue
        
        with open(rom_path, 'rb') as f:
            rom = f.read()
        
        print(f"\n{'='*70}")
        print(f"ROM: {rom_path} ({len(rom)} bytes)")
        print(f"{'='*70}")
        
        # ────────────────────────────────────────────────────────────
        # PHASE 1: Scan for Konami compressed blocks
        # ────────────────────────────────────────────────────────────
        print(f"\n--- Phase 1: Konami Decompression Scan ---")
        
        decomp_results = []
        
        # Scan every byte (compressed blocks can be at any offset)
        # But first try aligned offsets for speed
        scan_offsets = set()
        
        # Every 256 bytes (covers most aligned data)
        for off in range(0, len(rom) - 2, 256):
            scan_offsets.add(off)
        
        # Also check the diff regions of the 30yr hack
        diff_offsets = [
            0x184300, 0x12D0F0, 0x12DBB4, 0x176710, 0x12D52A,
            0x12EB3B, 0x12E9D2, 0x12DA3C, 0x12DF02, 0x12F0B4,
            0x03FEA0, 0x03FAC8, 0x04C428,
        ]
        for off in diff_offsets:
            for delta in range(-16, 17):
                if 0 <= off + delta < len(rom):
                    scan_offsets.add(off + delta)
        
        sorted_offsets = sorted(scan_offsets)
        total = len(sorted_offsets)
        
        for idx, offset in enumerate(sorted_offsets):
            if idx % 2000 == 0:
                print(f"  Scanning... {idx}/{total} ({idx*100//total}%)", end='\r')
            
            for game_type in [0, 1]:
                result = konami_decompress(rom, offset, game_type)
                if result and len(result) >= 64:
                    # Score the decompressed data
                    score = 0
                    tiles_scored = 0
                    for t in range(min(16, len(result) // 32)):
                        s = tile_quality_score(result, t * 32)
                        score += s
                        if s > 0:
                            tiles_scored += 1
                    
                    if score > 80 and tiles_scored >= 4:
                        decomp_results.append((offset, game_type, result, score, tiles_scored))
        
        print(f"\n  Found {len(decomp_results)} valid compressed graphics blocks")
        
        # Sort by score, best first
        decomp_results.sort(key=lambda x: x[3], reverse=True)
        
        # Render top results
        for i, (off, gtype, data, score, ntiles) in enumerate(decomp_results[:40]):
            num_tiles = len(data) // 32
            for pal_name, pal in PALETTES.items():
                img = tiles_to_image(data, tpr=16, bpp=4, palette=pal, scale=3)
                if img:
                    fname = f"{OUTPUT_DIR}/{tag}_decomp_{i:02d}_0x{off:06X}_t{gtype}_{pal_name}_s{score}.png"
                    img.save(fname)
            
            print(f"  #{i:02d}: offset=0x{off:06X} type={gtype} size={len(data)} tiles={num_tiles} score={score}")
        
        # ────────────────────────────────────────────────────────────
        # PHASE 2: Extract uncompressed tile regions with quality scoring
        # ────────────────────────────────────────────────────────────
        print(f"\n--- Phase 2: Uncompressed Tile Regions ---")
        
        BLOCK = 4096  # 128 tiles per block
        block_scores = []
        
        for offset in range(0, len(rom) - BLOCK, BLOCK):
            total_score = 0
            good_tiles = 0
            for t in range(128):
                s = tile_quality_score(rom, offset + t * 32)
                total_score += s
                if s > 5:
                    good_tiles += 1
            
            if total_score > 200 and good_tiles >= 16:
                block_scores.append((offset, total_score, good_tiles))
        
        block_scores.sort(key=lambda x: x[1], reverse=True)
        print(f"  Found {len(block_scores)} high-quality uncompressed regions")
        
        for i, (offset, score, good) in enumerate(block_scores[:20]):
            for pal_name, pal in PALETTES.items():
                img = tiles_to_image(rom[offset:offset + BLOCK], tpr=16, bpp=4, 
                                    palette=pal, scale=3)
                if img:
                    fname = f"{OUTPUT_DIR}/{tag}_raw_{i:02d}_0x{offset:06X}_s{score}_{pal_name}.png"
                    img.save(fname)
            
            print(f"  #{i:02d}: offset=0x{offset:06X} score={score} good_tiles={good}")
        
        # ────────────────────────────────────────────────────────────
        # PHASE 3: Extract real palettes from ROM and apply them
        # ────────────────────────────────────────────────────────────
        print(f"\n--- Phase 3: Real Palette Extraction ---")
        
        real_palettes = []
        for off in range(0, len(rom) - 32, 2):
            # A valid palette usually starts with 0x0000 (black/transparent)
            first = struct.unpack_from('<H', rom, off)[0]
            if first != 0:
                continue
            
            valid = True
            nonzero_count = 0
            colors = []
            for i in range(16):
                c = struct.unpack_from('<H', rom, off + i * 2)[0]
                if c > 0x7FFF:
                    valid = False
                    break
                if c != 0:
                    nonzero_count += 1
                r = (c & 0x1F) << 3
                g = ((c >> 5) & 0x1F) << 3
                b = ((c >> 10) & 0x1F) << 3
                colors.append((r, g, b))
            
            if valid and nonzero_count >= 8 and len(set(colors)) >= 8:
                real_palettes.append((off, colors))
        
        print(f"  Found {len(real_palettes)} real palettes in ROM")
        
        # Render top tile region with top palettes
        if block_scores and real_palettes:
            # Take top 3 regions
            for ri in range(min(3, len(block_scores))):
                reg_off, _, _ = block_scores[ri]
                region_data = rom[reg_off:reg_off + BLOCK]
                
                # Save palette swatch
                for pi in range(min(15, len(real_palettes))):
                    pal_off, pal_colors = real_palettes[pi]
                    
                    img = tiles_to_image(region_data, tpr=16, bpp=4, 
                                        palette=pal_colors, scale=3)
                    if img:
                        fname = f"{OUTPUT_DIR}/{tag}_realpal_r{ri}_p{pi:02d}_0x{pal_off:06X}.png"
                        img.save(fname)
                
                print(f"  Region #{ri} at 0x{reg_off:06X}: rendered with {min(15, len(real_palettes))} real palettes")
        
        # Also render decomp results with real palettes
        if decomp_results and real_palettes:
            for di in range(min(5, len(decomp_results))):
                off, gtype, data, score, _ = decomp_results[di]
                
                for pi in range(min(10, len(real_palettes))):
                    pal_off, pal_colors = real_palettes[pi]
                    img = tiles_to_image(data, tpr=16, bpp=4,
                                        palette=pal_colors, scale=3)
                    if img:
                        fname = f"{OUTPUT_DIR}/{tag}_decomp_realpal_d{di}_p{pi:02d}.png"
                        img.save(fname)
                
                print(f"  Decomp #{di} at 0x{off:06X}: rendered with real palettes")
    
    # Count output files
    out_files = os.listdir(OUTPUT_DIR)
    print(f"\n{'='*70}")
    print(f"DONE! Total files generated: {len(out_files)}")
    print(f"Output directory: {OUTPUT_DIR}/")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
