from PIL import Image, ImageOps
import os

# Paths
base_icon_path = "/Users/daniel/.gemini/antigravity/brain/5cde5b22-2d7f-403f-9d9b-23161f834aae/favicon_base_1764024042519.png"
output_dir = "/Users/daniel/Downloads/oryscodeantigrav/OrygnsCode.github.io/assets/icons"

# Ensure output directory exists
os.makedirs(output_dir, exist_ok=True)

# Sizes
sizes = [16, 32, 64, 128, 256]

try:
    # Open base image
    img = Image.open(base_icon_path).convert("RGBA")
    
    # Process Transparent Versions
    for size in sizes:
        resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
        output_path = os.path.join(output_dir, f"favicon-{size}.png")
        resized_img.save(output_path)
        print(f"Saved {output_path}")

    # Process Dark Background Versions
    # Create a dark background color (black or very dark gray)
    bg_color = (5, 5, 5, 255) # #050505
    
    for size in sizes:
        # Create new image with background
        bg_img = Image.new("RGBA", (size, size), bg_color)
        
        # Resize original image to fit slightly smaller to have padding? 
        # Or just composite. Let's composite directly.
        resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Composite
        final_img = Image.alpha_composite(bg_img, resized_img)
        
        output_path = os.path.join(output_dir, f"favicon-dark-{size}.png")
        final_img.save(output_path)
        print(f"Saved {output_path}")

    print("Favicon processing complete.")

except Exception as e:
    print(f"Error processing favicon: {e}")
