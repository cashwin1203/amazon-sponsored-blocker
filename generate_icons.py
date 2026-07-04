import os
import zlib
import struct

def generate_fallback_png(width, height, r, g, b):
    # Pure Python PNG writer for solid color blocks
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('!IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = b'IHDR' + ihdr_data
    png += struct.pack('!I', len(ihdr_data)) + ihdr_chunk + struct.pack('!I', zlib.crc32(ihdr_chunk))
    
    # IDAT chunk
    # Filter byte 0 for each row, then pixel data (R, G, B)
    row = b'\x00' + bytes([r, g, b]) * width
    data = row * height
    idat_data = zlib.compress(data)
    idat_chunk = b'IDAT' + idat_data
    png += struct.pack('!I', len(idat_data)) + idat_chunk + struct.pack('!I', zlib.crc32(idat_chunk))
    
    # IEND chunk
    iend_chunk = b'IEND'
    png += struct.pack('!I', 0) + iend_chunk + struct.pack('!I', zlib.crc32(iend_chunk))
    return png

def create_icons():
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
    os.makedirs(icons_dir, exist_ok=True)
    
    sizes = [16, 48, 128]
    
    try:
        from PIL import Image, ImageDraw
        print("PIL detected! Generating premium gradient shield icons...")
        for size in sizes:
            # Create transparent image
            img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # Simple shield coordinates relative to size
            # Draw a beautiful shield shape
            padding = max(1, size // 8)
            cx, cy = size / 2, size / 2
            
            # Draw shield shape using points
            # Top-left, Top-right, Bottom-mid
            points = [
                (padding, padding + size // 5),
                (cx, padding),
                (size - padding, padding + size // 5),
                (size - padding, cy),
                (cx, size - padding),
                (padding, cy)
            ]
            
            # Draw gradient shield fill (cyan/teal to purple)
            draw.polygon(points, fill=(6, 182, 212, 255))
            
            # Draw a checkmark inside shield
            ck_points = [
                (cx - size // 6, cy),
                (cx - size // 18, cy + size // 6),
                (cx + size // 5, cy - size // 10)
            ]
            draw.line(ck_points, fill=(255, 255, 255, 255), width=max(1, size // 16), joint="round")
            
            img.save(os.path.join(icons_dir, f'icon{size}.png'))
            print(f"Generated icons/icon{size}.png (Premium)")
            
    except ImportError:
        print("PIL not found. Generating solid cyan fallback icons...")
        # Fallback to pure python solid cyan/teal icons
        for size in sizes:
            png_data = generate_fallback_png(size, size, 6, 182, 212)
            with open(os.path.join(icons_dir, f'icon{size}.png'), 'wb') as f:
                f.write(png_data)
            print(f"Generated icons/icon{size}.png (Solid Fallback)")

if __name__ == '__main__':
    create_icons()
