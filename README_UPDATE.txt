K & A Designers — Light Studio Update (Reference: elearning.company About)

What changed:
- Switched global theme to light studio palette (off-white background, dark text, soft borders)
- Increased global gutters/margins so content doesn't hug the viewport
- Rebuilt PersonCard portraits with controlled aspect-ratio frames + object-fit cover
- Wired placeholder photos:
  - /public/images/people/alex.jpg
  - /public/images/people/kristina.jpg
  - plus extras in /public/images/placeholders/
- Added optional `image` field to people content schema + frontmatter

Files updated:
- src/styles/global.css
- src/components/PersonCard.astro
- src/pages/index.astro
- src/content/config.ts
- src/content/people/*.md
- public/images/people/*
- public/images/placeholders/*

Commit message:
git add .
git commit -m "Light studio theme + controlled portrait frames"
git push
