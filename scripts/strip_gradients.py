import os
import re

directory = '/Users/dudujarra/Documents/ELIFOOT/src/components/'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Match the background style block, which looks like:
    # backgroundImage: `linear-gradient(to bottom, rgba(...), rgba(...)), url(${bgName})`,
    # backgroundSize: 'cover',
    # backgroundPosition: 'center',
    # backgroundAttachment: 'fixed',
    # minHeight: '100dvh',
    # padding: '16px',
    # color: 'var(--ef-color-neutral-text-hi)'

    # We will use regex to find the background-image line and replace it, and inject the new lines.
    pattern = r"backgroundImage:\s*`linear-gradient\([^)]+\),\s*rgba\([^)]+\)\),\s*url\(\$\{([^}]+)\}\)`,"

    def repl(match):
        bg_var = match.group(1)
        return (f"backgroundImage: `url(${{{bg_var}}})`,\n"
                f"            backgroundSize: 'cover',\n"
                f"            backgroundPosition: 'center',\n"
                f"            backgroundAttachment: 'fixed',\n"
                f"            imageRendering: 'pixelated',\n"
                f"            WebkitImageRendering: 'pixelated',\n"
                f"            minHeight: '100dvh',\n"
                f"            padding: '16px',\n"
                f"            color: 'var(--ef-color-neutral-text-hi)',\n"
                f"            backgroundColor: '#0A130E'")

    # This regex is a bit tricky because of nested parens in rgba.
    # Let's try a simpler one: match the entire linear-gradient up to url
    pattern2 = r"backgroundImage:\s*`linear-gradient\([^`]+url\(\$\{([^}]+)\}\)`,"
    
    new_content, count = re.subn(pattern2, repl, content)

    if count > 0:
        # We also need to remove the duplicate standard background props since we injected them to avoid trailing comma issues if the original had them.
        # Wait, if we replace JUST the backgroundImage line, we can just replace that line.
        
        def repl2(m):
            bg_var = m.group(1)
            return (f"backgroundImage: `url(${{{bg_var}}})`,\n"
                    f"            imageRendering: 'pixelated',\n"
                    f"            WebkitImageRendering: 'pixelated',\n"
                    f"            backgroundColor: '#0A130E',")
            
        # Instead, let's just replace the single line
        new_content, count2 = re.subn(pattern2, repl2, content)
        
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath} ({count2} replacements)")

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx') and file != 'MatchView.jsx' and file != 'DashboardView.jsx':
            process_file(os.path.join(root, file))
