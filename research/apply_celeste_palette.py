import os
from PIL import Image

def apply_palette_to_grayscale(img_path, output_path, palette_hex):
    """
    Takes a grayscale image and maps its values to a list of hex colors.
    palette_hex should be a list of 16 hex strings (e.g. '#000000', '#112233', ...).
    """
    img = Image.open(img_path).convert('L') # Ensure it's 8-bit grayscale
    
    # Convert hex to RGB tuples
    palette_rgb = []
    for hex_col in palette_hex:
        hex_col = hex_col.lstrip('#')
        palette_rgb.append(tuple(int(hex_col[i:i+2], 16) for i in (0, 2, 4)))
        
    # We need exactly 256 colors for a PIL palette mode image.
    # We will interpolate our 16 colors across the 256 grayscale values.
    flat_palette = []
    
    # Simple nearest-neighbor mapping: divide 256 by 16 = 16 values per color.
    # 0-15 = color 0, 16-31 = color 1, etc.
    for i in range(256):
        idx = min(15, i // 16)
        flat_palette.extend(palette_rgb[idx])
        
    # Create the palettized image
    palettized = img.copy()
    palettized.putpalette(flat_palette)
    
    # We don't want to save as P mode because we want to see it clearly anywhere,
    # convert back to RGB
    rgb_img = palettized.convert('RGB')
    
    # Keep transparency (index 0 is usually transparent in our grayscale, which is value 0)
    # Wait, our grayscale sprites from the previous script have transparency.
    # Let's open the original image to check for an alpha channel
    orig_img = Image.open(img_path)
    if orig_img.mode == 'RGBA':
        alpha = orig_img.split()[3]
        rgb_img.putalpha(alpha)
        
    rgb_img.save(output_path)
    print(f"Saved {output_path}")

def main():
    # A modern "Celeste" inspired palette (from darkest to lightest)
    # Deep purples/blues transitioning to vibrant magenta/teal/pink
    celeste_palette = [
        '#000000', # Transparent/Black
        '#1a0f2e', # Deep void purple
        '#2e1b4d', # Dark violet
        '#452873', # Royal purple
        '#6c2b75', # Deep magenta
        '#9e3373', # Raspberry
        '#d13b6d', # Vibrant pink
        '#f55866', # Coral pink
        '#f78d65', # Peach
        '#f5c57a', # Warm yellow
        '#8af0c0', # Mint green (Celeste hair dash color)
        '#4be3c9', # Cyan
        '#2ab5cc', # Mid blue
        '#1d7aa8', # Deep blue
        '#bedbf0', # Ice white/blue
        '#ffffff'  # Pure white
    ]
    
    input_dir = 'issd_best_sprites'
    output_dir = 'issd_celeste_concept'
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Let's test on a few grayscale megasheets
    targets = [
        '30yr_player_megasheet_1_grayscale.png',
        'orig_bg_megasheet_grayscale.png',
        '30yr_field_megasheet_grayscale.png'
    ]
    
    for target in targets:
        in_path = os.path.join(input_dir, target)
        if os.path.exists(in_path):
            out_path = os.path.join(output_dir, target.replace('grayscale', 'celeste'))
            apply_palette_to_grayscale(in_path, out_path, celeste_palette)

if __name__ == '__main__':
    main()
