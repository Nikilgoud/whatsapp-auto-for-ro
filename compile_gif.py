import sys
import os
from PIL import Image

def main():
    if len(sys.argv) < 3:
        print("Usage: compile_gif.py <frames_dir> <output_path> [duration_ms]")
        sys.exit(1)
        
    frames_dir = sys.argv[1]
    output_path = sys.argv[2]
    duration_ms = int(sys.argv[3]) if len(sys.argv) > 3 else 300

    files = sorted([f for f in os.listdir(frames_dir) if f.endswith('.png')])
    if not files:
        print(f"No PNG frames found in {frames_dir}")
        sys.exit(1)

    images = []
    for f in files:
        img_path = os.path.join(frames_dir, f)
        img = Image.open(img_path)
        w, h = img.size
        # Rescale slightly for optimal web / ad speed
        img = img.resize((int(w * 0.75), int(h * 0.75)), Image.Resampling.LANCZOS)
        images.append(img.convert('P', palette=Image.Palette.ADAPTIVE, colors=128))

    images[0].save(
        output_path,
        save_all=True,
        append_images=images[1:],
        optimize=True,
        duration=duration_ms,
        loop=0
    )
    print(f"Successfully compiled {output_path} ({len(images)} frames)")

if __name__ == '__main__':
    main()
