// Seed for the ka-sites database. Verified facts only: a field that could not
// be confirmed from the HANDOFF, the client's own repo config or the live site
// is left out, and Alex fills it in the app. Sources noted per site.
export default {
  people: [
    // Confirmed by Alex 2026-09-24: his Cloudflare Access sign-in email.
    { name: 'Alex Anderson', email: 'alex@ka-performancefl.com', role: 'owner' },
  ],
  sites: [
    {
      // Source: HANDOFF deploy runbook; this repo's git remote.
      slug: 'ka-performance',
      name: 'K & A Performance',
      live_url: 'https://ka-performancefl.com',
      repo: 'shizzoobies/kandadesigners',
      local_path: 'D:\\K & A Performance Site',
      hosting: 'pages',
      deploy_command: 'git push origin main',
      domain: 'ka-performancefl.com',
      a11y_statement_url: 'https://ka-performancefl.com/accessibility/',
    },
    {
      // Source: D:\ka-site-seo\src\data\work.js (portfolio entry "mbs-medicine");
      // D:\Skills\mbs-live\HANDOFF.md (repo, branch, deploy runbook: git push
      // triggers Cloudflare Pages; astro.config.mjs site field). Two working
      // copies exist: D:\Skills\mbs-live is the one that HANDOFF.md there names
      // canonical; D:\MBS Medical\mbsmedical-ref is the other checkout (moved
      // off legitscript-compliance) referenced by the ka-site-seo HANDOFF for
      // the pending accessibility-statement branch. Live URL curl-verified 200.
      // The deploy command is in D:\Skills\mbs-live\HANDOFF.md and depends on
      // branch state (the checkout's current branch and main have both drifted
      // from the command HANDOFF documents), so it is left for Alex to fill in.
      slug: 'mbs-medicine',
      name: 'MBS Medicine',
      live_url: 'https://mbsdoc.com',
      repo: 'shizzoobies/mbsmedical',
      local_path: 'D:\\Skills\\mbs-live',
      hosting: 'pages',
      domain: 'mbsdoc.com',
    },
    {
      // Source: work.js ("pbj-strategic-accounting"); D:\PBJ Accounting\HANDOFF.md,
      // which states the `client` remote (Bferguson2026/pbjsa) serves the live
      // site and both remotes are pushed every time; git remote -v in
      // D:\PBJ Accounting\Website\pbjsa-premium confirms both remotes. No
      // wrangler config in the repo; functions/api/reviews.js is a Pages
      // Functions convention. Live URL curl-verified 200.
      slug: 'pbj-strategic-accounting',
      name: 'PB&J Strategic Accounting',
      live_url: 'https://pbjsa.com',
      repo: 'Bferguson2026/pbjsa',
      local_path: 'D:\\PBJ Accounting\\Website\\pbjsa-premium',
      hosting: 'client-push',
      deploy_command: 'git push origin main; git push client main',
      domain: 'pbjsa.com',
    },
    {
      // Source: work.js ("project-makeover"); D:\PM Rebuild 2026\wrangler.toml
      // (pages_build_output_dir = "dist", D1 binding) and its own astro.config.mjs
      // site field; git remote -v. Live URL curl-verified 200.
      slug: 'project-makeover',
      name: 'Project Makeover',
      live_url: 'https://projectmakeover.org',
      repo: 'shizzoobies/pmbuild2026',
      local_path: 'D:\\PM Rebuild 2026',
      hosting: 'pages',
      domain: 'projectmakeover.org',
    },
    {
      // Source: work.js ("foremotion-golf"); D:\Foremotion Golf\Website Build\
      // foremotion-golf\docs\handoff\2026-09-03-session-handoff.md, which names
      // "main site src (Pages project foremotion-golf...)"; git remote -v.
      // Exact wrangler deploy invocation for the main site is not in the repo
      // (only the splash project's is), so deploy_command is left out. Live
      // URL curl-verified 200.
      slug: 'foremotion-golf',
      name: 'Fore Motion Golf',
      live_url: 'https://foremotiongolf.com',
      repo: 'shizzoobies/foremotion-golf',
      local_path: 'D:\\Foremotion Golf\\Website Build\\foremotion-golf',
      hosting: 'pages',
      domain: 'foremotiongolf.com',
    },
    {
      // Source: work.js ("ellenton-family-practice"); D:\Ellenton Family Practice
      // Rebuild\astro.config.mjs (Cloudflare adapter, output static, site field);
      // ka-site-seo HANDOFF.md item O5 ("Deploy: merge, git push origin main");
      // git remote -v. Live URL curl-verified 200.
      slug: 'ellenton-family-practice',
      name: 'Ellenton Family Practice Direct',
      live_url: 'https://familypracticedirect.com',
      repo: 'shizzoobies/efpd-site',
      local_path: 'D:\\Ellenton Family Practice Rebuild',
      hosting: 'pages',
      deploy_command: 'git push origin main',
      domain: 'familypracticedirect.com',
    },
    {
      // Source: work.js ("southern-legacy-contractors"); ka-site-seo HANDOFF.md
      // ("Southern Legacy is nested at D:\Synovial Pitch\Web Builds\Southern
      // Legacy"); its wrangler.jsonc (main: src/worker.js, custom_domain routes,
      // comment "Deploy: npx wrangler deploy"); git remote -v. Live URL
      // curl-verified 200.
      slug: 'southern-legacy-contractors',
      name: 'Southern Legacy Contractors',
      live_url: 'https://southernlegacycontractors.com',
      repo: 'Synovial-kaperformance/southern-legacy-website',
      local_path: 'D:\\Synovial Pitch\\Web Builds\\Southern Legacy',
      hosting: 'worker',
      deploy_command: 'npx wrangler deploy',
      domain: 'southernlegacycontractors.com',
    },
    {
      // Source: work.js ("synovial-marketing"); ka-site-seo HANDOFF.md ("Synovial
      // main, npx wrangler deploy from D:\Synovial Pitch"); D:\Synovial Pitch\
      // wrangler.jsonc (main: src/worker.js, custom_domain routes for
      // synovialmarketing.com); git remote -v. Live URL curl-verified 200.
      slug: 'synovial-marketing',
      name: 'Synovial Marketing',
      live_url: 'https://synovialmarketing.com',
      repo: 'Synovial-kaperformance/synovial-website',
      local_path: 'D:\\Synovial Pitch',
      hosting: 'worker',
      deploy_command: 'npx wrangler deploy',
      domain: 'synovialmarketing.com',
    },
    {
      // Source: work.js ("osteen-and-sons"); D:\Osteens\wrangler.jsonc
      // (main: src/worker.js, custom_domain routes for osteenandsons.com);
      // package.json "deploy" script ("npm run build && wrangler deploy");
      // git remote -v. Live URL curl-verified 200.
      slug: 'osteen-and-sons',
      name: 'Osteen & Sons',
      live_url: 'https://osteenandsons.com',
      repo: 'shizzoobies/osteen-and-sons',
      local_path: 'D:\\Osteens',
      hosting: 'worker',
      deploy_command: 'npm run build && wrangler deploy',
      domain: 'osteenandsons.com',
    },
    {
      // Source: work.js ("davids-bbq"); D:\Davis Catering\davids-catering\
      // wrangler.toml (pages_build_output_dir = "dist") and astro.config.mjs
      // (site: https://davidsbbq.com); HANDOFF.md's exact deploy command;
      // git remote -v. Live URL curl-verified 200.
      slug: 'davids-bbq',
      name: "David's BBQ",
      live_url: 'https://davidsbbq.com',
      repo: 'shizzoobies/davids-catering',
      local_path: 'D:\\Davis Catering\\davids-catering',
      hosting: 'pages',
      deploy_command: 'npx wrangler pages deploy dist --project-name davids-catering --branch main --commit-dirty=true',
      domain: 'davidsbbq.com',
    },
    {
      // Source: git show 8ef9627:src/data/work.js (this repo) for the "fdaaf"
      // portfolio entry; ka-site-seo HANDOFF.md ("FDAAF is D:\Old Projects\Access
      // Entree", branch site-fixes, "canonical to fdaaf.org... git push client
      // main after merge"); D:\Old Projects\Access Entree\astro.config.mjs
      // (site: https://fdaaf.org); git remote -v (client remote is
      // github.com/FDAAF/WEBSITE). Live URL curl-verified 200.
      slug: 'fdaaf',
      name: 'FDAAF',
      live_url: 'https://fdaaf.org',
      repo: 'FDAAF/WEBSITE',
      local_path: 'D:\\Old Projects\\Access Entree',
      hosting: 'client-push',
      deploy_command: 'git push client main',
      domain: 'fdaaf.org',
    },
    {
      // Source: git show 8ef9627:src/data/work.js (this repo) for the "fixalways"
      // portfolio entry; D:\fixalways\astro.config.mjs (site: https://fixalways.com);
      // git remote -v (single remote, shizzoobies/fixalways). A functions/
      // directory (Pages Functions convention, matching the pattern in the MBS
      // and PB&J repos) is present with no wrangler.jsonc/toml, so this reads as
      // a Cloudflare Pages project, but the exact deploy invocation is not
      // recorded anywhere in the repo or the ka-site-seo HANDOFF, so
      // deploy_command is left out. Live URL curl-verified 200.
      slug: 'fixalways',
      name: 'FixAlways',
      live_url: 'https://fixalways.com',
      repo: 'shizzoobies/fixalways',
      local_path: 'D:\\fixalways',
      hosting: 'pages',
      domain: 'fixalways.com',
    },
  ],
};
