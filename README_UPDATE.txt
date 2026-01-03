STOPPING POINT — Deployable Build

This zip contains:
- Fixed YAML/frontmatter duplicate keys in src/content/people/alex.md and kristina.md (Cloudflare build blocker)
- Cache-busted global.css link to force refresh: /styles/global.css?v=LIGHT1
- Removed local-only folders from zip: .git/, node_modules/, dist/

Next steps:
1) Unzip -> kandadesigners/
2) Copy contents into your real repo folder (overwrite)
3) In repo:
   git add .
   git commit -m "Fix people frontmatter + cache bust css"
   git push

Cloudflare should now build and deploy.
