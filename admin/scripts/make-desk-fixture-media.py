#!/usr/bin/env python3
"""Plain placeholder media for the local Post Desk fixture (seed/desk-fixture).
Labelled cards in the admin palette, small on purpose. Already committed, so
this only needs re-running to change them. Needs Pillow and ffmpeg.
  python scripts/make-desk-fixture-media.py
"""
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / 'seed/desk-fixture'
OUT.mkdir(parents=True, exist_ok=True)
INK, CANVAS, ACCENT, SUNK = (34, 28, 21), (248, 245, 242), (154, 52, 18), (239, 233, 226)

def font(size):
    for f in ('DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'arialbd.ttf'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()

def card(name, w, h, title, sub, bg=CANVAS, fg=INK):
    im = Image.new('RGB', (w, h), bg)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w, 18], fill=ACCENT)
    d.text((40, h // 2 - 70), title, font=font(54), fill=fg)
    d.text((40, h // 2 + 10), sub, font=font(28), fill=fg)
    d.text((40, h - 70), 'Local fixture, not a real post', font=font(22), fill=fg)
    im.save(OUT / name, 'JPEG', quality=70)
    return OUT / name

# Reel: 9:16 frames, then a 4 second video.
for i in range(1, 4):
    card(f'reel-{i}.jpg', 540, 960, 'Reel', f'Frame {i} of 3', bg=INK if i % 2 else SUNK, fg=CANVAS if i % 2 else INK)
card('reel-thumb.jpg', 540, 960, 'Reel cover', 'Thumbnail', bg=INK, fg=CANVAS)
# Carousel: three 4:5 slides; the Facebook version is a video of them.
for i in range(1, 4):
    card(f'slide-{i}.jpg', 540, 676, 'Carousel', f'Slide {i} of 3')
# LinkedIn document: two 4:5 pages.
for i in range(1, 3):
    card(f'li-{i}.jpg', 540, 676, 'LinkedIn', f'Page {i} of 2', bg=SUNK)
card('story.jpg', 540, 960, 'Story', 'Link sticker goes here', bg=SUNK)

def video(pattern, out, per=1.4):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', f'1/{per}', '-i', str(OUT / pattern),
                    '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '34', '-r', '15', '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart', str(OUT / out)], check=True)

video('reel-%d.jpg', 'reel.mp4')
video('slide-%d.jpg', 'carousel-fb.mp4')
for p in list(OUT.glob('reel-[0-9].jpg')):
    p.unlink()  # frames only feed the video
print('wrote fixture media into', OUT)
