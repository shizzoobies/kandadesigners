// "Hope & Harry's Alaskan Adventure", written by Alex and illustrated by Bobbie.
//
// This runs on her UNTEXTED artwork with the story set as live HTML over it
// (`text` + `place`), not the print export that had the words baked into the
// image. That is the whole point: the story is selectable, resizes with the
// page, and is read natively by a screen reader, so there is no images-of-text
// question to argue about for the prose.
//
// `alt` therefore describes the artwork only. The exception is lettering that
// is genuinely painted into the piece (the cover title, "READY!", "KNOCK!", the
// carved memorial, the ICE MUSEUM sign); that stays in the image, so it stays
// in the alt.
//
// `place` is the band the original print layout used. BookFlip puts a soft
// scrim behind the text, which is invisible on the pages that left white space
// and is load-bearing on the handful that sit over artwork, because live text
// over an image gets no artwork exception on contrast.
//
// Reading order is NOT the raw file order: see the ORDER note where these were
// generated. Pages carry ?v= because /images/* has a 24h max-age.
const harryAndHopePages = [
  {
    alt: `Hope, a pink koala in a maroon hoodie, leans against Harry, a blue hippo in a cream coat, on a sandy path through bare red woods. Painted title lettering reads "Hope & Harry's Alaskan Adventure. Written by Alex Anderson & Illustrated by Bobbie Connor".`,
  },
  {
    alt: `Harry shuts the boot of a green car while Hope, in sunglasses and an orange floral shirt, throws a thumbs up beside hand-lettered "READY!".`,
    text: `The day is finally here! Harry excitedly closed the trunk after loading the last of their luggage. It was time to drive to the airport for their big Alaskan adventure.`,
    place: 'bottom',
  },
  {
    alt: `Hope and Harry sit buckled into their seats beside a plane window.`,
    text: `Hope held Harry's hand as the plane quickly left the ground in Orlando, FL. They were both nervous about flying since it wasn't something they did often, but the second the plane left the ground it finally felt real. They were going to Alaska!`,
    place: 'top',
  },
  {
    alt: `A green and white plane flies beneath a green and purple aurora, the pair visible in its windows.`,
    text: `"OMG look!" said Hope. Harry, waking up from his nap looked out the window. The sky was lit green from the Aurora Borealis as they flew into Anchorage. Harry chuckled and exclaimed "Well we can check that of our list already."`,
    place: 'bottom',
  },
  {
    alt: `Hope and Harry grin for a selfie in front of a giant moose standing behind a rope barrier.`,
    text: `The sound of rushing wind and then thump, the plane landed, and it was time to start exploring. Right away before they even left the airport Harry excitedly took a selfie with a giant Moose. They were tired from the long flight, but they were so happy to finally arrive.`,
    place: 'top',
  },
  {
    alt: `The pair drive a pink SUV down a rain-streaked highway at dusk.`,
    text: `"I found it!" Harry exclaimed as he found the rental car in the airport garage. They loaded their bags into the SUV and off they went to Wasilla to sleep for the night.`,
    place: 'bottom',
  },
  {
    alt: `A round wooden vacation house glows under a green aurora, the car and their luggage in the snow outside.`,
    text: `It was still nighttime as they pulled into the driveway to the vacation house driveway. The sky was still lit green by the Aurora Borealis, it was surreal how the lights in the sky reflected off the windows of the beautiful round vacation house at night.`,
    place: 'top',
  },
  {
    alt: `Harry and Hope stand with their suitcases looking startled, beside hand-lettered "KNOCK! KNOCK! KNOCK!".`,
    text: `"Is someone at the door?" Hope confusingly asked Harry.`,
    place: 'top',
  },
  {
    alt: `Hana, a purple bear in a pink coat and neckerchief, waves hello.`,
    text: `"Hello, welcome to Alaska I'm Hana and I live on the other side of the property." Said Hana in a super friendly tone.`,
    place: 'top',
  },
  {
    alt: `Hana hands over a wrapped salmon in the doorway while Hope holds a mug and Harry carries a plate of cookies.`,
    text: `"I also brought you some fresh salmon I caught myself, some rose tea and some cookies I just pulled out of the oven. I hope you enjoy your stay!" Said Hana before she happily hopped away.`,
    place: 'bottom',
  },
  {
    alt: `The pair perch on stools at a curved wooden counter under pendant lights, with cookies and a teapot.`,
    text: `Harry and Hope both laughed at each other and agreed that people were incredibly friendly in Alaska so far. After putting the Salmon away to cook for dinner later they enjoyed some tea and cookies before heading out for their first Alaskan hike.`,
    place: 'bottom',
  },
  {
    alt: `Hope and Harry stand together on the grass beside a flat calm lake with pink mountains behind.`,
    text: `It was so beautiful as they pulled up to the state park. There was a flat calm lake with a Mountain landscape in the distance. It was misty with some slight rain, but it felt great compared to how hot they were used to. Hope and Harry held hands and slowly walked around the lake stopping occasionally to take a selfie.`,
    place: 'top',
  },
  {
    alt: `A purple jeep drives a road cut between towering snow banks, a frozen waterfall behind.`,
    text: `Next day! Time to see some Glaciers. They drove down the coast past dozens of waterfalls on their way to board their boat.`,
    place: 'bottom',
  },
  {
    alt: `Hope in sunglasses and Harry holding a margarita stand at the glacier's edge while a sea otter floats nearby.`,
    text: `Hope jumped up and down excitedly as she noticed the sea otters playing near the glacier ice. Harry enjoyed a margarita made using the ice from the glaciers that they fished straight out of the water. The glacier views were amazing!`,
    place: 'top',
  },
  {
    alt: `The pair step down from a blue and yellow train at the depot with their bags.`,
    text: `Another night's sleep and it was time to board the train. A full day on a train riding through the Denali Forest did not disappoint! One long blast of the train horn as it slowed to a stop in the Fairbanks depot. Time to explore another area of Alaska. Harry went to pick up the Jeep while Hope grabbed the bags.`,
    place: 'top',
  },
  {
    alt: `Harry drives a jeep with Hope beside him through blazing orange autumn trees under a rainbow.`,
    text: `A quick stop for a night at another vacation rental and they were off to the Denali via jeep this time to hike. The views of the river were breathtaking, they even saw a rainbow.`,
    place: 'top',
  },
  {
    alt: `Hope and Harry stand beside a stone memorial of two airmen, its base carved "WWII" and "ALASKA SIBERIA".`,
    text: `Harry watched warmly in Fairbanks, as Hope enjoyed touring a museum dedicated to the local indigenous population. They also enjoyed a walk along the river to see some local art and statues before calling it a day.`,
    place: 'top',
  },
  {
    alt: `The pair walk a snowy path toward a domed ice building, a signpost reading "ICE MUSEUM".`,
    text: `The sun's up time for another Alaskan adventure. This time a long ride up into the mountains to enjoy an Ice Museum...`,
    place: 'top',
  },
  {
    alt: `Hope and Harry sit shoulder deep in a steaming pale blue hot spring at night.`,
    text: `...and a dip in a natural Hot Spring under the night sky.`,
    place: 'top',
  },
  {
    alt: `Hope reaches down to high five an exhausted Harry, sitting in a marshy clearing among bare trees.`,
    text: `One last adventure before heading home, Hope and Harry had to Hike in North Pole, Alaska. Hope watches as Harry catches his breath 3 miles into the hike. This hike was the hardest they had done because it was partially underwater, but they proudly found their way through the marshy area before returning to a local tavern for a bite to eat.`,
    place: 'top',
  },
  {
    alt: `A plane climbs in silhouette over a runway, sunset sea and dark mountains.`,
    text: `The Alaskan Adventure has come to an end but Hope and Harry know that this was just the first of many adventures in a love story fit for a fairytale.`,
    place: 'top',
  },
  {
    alt: `Back cover. A road runs between snow banks toward a wide turquoise waterfall in falling snow.`,
  },
].map((page, i) => ({
  ...page,
  src: `/images/art/book/hha-${String(i + 1).padStart(2, '0')}.webp?v=1`,
}));

