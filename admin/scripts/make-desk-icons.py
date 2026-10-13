#!/usr/bin/env python3
"""Post Desk PWA icons: the K&A ampersand on the admin's --canvas (#F8F5F2).

Source is the largest copy of the mark in the repo, the marketing site's
public/images/favicon-512.png (the same mark as admin/public/images/
favicon-192.png). The mark is cropped to its own bounds and only ever scaled
down, so every size is crisp. Maskable keeps it inside the 80% safe circle.
Icons are opaque (iOS fills transparency with black).
  python scripts/make-desk-icons.py
"""
from pathlib import Path
from PIL import Image, ImageChops

ADMIN = Path(__file__).resolve().parents[1]
SRC = ADMIN.parent / 'public/images/favicon-512.png'
OUT = ADMIN / 'public/images'
BG = (248, 245, 242)

src = Image.open(SRC).convert('RGB')
# Crop to the mark: everything that is not background.
diff = ImageChops.difference(src, Image.new('RGB', src.size, BG)).convert('L').point(lambda v: 255 if v > 12 else 0)
mark = src.crop(diff.getbbox())

def icon(size, frac):
    """Mark's longer side = frac of the icon, centred."""
    c = Image.new('RGB', (size, size), BG)
    m = mark.copy()
    scale = frac * size / max(m.size)
    m = m.resize((round(m.width * scale), round(m.height * scale)), Image.Resampling.LANCZOS)
    c.paste(m, ((size - m.width) // 2, (size - m.height) // 2))
    return c

icon(192, .72).save(OUT / 'desk-192.png', optimize=True)
icon(512, .72).save(OUT / 'desk-512.png', optimize=True)
# A square of side s fits the r = 0.4 safe circle when s <= 0.4 * 2 / sqrt(2) = 0.566.
icon(512, .54).save(OUT / 'desk-maskable-512.png', optimize=True)
icon(180, .70).save(OUT / 'apple-touch-icon-180.png', optimize=True)
print('wrote desk icons into', OUT)
