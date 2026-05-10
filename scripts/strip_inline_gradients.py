import os
import re

directory = '/Users/dudujarra/Documents/ELIFOOT/src/components/'

def replace_gradients_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    
    # Replace all instances of `linear-gradient(...)` with solid colors based on the first color.
    # Regex logic: find `linear-gradient(..., color1, ...)` and replace with just `color1`.
    # A generic approach:
    # `linear-gradient(..., rgba(...), ...)` -> we need a solid hex. Let's just hardcode the specific replacements since there are few.
    
    replacements = [
        (r"'linear-gradient\(90deg, #6ABC3A, #FFD700\)'", r"'#6ABC3A'"),
        (r"'linear-gradient\(90deg, #3A7DCE, #6ABC3A\)'", r"'#3A7DCE'"),
        (r"'linear-gradient\(90deg, #D62828, #6B0000\)'", r"'#D62828'"),
        (r"'linear-gradient\(135deg, #6ABC3A, #2D5A3D\)'", r"'#6ABC3A'"),
        (r"'linear-gradient\(180deg, #2D6A4F 0%, #1B4332 100%\)'", r"'#2D6A4F'"),
        (r"'linear-gradient\(90deg, rgba\(247,181,56,0\.15\), rgba\(106,188,58,0\.1\)\)'", r"'#3A2C11'"),
        (r"'linear-gradient\(180deg, #2D5A3D 0%, #6ABC3A 100%\)'", r"'#2D5A3D'"),
        (r"'linear-gradient\(135deg, rgba\(247,181,56,0\.1\), rgba\(15,26,20,0\.5\)\)'", r"'#1F1A10'"),
        (r"`linear-gradient\(135deg, \$\{colors\.bg\}22, transparent\)`", r"colors.bg")
    ]

    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Removed inline gradients in {filepath}")

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.css'):
            replace_gradients_in_file(os.path.join(root, file))
