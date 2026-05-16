#!/usr/bin/env python3
"""
ISSD Smart Palette Matcher — finds the best palette for each tile region
by searching nearby ROM offsets and scoring visual quality.
"""
import struct
import os
from PIL import Image

# Reuse the decoders from konami_extract.py
WINDOW_SIZE = 0x400

def decode_4bpp_tile(data, offset=0):
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


def extract_palette(data, offset, num_colors=16):
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


def tiles_to_image(tile_data, tpr=16, palette=None, scale=3, bg=(30, 30, 30)):
    num_tiles = len(tile_data) // 32
    if num_tiles == 0:
        return None
    if palette is None:
        palette = [(i*17, i*17, i*17) for i in range(16)]
    rows = (num_tiles + tpr - 1) // tpr
    w, h = tpr * 8, rows * 8
    img = Image.new('RGBA', (w, h), (*bg, 255))
    for i in range(num_tiles):
        off = i * 32
        if off + 32 > len(tile_data):
            break
        pixels = decode_4bpp_tile(tile_data, off)
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


def palette_visual_score(tile_data, palette, sample_tiles=16):
    """
    Score how 'natural' a palette looks when applied to tiles.
    Favors palettes with:
    - Skin tones present
    - Green (field) present 
    - Blue/red/white (uniforms)
    - Good contrast between adjacent indices
    """
    score = 0
    
    # Check palette has good contrast
    for i in range(1, len(palette)):
        r1, g1, b1 = palette[i]
        r0, g0, b0 = palette[i-1]
        diff = abs(r1-r0) + abs(g1-g0) + abs(b1-b0)
        if diff > 30:
            score += 2
    
    # Bonus for having skin-like colors
    for r, g, b in palette:
        if 160 < r < 255 and 120 < g < 220 and 80 < b < 180:
            if r > g > b:  # skin tone ordering
                score += 5
    
    # Bonus for having white/near-white
    for r, g, b in palette:
        if r > 200 and g > 200 and b > 200:
            score += 3
            break
    
    # Bonus for green (field)
    for r, g, b in palette:
        if g > 100 and g > r and g > b:
            score += 3
            break
    
    # Check that non-transparent colors in tiles hit varied palette entries
    used_indices = set()
    for t in range(min(sample_tiles, len(tile_data) // 32)):
        try:
            pixels = decode_4bpp_tile(tile_data, t * 32)
            for row in pixels:
                for p in row:
                    if p != 0:
                        used_indices.add(p)
        except:
            pass
    
    # More used indices = better palette match
    score += len(used_indices) * 3
    
    return score


def find_all_palettes(rom, stride=2):
    """Find all valid 16-color SNES palettes in ROM."""
    palettes = []
    for off in range(0, len(rom) - 32, stride):
        first = struct.unpack_from('<H', rom, off)[0]
        if first != 0:
            continue
        
        valid = True
        nonzero = 0
        colors = []
        for i in range(16):
            c = struct.unpack_from('<H', rom, off + i * 2)[0]
            if c > 0x7FFF:
                valid = False
                break
            if c != 0:
                nonzero += 1
            r = (c & 0x1F) << 3
            g = ((c >> 5) & 0x1F) << 3
            b = ((c >> 10) & 0x1F) << 3
            colors.append((r, g, b))
        
        if valid and nonzero >= 6 and len(set(colors)) >= 6:
            palettes.append((off, colors))
    
    return palettes


def main():
    OUTPUT = "issd_best_sprites"
    os.makedirs(OUTPUT, exist_ok=True)
    
    rom_files = [
        ("International Superstar Soccer Deluxe (USA).sfc", "orig"),
        ("International Superstar Soccer Deluxe 30 years version .smc", "30yr"),
    ]
    
    # Top uncompressed sprite regions discovered in Phase 2
    sprite_regions = [
        (0x06C000, 0x1000, "player_sprites_A"),
        (0x06D000, 0x1000, "player_sprites_B"),
        (0x06E000, 0x1000, "player_sprites_C"),
        (0x06F000, 0x1000, "player_sprites_D"),
        (0x070000, 0x1000, "player_sprites_E"),
        (0x071000, 0x1000, "player_sprites_F"),
        (0x072000, 0x1000, "player_sprites_G"),
        (0x079000, 0x1000, "player_sprites_H"),
        (0x07D000, 0x1000, "player_sprites_I"),
        (0x084000, 0x1000, "player_anim_A"),
        (0x085000, 0x1000, "player_anim_B"),
        (0x097000, 0x1000, "misc_sprites"),
        (0x0AB000, 0x1000, "player_alt_A"),
        (0x0B5000, 0x1000, "player_alt_B"),
        (0x0B6000, 0x1000, "player_alt_C"),
        (0x119000, 0x1000, "field_tiles_A"),
        (0x11A000, 0x1000, "field_tiles_B"),
        (0x11D000, 0x1000, "field_tiles_C"),
        (0x159000, 0x1000, "bg_tiles_A"),
        (0x15D000, 0x1000, "bg_tiles_B"),
        # Bigger regions: grab 8KB (256 tiles)
        (0x06C000, 0x4000, "player_megasheet_1"),
        (0x070000, 0x4000, "player_megasheet_2"),
        (0x084000, 0x4000, "player_megasheet_3"),
        (0x0AB000, 0x4000, "player_megasheet_4"),
        (0x118000, 0x4000, "field_megasheet"),
        (0x158000, 0x4000, "bg_megasheet"),
    ]
    
    for rom_path, tag in rom_files:
        if not os.path.exists(rom_path):
            print(f"[SKIP] {rom_path}")
            continue
        
        with open(rom_path, 'rb') as f:
            rom = f.read()
        
        print(f"\n{'='*60}")
        print(f"ROM: {tag} ({len(rom)} bytes)")
        print(f"{'='*60}")
        
        # Find all palettes
        print("Finding palettes...")
        all_palettes = find_all_palettes(rom, stride=2)
        print(f"  {len(all_palettes)} palettes found")
        
        # For each sprite region, find the BEST palette
        for reg_off, reg_size, reg_name in sprite_regions:
            if reg_off + reg_size > len(rom):
                continue
            
            tile_data = rom[reg_off:reg_off + reg_size]
            
            # Score each palette against this tile region
            best_palettes = []
            for pal_off, pal_colors in all_palettes:
                score = palette_visual_score(tile_data, pal_colors)
                best_palettes.append((pal_off, pal_colors, score))
            
            best_palettes.sort(key=lambda x: x[2], reverse=True)
            
            # Also search for palettes NEAR the tile region (±64KB)
            near_palettes = []
            for pal_off, pal_colors in all_palettes:
                dist = abs(pal_off - reg_off)
                if dist < 0x10000:  # within 64KB
                    proximity_bonus = max(0, 20 - dist // 0x800)
                    score = palette_visual_score(tile_data, pal_colors) + proximity_bonus
                    near_palettes.append((pal_off, pal_colors, score, dist))
            
            near_palettes.sort(key=lambda x: x[2], reverse=True)
            
            # Render with top 5 global palettes + top 5 nearby palettes
            rendered = set()
            count = 0
            
            for source, candidates in [("best", best_palettes), ("near", near_palettes)]:
                for entry in candidates[:5]:
                    pal_off = entry[0]
                    pal_colors = entry[1]
                    
                    if pal_off in rendered:
                        continue
                    rendered.add(pal_off)
                    
                    img = tiles_to_image(tile_data, tpr=16, palette=pal_colors, scale=4)
                    if img:
                        fname = f"{OUTPUT}/{tag}_{reg_name}_{source}{count:02d}_pal0x{pal_off:06X}.png"
                        img.save(fname)
                        count += 1
            
            # Also render with grayscale for structure reference
            gray = [(i*17, i*17, i*17) for i in range(16)]
            img = tiles_to_image(tile_data, tpr=16, palette=gray, scale=4, bg=(20, 20, 20))
            if img:
                img.save(f"{OUTPUT}/{tag}_{reg_name}_grayscale.png")
            
            print(f"  {reg_name} (0x{reg_off:06X}): {count+1} renders")
        
        # ── BONUS: Palette swatches of top palettes ──
        print("\nGenerating palette swatches...")
        swatch_w = 256
        swatch_h = 600
        num_pals = min(30, len(all_palettes))
        swatch = Image.new('RGB', (swatch_w, num_pals * 20 + 20), (30, 30, 30))
        
        for pi in range(num_pals):
            pal_off, pal_colors = all_palettes[pi]
            y = pi * 20
            for ci, (r, g, b) in enumerate(pal_colors):
                for x in range(16):
                    for dy in range(18):
                        swatch.putpixel((ci * 16 + x, y + dy), (r, g, b))
        
        swatch.save(f"{OUTPUT}/{tag}_palette_swatches.png")
        print(f"  Saved palette swatch reference")
    
    total = len(os.listdir(OUTPUT))
    print(f"\n{'='*60}")
    print(f"DONE! {total} files in {OUTPUT}/")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
