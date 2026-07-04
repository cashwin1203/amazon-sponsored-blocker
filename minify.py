import os
import re
import shutil

def minify_js(content):
    # Remove single line comments (but preserve URL protocols)
    content = re.sub(r'(?<!:)\/\/.*$', '', content, flags=re.MULTILINE)
    # Remove block comments
    content = re.sub(r'\/\*[\s\S]*?\*\/', '', content)
    # Compress multiple whitespaces into a single space
    content = re.sub(r'[ \t]+', ' ', content)
    # Remove spaces around operators and punctuations
    content = re.sub(r'\s*([=+\-*/{}()\[\];,.:<>?!&|])\s*', r'\1', content)
    # Remove duplicate newlines
    content = re.sub(r'\n+', '\n', content).strip()
    return content

def minify_css(content):
    # Remove comments
    content = re.sub(r'\/\*[\s\S]*?\*\/', '', content)
    # Compress spaces
    content = re.sub(r'\s+', ' ', content)
    # Remove spaces around punctuation/braces
    content = re.sub(r'\s*([{}():;,])\s*', r'\1', content)
    return content.strip()

def run_build():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    src_dir = os.path.join(base_dir, 'src')
    dist_dir = os.path.join(base_dir, 'dist')
    
    # Create distribution structure
    os.makedirs(os.path.join(dist_dir, 'popup'), exist_ok=True)
    os.makedirs(os.path.join(dist_dir, 'scripts'), exist_ok=True)
    os.makedirs(os.path.join(dist_dir, 'icons'), exist_ok=True)
    
    print("Building and minifying project files from src/ to dist/...")
    
    # Minify/Copy JS scripts
    js_files = [
        ('popup/popup.js', 'popup/popup.js'),
        ('scripts/background.js', 'scripts/background.js'),
        ('scripts/content.js', 'scripts/content.js')
    ]
    for src_rel, dist_rel in js_files:
        with open(os.path.join(src_dir, src_rel), 'r', encoding='utf-8') as f:
            content = f.read()
        minified = minify_js(content)
        with open(os.path.join(dist_dir, dist_rel), 'w', encoding='utf-8') as f:
            f.write(minified)
        print(f"Minified JS: {src_rel}")
        
    # Minify CSS
    css_files = [
        ('popup/popup.css', 'popup/popup.css')
    ]
    for src_rel, dist_rel in css_files:
        with open(os.path.join(src_dir, src_rel), 'r', encoding='utf-8') as f:
            css = f.read()
        minified_css = minify_css(css)
        with open(os.path.join(dist_dir, dist_rel), 'w', encoding='utf-8') as f:
            f.write(minified_css)
        print(f"Minified CSS: {src_rel}")
    
    # Copy HTML (trimming redundant space)
    with open(os.path.join(src_dir, 'popup/popup.html'), 'r', encoding='utf-8') as f:
        html = f.read()
    trimmed_html = re.sub(r'\s+', ' ', html)
    with open(os.path.join(dist_dir, 'popup/popup.html'), 'w', encoding='utf-8') as f:
        f.write(trimmed_html)
    print("Copied & Cleaned: popup/popup.html")
    
    # Copy manifest
    shutil.copy2(os.path.join(src_dir, 'manifest.json'), os.path.join(dist_dir, 'manifest.json'))
    print("Copied: manifest.json")
    
    # Copy Icons
    for size in [16, 48, 128]:
        icon_name = f'icon{size}.png'
        src_icon = os.path.join(base_dir, 'icons', icon_name)
        dist_icon = os.path.join(dist_dir, 'icons', icon_name)
        if os.path.exists(src_icon):
            shutil.copy2(src_icon, dist_icon)
            print(f"Copied icon: {icon_name}")
        else:
            print(f"Warning: Icon {icon_name} not found in root icons/ directory")
            
    print("\nBuild Completed Successfully! Production distribution is ready in dist/")

if __name__ == '__main__':
    run_build()