export const artists = [
  {
    slug: 'bobbie',
    name: 'Bobbie',
    discipline: 'Illustration & brand artwork',
    live: true,
    bio: 'Bobbie draws for a living, and it shows: hand-lettered logotypes, character work, and full picture books, all built line by line rather than assembled from parts. She works under her own mark, Bobbie Draws, and is commissioned and art-directed through K & A for web, print, and identity systems.',
    statement: 'A brand should look like it was drawn by a human who cared, because it was.',
    portrait: '/images/art/bb-portrait.webp',
    portraitAlt: "Bobbie's own Bobbie Draws mark, a script wordmark with a palette and brush, layered over a softened portrait of the artist",
    book: {
      eyebrow: 'Featured work',
      title: "Hope & Harry's Alaskan Adventure",
      blurb: 'A picture book start to finish: characters, landscapes, and every page illustrated by Bobbie. Written by Alex Anderson at K & A, so this one ran the whole way through our own studio. The real thing is below, all 22 pages of it.',
      pages: harryAndHopePages,
    },
    // No inline `gallery` on purpose: the book above carries this page, so the
    // brand work sits behind the one modal control rather than adding another
    // screen of tile grid after the closer.
    archive: [
      { src: '/images/art/bb-hope-harry-wedding.webp?v=1', fit: 'contain', alt: 'Line art of Hope and Harry as bride and groom, she in a veil and gown holding a bouquet, he in a suit and bow tie' },
      { src: '/images/art/bb-bobbie-draws.webp', fit: 'contain', alt: "Bobbie Draws personal logo: a script wordmark with a painter's palette and brush" },
      { src: '/images/art/bb-champicraft.webp', fit: 'contain', alt: 'ChampiCraft logotype hand lettered out of illustrated mushrooms' },
      { src: '/images/art/bb-dr-night-phlox.webp', fit: 'contain', alt: 'Dr Night Phlox circular mark, a stylised phlox flower in cream and green on deep maroon' },
      { src: '/images/art/bb-holder-of-secrets.webp', fit: 'contain', alt: 'The Holder of Secrets title treatment with a dragonfly resting on a leaf' },
      { src: '/images/art/bb-wrong-answers-only.webp', fit: 'contain', alt: 'Wrong Answers Only circular badge logo built around a sprouting root vegetable' },
      { src: '/images/art/bb-ka-performance.webp', fit: 'contain', alt: 'K & A Performance logo concept set inside a hand drawn browser window' },
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
      { src: '/images/art/jm-home-improvement.jpg', alt: 'Series logotype reading "Home Improvement" with a rooftop drawn inside the O, above a paint-roller stroke carrying the line "real change begins at home"' },
      { src: '/images/art/jm-berkseth.jpg', alt: 'Berkseth Quality Landscaping badge logo with a chainsaw silhouette in green and black' },
      { src: '/images/art/jm-anti-running.jpg', alt: 'Anti-Running Running Club badge logo in orange and black' },
      { src: '/images/art/jm-slow-series.jpg', alt: 'Series artwork of a raised fist wearing a smartwatch reading "SLOW", over a faded background list of daily demands: morning alarm, gym, traffic, kids, call, email, meetings, shopping, laundry, bills, pick up kids. A banner across the foot reads "our current series"' },
      { src: '/images/art/jm-heel-typography.jpg', alt: 'High heel shoe illustration built entirely from dance step typography' },
    ],
    archive: [
      { src: '/images/art/jm-joy.jpg', alt: 'Joy No Matter What lettering beside an illustrated figure reading in the rain' },
      { src: '/images/art/jm-pinnacle.jpg', alt: 'Pinnacle Creative Arts logo shown on light and dark backgrounds' },
      { src: '/images/art/jm-ready.jpg', alt: 'READY title card over a city freeway at night, first of a three part series' },
      { src: '/images/art/jm-set.jpg', alt: 'SET title card over a night skyline, second of a three part series' },
      { src: '/images/art/jm-slow-lake.jpg', alt: 'SLOW title card mirrored across a still lake, third of a three part series' },
      { src: '/images/art/jm-one-sunday.jpg', alt: 'One Sunday event mark in gold and black with a numeral one inside the wordmark' },
      { src: '/images/art/jm-incarnate.jpg', alt: 'Series art titled "Incarnate" with the subtitle "God\'s heart for humanity", a glowing heart constellation arching over a hillside cross at dusk' },
      { src: '/images/art/jm-beards.jpg', alt: 'Beards of Hollywood logo drawn as a bearded face in black and white' },
      { src: '/images/art/jm-iglesia.jpg', alt: 'BR Iglesia Hispana circular monogram logo' },
      { src: '/images/art/jm-bread-addict.jpg', alt: 'Badge reading "bread addict" around a smiling slice of toast, above the line "Why spend money on what is not bread?" attributed to Isaiah 55:2' },
      { src: '/images/art/jm-no-bull.jpg', alt: 'Illustrated cowboy artwork lettered I Will Accept No Bull From Your House, Psalm 50:9' },
      { src: '/images/art/jm-titus.jpg', alt: 'Series title "Titus" with the subtitle "True son in the faith", distressed over a drawn classical column capital' },
      { src: '/images/art/jm-church-art.jpg', alt: 'Two color church silhouette artwork in orange and blue' },
      { src: '/images/art/jm-church-at-home.jpg', alt: 'Web banner reading "Church at Home" with service times 9:00am and 10:45am beside a man watching from an armchair, and "Invite friends, worship together" on the blue half' },
      { src: '/images/art/jm-family-month.jpg', alt: 'Announcement graphic reading "North Phoenix Family Month, Feb 2021", the A of Family drawn as a house roof, over an aerial photo of a desert neighbourhood' },
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
    // ?v=1 is a cache-key buster, not decoration: the bare URL got a 404 HTML
    // response cached against it at the edge during the deploy race (see the
    // process note in docs/superpowers/HANDOFF.md). Bump the number if it ever
    // happens again rather than renaming the file.
    portrait: '/images/art/nc-portrait.webp?v=1',
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
          // Order matters here: only the first three render on the page, the
          // rest sit behind the section's modal, so these three are chosen.
          { src: '/images/art/nc-tsunami-pin.webp', alt: 'Tsunami Beach Ballers 12U trading pin' },
          // (not published on her own site; came from the source drop)
          { src: '/images/art/nc-thunder-allstars-v2.webp', alt: 'Jax Beach Thunder All Stars wordmark in blue and gold', fit: 'contain' },
          { src: '/images/art/nc-thunder-wordmark.webp', alt: 'Thunder Softball wordmark in black and blue' },
          { src: '/images/art/nc-jbs-jersey.webp', alt: 'Jax Beach Softball jersey wordmark, solid and outline versions', fit: 'contain' },
          { src: '/images/art/nc-beach-thunder.webp', alt: 'Beach Thunder wordmark in blue and yellow', fit: 'contain' },
          { src: '/images/art/nc-tsunami-support.webp', alt: 'Fundraiser board on a softball field reading "Support Tsunami Softball", the wordmark set in a blue paint splash with a palm tree', fit: 'contain' },
          { src: '/images/art/nc-tsunami-practice-v2.webp', alt: 'Tryout flyer on a softball field: "Fall 2022, Tsunami Fastpitch, Open Practice & Tryouts, 10U, 12U (2011), 12U (2010), private workouts available". A schedule panel lists 10U on 7/20 and 7/27, 12U 2011 on 6/29 and 7/6, and 12U 2010 on 7/21 and 7/26, all 6 to 8pm, at Wingate Park, Jacksonville Beach', fit: 'contain' },
          { src: '/images/art/nc-tsunami-raffle.webp', alt: 'Raffle flyer reading "Tsunami Fastpitch Fundraiser! Get your tickets before they wash away! Win over $400 in prizes! Winners announced 3/25", with prize donors listed and tickets at $10 each or 4 for $30 through Venmo', fit: 'contain' },
          { src: '/images/art/nc-thunder-sponsor.webp', alt: 'Sponsorship flyer reading "Jax Beach Thunder All Stars 12U. Help get us to states! Sponsorship opportunities available", with a Venmo QR code and the team handle', fit: 'contain' },
          { src: '/images/art/nc-thunder-josephs.webp', alt: "Fundraiser flyer reading \"Jax Beach Thunder All Stars 12U. Help us get to states!\" above the Joseph's Pizza Atlantic Beach logo, with \"order online and use the coupon code THUNDER to support Jax Beach Softball\" over a photographed pizza", fit: 'contain' },
        ],
      },
      {
        id: 'hardware',
        title: 'Coins & pins',
        blurb: 'Engraved work for die-strike production: military units, sports teams, small businesses.',
        // Only the first three show on the page, so they carry one of each
        // market named in the blurb: a sports team, a military unit, and a
        // small business. Sorting by client type beats sorting by sport, which
        // read as eleven baseball coins and nothing else.
        items: [
          { src: '/images/art/nc-legends-10u-v2.webp', alt: 'East Bay Legends 10U baseball coin' },
          { src: '/images/art/nc-king-neptune.webp?v=2', alt: 'King Neptune Navy challenge coin', fit: 'contain' },
          { src: '/images/art/nc-caliber.webp?v=2', alt: 'Caliber Collision $1M Team West challenge coin', fit: 'contain' },
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
          { src: '/images/art/nc-navy-chief.webp?v=2', alt: 'Navy Chief comic book challenge coin', fit: 'contain' },
          { src: '/images/art/nc-sermc.webp?v=2', alt: 'SERMC Goat Locker challenge coin', fit: 'contain' },
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
      heading: 'Pool Services & Such',
      body: 'A full identity build for a local pool maintenance company: logo design, stationery, apparel, vehicle wrap, and a launch website, all built around a badge mark that reads clearly from a business card or the back of a service van.',
      items: [
        { src: '/images/art/nc-pool-logo.webp', alt: 'Pool Services and Such logo in black and white' },
        { src: 'https://nicolecruzdesign.com/images/c3f30b29a5d3.jpg', alt: 'Pool Services and Such stationery system' },
        { src: 'https://nicolecruzdesign.com/images/7ce2e454dfbe.jpg', alt: 'Pool Services and Such stationery flat lay' },
      ],
    },
  },
];
