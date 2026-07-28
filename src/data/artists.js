export const artists = [
  {
    slug: 'bobbie',
    name: 'Bobbie',
    discipline: 'Illustration & brand artwork',
    bio: "Bobbie's line work and character studies give brands a hand-drawn signature. Every piece is made to order. Commissioned and art-directed through K & A for web, print, and identity systems.",
    statement: 'A brand should look like it was drawn by a human who cared, because it was.',
    portrait: '/images/art/a1-magnolia.jpg',
    portraitAlt: 'Watercolor magnolia study in soft pinks, representative illustration work',
    gallery: [
      { src: '/images/art/a1-loose-florals.jpg', alt: 'Loose watercolor florals with ink linework' },
      { src: '/images/art/a1-stems.jpg', alt: 'Minimal botanical stems painted in muted earth tones' },
      { src: '/images/art/a1-hellebore.jpg', alt: 'Hellebore blossom study with layered watercolor washes' },
    ],
  },
  {
    slug: 'jon-marc',
    name: 'Jon Marc',
    discipline: 'Graphic design & visual identity',
    live: true,
    bio: 'Jon Marc designs logotypes, campaign art, and full identity systems that scale from a single mark to a whole season of screens, shirts, and social. Engaged and coordinated entirely through K & A, so the work stays on-brief and on-brand.',
    statement: 'Identity is not a logo. It is every pixel agreeing on the same idea.',
    portrait: '/images/art/jm-portrait.jpg',
    portraitAlt: "Jon Marc's JMO monogram mark layered over a softened portrait of the artist in a suit",
    gallery: [
      { src: '/images/art/jm-hope-humanity.jpg', alt: 'Hand lettered Jesus Hope for Humanity artwork in black and white with reaching hands' },
      { src: '/images/art/jm-home-improvement.jpg', alt: 'Home Improvement series logotype with rooftop mark and paint roller underline' },
      { src: '/images/art/jm-berkseth.jpg', alt: 'Berkseth Quality Landscaping badge logo with a chainsaw silhouette in green and black' },
      { src: '/images/art/jm-anti-running.jpg', alt: 'Anti-Running Running Club badge logo in orange and black' },
      { src: '/images/art/jm-slow-series.jpg', alt: 'Illustrated fist wearing a smartwatch that reads SLOW, series artwork' },
      { src: '/images/art/jm-heel-typography.jpg', alt: 'High heel shoe illustration built entirely from dance step typography' },
    ],
    archive: [
      { src: '/images/art/jm-joy.jpg', alt: 'Joy No Matter What lettering beside an illustrated figure reading in the rain' },
      { src: '/images/art/jm-pinnacle.jpg', alt: 'Pinnacle Creative Arts logo shown on light and dark backgrounds' },
      { src: '/images/art/jm-ready.jpg', alt: 'READY title card over a city freeway at night, first of a three part series' },
      { src: '/images/art/jm-set.jpg', alt: 'SET title card over a night skyline, second of a three part series' },
      { src: '/images/art/jm-slow-lake.jpg', alt: 'SLOW title card mirrored across a still lake, third of a three part series' },
      { src: '/images/art/jm-one-sunday.jpg', alt: 'One Sunday event mark in gold and black with a numeral one inside the wordmark' },
      { src: '/images/art/jm-incarnate.jpg', alt: 'Incarnate series art with a glowing heart constellation over a night sky' },
      { src: '/images/art/jm-beards.jpg', alt: 'Beards of Hollywood logo drawn as a bearded face in black and white' },
      { src: '/images/art/jm-iglesia.jpg', alt: 'BR Iglesia Hispana circular monogram logo' },
      { src: '/images/art/jm-bread-addict.jpg', alt: 'Bread Addict badge with a smiling toast character and an Isaiah 55:2 line' },
      { src: '/images/art/jm-no-bull.jpg', alt: 'Illustrated cowboy artwork lettered I Will Accept No Bull From Your House, Psalm 50:9' },
      { src: '/images/art/jm-titus.jpg', alt: 'Titus series title distressed into a carved stone column' },
      { src: '/images/art/jm-church-art.jpg', alt: 'Two color church silhouette artwork in orange and blue' },
      { src: '/images/art/jm-church-at-home.jpg', alt: 'Church at Home web banner with service times' },
      { src: '/images/art/jm-family-month.jpg', alt: 'North Phoenix Family Month announcement graphic over an aerial neighborhood photo' },
      { src: '/images/art/jm-great-exchange.jpg', alt: 'The Great Exchange campaign banner, trade your past for your purpose' },
      { src: '/images/art/jm-simple-hack.jpg', alt: 'The Simple Hack to Enjoying Life title card over a calm lake photo' },
      { src: '/images/art/jm-bout-that-life.jpg', alt: 'Bout That Life stepping lettering in white and purple on black' },
      { src: '/images/art/jm-rain-tee-gold.jpg', alt: 'Singin in the Rain shirt design in gold on a black tee' },
      { src: '/images/art/jm-rain-tee-black.jpg', alt: 'Singin in the Rain shirt design in gray on a black tee' },
      { src: '/images/art/jm-rain-tee-gray.jpg', alt: 'Singin in the Rain shirt design on a heather gray tee' },
      { src: '/images/art/jm-heel-tee.jpg', alt: 'Dance typography heel design printed on a light gray tee' },
    ],
  },
  {
    // MIXED SOURCING — two kinds of image path below, do not "tidy" them into one:
    //   /images/art/nc-*.webp  = LOCAL. Built from Nicole's hi-res originals in
    //     `Nicole Images/` (untracked) via ffmpeg: longest side 900px, libwebp q78.
    //     Covers all of Team identity + Coins & pins, plus a few others. Safe.
    //   https://nicolecruzdesign.com/... = HOTLINKED off her Netlify site because we
    //     have no source file for that piece. Those filenames are CONTENT HASHES, so
    //     any rebuild on her end renames them and the tile goes blank even if the
    //     artwork never changed. If tiles disappear, re-scrape <img> srcs from
    //     https://nicolecruzdesign.com/work and update, or get the source file.
    //     Remaining gaps: most of Apparel, all of Invitations + Digital, 2 branding,
    //     2 case-study shots. Ask Nicole for these to remove the last of the risk.
    slug: 'nicole',
    name: 'Nicole',
    discipline: 'Brand identity & merchandise design',
    live: true,
    bio: "Nicole designs identities for teams, events, and small businesses: challenge coins, apparel, caps, stationery, and invitation suites. From Tsunami Fastpitch to Navy squadron coins, the work is built to survive being worn, handed out, and kept. Commissioned and art-directed through K & A for print, merch, and identity systems.",
    statement: 'Design meant to be worn, pinned, printed, and carried. Not just posted.',
    // Portrait is built the same way as Jon Marc's: her own photo washed out to a
    // pale greyscale, her mark laid over it at full strength. Source photo + both
    // logo colourways live in `Nicole Images/Logo and Profile/` (untracked).
    // Composed with ffmpeg from the 960x960 headshot (crop 768x960 +40x to centre
    // her face) and NCLogo_Color.png at 690px. The mark is centred so it survives
    // the 4/3 centre-crop used by the artists-index and home cards.
    portrait: '/images/art/nc-portrait.webp',
    portraitAlt: 'Nicole Cruz Design circular wordmark over a softened portrait of the artist',
    // Mirrors the six categories on nicolecruzdesign.com/work. Her site numbers these
    // ("01 · TEAM IDENTITY"); numbering is intentionally dropped per K&A house rule.
    // `fit: 'contain'` = source is wide/tall enough that a square cover-crop would
    // cut the artwork (wordmarks, front+back tee layouts, flyers). Everything else covers.
    sections: [
      {
        id: 'team-identity',
        title: 'Team identity',
        blurb: 'Logos, uniforms, and gameday graphics for athletic organizations.',
        items: [
          { src: '/images/art/nc-jbs-circle.webp', alt: 'Jax Beach Softball palm tree circle logo' },
          { src: '/images/art/nc-jbs-outline.webp', alt: 'Jax Beach Softball outline wordmark' },
          { src: '/images/art/nc-thunder-wordmark.webp', alt: 'Thunder Softball wordmark in black and blue' },
          // not published on her own site; came from the source drop
          { src: '/images/art/nc-thunder-allstars-v2.webp', alt: 'Jax Beach Thunder All Stars wordmark in blue and gold', fit: 'contain' },
          { src: '/images/art/nc-jbs-jersey.webp', alt: 'Jax Beach Softball jersey wordmark, solid and outline versions', fit: 'contain' },
          { src: '/images/art/nc-beach-thunder.webp', alt: 'Beach Thunder wordmark in blue and yellow', fit: 'contain' },
          { src: '/images/art/nc-tsunami-pin.webp', alt: 'Tsunami Beach Ballers 12U trading pin' },
          { src: '/images/art/nc-tsunami-support.webp', alt: 'Support Tsunami Softball fundraiser flyer', fit: 'contain' },
          { src: '/images/art/nc-tsunami-practice-v2.webp', alt: 'Tsunami Fastpitch open practice and tryouts flyer', fit: 'contain' },
          { src: '/images/art/nc-tsunami-raffle.webp', alt: 'Tsunami Fastpitch fundraiser raffle flyer', fit: 'contain' },
          { src: '/images/art/nc-thunder-sponsor.webp', alt: 'Jax Beach Thunder All Stars sponsorship flyer', fit: 'contain' },
          { src: '/images/art/nc-thunder-josephs.webp', alt: "Jax Beach Thunder All Stars Joseph's Pizza fundraiser flyer", fit: 'contain' },
        ],
      },
      {
        id: 'hardware',
        title: 'Coins & pins',
        blurb: 'Engraved work for die-strike production: military units, sports teams, small businesses.',
        items: [
          { src: '/images/art/nc-legends-10u-v2.webp', alt: 'East Bay Legends 10U baseball coin' },
          { src: '/images/art/nc-legends-9u.webp', alt: 'East Bay Legends 9U baseball coin' },
          { src: '/images/art/nc-indios.webp', alt: 'Indios Baseball 14U coin' },
          { src: '/images/art/nc-cardinals-v2.webp', alt: 'Virginia Cardinals baseball coin' },
          { src: '/images/art/nc-florida-impact.webp', alt: 'Florida Impact softball coin' },
          { src: '/images/art/nc-impact-gold-v2.webp', alt: 'Impact Gold Texas softball coin' },
          { src: '/images/art/nc-central-edge.webp', alt: 'Central Edge Kentucky 8U coin' },
          { src: '/images/art/nc-owlz.webp', alt: 'Crosby Owlz baseball coin' },
          { src: '/images/art/nc-south-sf.webp', alt: 'South San Francisco baseball trading pin' },
          { src: '/images/art/nc-tullahoma.webp', alt: 'Tullahoma Fusion softball coin' },
          { src: '/images/art/nc-tribe.webp', alt: 'Tribe Baseball 12U coin' },
          { src: '/images/art/nc-king-neptune.webp', alt: 'King Neptune Navy challenge coin', fit: 'contain' },
          { src: '/images/art/nc-navy-chief.webp', alt: 'Navy Chief comic book challenge coin', fit: 'contain' },
          { src: '/images/art/nc-sermc.webp', alt: 'SERMC Goat Locker challenge coin', fit: 'contain' },
          { src: '/images/art/nc-caliber.webp', alt: 'Caliber Collision $1M Team West challenge coin', fit: 'contain' },
        ],
      },
      {
        id: 'stationery',
        title: 'Invitations',
        blurb: 'Watercolor and hand-lettered suites for weddings and celebrations.',
        items: [
          { src: 'https://nicolecruzdesign.com/images/9411f437fc10.jpg', alt: 'Floral wedding invitation suite', fit: 'contain' },
          { src: 'https://nicolecruzdesign.com/images/e3067701a3c4.jpg', alt: 'Peach floral wedding invitation', fit: 'contain' },
          { src: 'https://nicolecruzdesign.com/images/1c85833213c5.jpg', alt: 'Watercolor joint baby shower invitation', fit: 'contain' },
        ],
      },
      {
        id: 'apparel',
        title: 'Apparel',
        blurb: 'Artwork prepped for screen print and embroidery, down to small-size legibility.',
        items: [
          { src: 'https://nicolecruzdesign.com/images/c79383751ac9.jpg', alt: 'USS Harry S. Truman Flying Squad tee, front badge' },
          { src: 'https://nicolecruzdesign.com/images/7e8e8bb07793.jpg', alt: 'USS Harry S. Truman Flying Squad tee, back skull and axes' },
          { src: 'https://nicolecruzdesign.com/images/52450bdf38c1.jpg', alt: 'U.S. Navy Mustangs tee in black and coyote colorways', fit: 'contain' },
          { src: '/images/art/nc-mustangs-front.webp', alt: 'U.S. Navy Mustangs tee, front crest', fit: 'contain' },
          { src: 'https://nicolecruzdesign.com/images/0436b3cd3fa4.jpg', alt: 'WRNMMC Junior Enlisted Association tee, front and back', fit: 'contain' },
          { src: 'https://nicolecruzdesign.com/images/6b5ef572221a.jpg', alt: "USS Detroit Chief's Mess tee, front and back", fit: 'contain' },
          { src: '/images/art/nc-lcsron2.webp', alt: 'LCSRON2 tee, front and back', fit: 'contain' },
          { src: 'https://nicolecruzdesign.com/images/7f129fbbe1f4.jpg', alt: 'Vets Helping Vets Virginia State Meeting tee, front and back', fit: 'contain' },
          { src: 'https://nicolecruzdesign.com/images/fb7c7f5e9113.jpg', alt: 'Neptune Beach sun and palm embroidered cap', fit: 'contain' },
          { src: 'https://nicolecruzdesign.com/images/43b92ee98624.jpg', alt: 'Team snapback cap and Tsunami Fastpitch tumbler', fit: 'contain' },
        ],
      },
      {
        id: 'digital',
        title: 'Digital',
        blurb: 'Flyers, social posts, and campaign graphics.',
        items: [
          { src: 'https://nicolecruzdesign.com/images/f318b18cd8b2.jpg', alt: 'Tsunami Fastpitch suit up fundraiser Instagram post' },
          { src: 'https://nicolecruzdesign.com/images/121c3e82135a.jpg', alt: 'Tsunami Fastpitch suit up fundraiser Instagram post, second layout' },
          { src: 'https://nicolecruzdesign.com/images/9c98b5f2f249.jpg', alt: 'Tsunami Fastpitch sponsor thank-you post' },
          { src: 'https://nicolecruzdesign.com/images/c0f01ae35190.jpg', alt: 'BestBet Jacksonville Food Truck Rally flyer', fit: 'contain' },
          { src: 'https://nicolecruzdesign.com/images/9ff93bf79b64.jpg', alt: 'Pool Services and Such website hero design', fit: 'contain' },
        ],
      },
      {
        id: 'branding',
        title: 'Logos & brand systems',
        blurb: 'Identity work for small businesses and event organizers.',
        items: [
          { src: 'https://nicolecruzdesign.com/images/28d2f063aec3.png', alt: 'Full Count 32 Events logo' },
          { src: '/images/art/nc-pool-badge.webp', alt: 'Pool Services and Such badge logo' },
          { src: '/images/art/nc-beach-bananas.webp', alt: 'Beach Bananas baseball logo, black and white versions', fit: 'contain' },
          { src: 'https://nicolecruzdesign.com/images/40f90da058d0.jpg', alt: 'Tsunami Fastpitch die-cut stickers', fit: 'contain' },
        ],
      },
    ],
    caseStudy: {
      eyebrow: 'Case study',
      heading: 'Pool Services & Such.',
      body: 'A full identity build for a local pool maintenance company: logo design, stationery, apparel, vehicle wrap, and a launch website, all built around a badge mark that reads clearly from a business card or the back of a service van.',
      items: [
        { src: '/images/art/nc-pool-logo.webp', alt: 'Pool Services and Such logo in black and white' },
        { src: 'https://nicolecruzdesign.com/images/c3f30b29a5d3.jpg', alt: 'Pool Services and Such stationery system' },
        { src: 'https://nicolecruzdesign.com/images/7ce2e454dfbe.jpg', alt: 'Pool Services and Such stationery flat lay' },
      ],
    },
  },
];
