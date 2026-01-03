<<<<<<< HEAD
Phase 1 Push 4: Portrait panels + nav simplification

Changes:
- Added portrait support to people profiles (image field in content schema + frontmatter).
- Added placeholder images in public/images/people/.
- Updated PersonCard component to include portrait + studio styling.
- Increased global side gutters so content isn't tight to the edges.
- Simplified nav: Home, Alex, Kristina, Contact.

Commit:
git add .
git commit -m "Phase 1 Push 4: portraits + nav simplification + spacing"
git push
=======
Phase 1 Push 4b
- Added consistent portrait frame to profile cards
- Wired one profile photo each (alex.jpg, kristina.jpg)
- Increased global side gutters via .container clamp()
Files changed:
- src/styles/global.css
- src/components/PersonCard.astro
- src/pages/index.astro
- src/content/people/alex.md
- src/content/people/kristina.md
- public/images/people/alex.jpg
- public/images/people/kristina.jpg
Commit message:
Phase 1 Push 4b: portraits + wider gutters
>>>>>>> b0f79ce (Phase 1 Push 4b: controlled portraits + wider gutters)
