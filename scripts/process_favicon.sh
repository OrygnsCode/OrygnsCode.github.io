#!/bin/bash

# Paths
BASE_TRANSPARENT="/Users/daniel/.gemini/antigravity/brain/5cde5b22-2d7f-403f-9d9b-23161f834aae/favicon_refined_base_1764024833260.png"
BASE_DARK="/Users/daniel/.gemini/antigravity/brain/5cde5b22-2d7f-403f-9d9b-23161f834aae/favicon_dark_base_1764024117369.png"
OUTPUT_DIR="/Users/daniel/Downloads/oryscodeantigrav/OrygnsCode.github.io/assets/icons"

mkdir -p "$OUTPUT_DIR"

SIZES=(16 32 64 128 256)

# Resize Transparent
for size in "${SIZES[@]}"; do
    sips -z $size $size "$BASE_TRANSPARENT" --out "$OUTPUT_DIR/favicon-$size.png"
done

# Resize Dark
for size in "${SIZES[@]}"; do
    sips -z $size $size "$BASE_DARK" --out "$OUTPUT_DIR/favicon-dark-$size.png"
done

echo "Favicon processing complete."
