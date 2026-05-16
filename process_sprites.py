import sys
from PIL import Image
import numpy as np

def process_spritesheet(input_path, output_prefix, rows, cols):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        data = np.array(img)
        
        # Get background color from top-left pixel
        bg_color = data[0, 0].copy()
        
        # Create a mask for pixels that are similar to the background
        # Allow some tolerance for JPEG/AI artifacts
        tolerance = 20
        diff = np.abs(data[:, :, :3].astype(int) - bg_color[:3].astype(int))
        mask = np.all(diff < tolerance, axis=2)
        
        # Also remove grid lines (usually pure black or very dark grey) if they exist
        black_tolerance = 30
        black_mask = np.all(data[:, :, :3] < black_tolerance, axis=2)
        
        data[mask] = [0, 0, 0, 0]
        data[black_mask] = [0, 0, 0, 0]
        
        # Save the full transparent spritesheet
        transparent_img = Image.fromarray(data)
        transparent_img.save(f"{output_prefix}_transparent.png")
        print(f"Saved {output_prefix}_transparent.png")
        
        # Calculate cell width and height
        width, height = transparent_img.size
        cell_w = width // cols
        cell_h = height // rows
        
        actions = ["sprint", "kicking", "bicycle", "tackle", "fall", "celebration", "save", "freekick"]
        
        for r in range(min(rows, len(actions))):
            frames = []
            for c in range(cols):
                box = (c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h)
                frame = transparent_img.crop(box)
                frames.append(frame)
            
            # Save as GIF
            gif_path = f"{output_prefix}_{actions[r]}.gif"
            frames[0].save(
                gif_path,
                save_all=True,
                append_images=frames[1:],
                duration=100, # 100ms per frame
                loop=0,
                disposal=2,
                transparency=0
            )
            print(f"Saved {gif_path}")
            
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

# Assuming 1024x1024, usually the AI generates 6 columns and 8 rows (or 6x6)
process_spritesheet("/Users/dudujarra/Documents/ELIFOOT/public/assets/sprites/player_red.png", "/Users/dudujarra/Documents/ELIFOOT/public/assets/sprites/red", 6, 6)
process_spritesheet("/Users/dudujarra/Documents/ELIFOOT/public/assets/sprites/player_blue.png", "/Users/dudujarra/Documents/ELIFOOT/public/assets/sprites/blue", 6, 6)
process_spritesheet("/Users/dudujarra/Documents/ELIFOOT/public/assets/sprites/referee_dog.png", "/Users/dudujarra/Documents/ELIFOOT/public/assets/sprites/referee", 3, 6)

