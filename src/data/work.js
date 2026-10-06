// Inner-page captures that only appear in the hero stack — they scatter with
// the mosaic for density, then fly off as the home pages form the horseshoe.
export const stackExtras = [
  { img: '/images/work-extras/pmbuild-makeovers.webp?v=2' },
  { img: '/images/work-extras/pmbuild-alumni.webp?v=2' },
  { img: '/images/work-extras/familypractice-dpc.webp' },
  { img: '/images/work-extras/familypractice-medicine.webp' },
  { img: '/images/work-extras/pbj-services.webp' },
  { img: '/images/work-extras/pbj-about.webp' },
];

export const projects = [
  {
    slug: 'mbs-medicine',
    title: 'MBS Medicine',
    blurb: 'A veteran-owned Florida telehealth clinic. Bold, unmistakable identity with same-week booking and a patient portal: healthcare that treats the whole person, online.',
    img: '/images/work-mbsdoc.webp',
  },
  {
    slug: 'pbj-strategic-accounting',
    title: 'PB&J Strategic Accounting',
    blurb: 'Accounting and bookkeeping for growing businesses: a clean, trustworthy redesign with clear services, pricing paths, and a free-call booking flow that converts.',
    img: '/images/work-pbjsa.webp',
  },
  {
    slug: 'project-makeover',
    title: 'Project Makeover',
    blurb: 'A nonprofit transforming school spaces into vibrant learning environments. A joyful, gallery-driven site with donation and makeover-showcase paths built for community momentum.',
    img: '/images/work-pmbuild.webp?v=2',
  },
  {
    slug: 'foremotion-golf',
    title: 'Fore Motion Golf',
    blurb: 'Indoor golf in Jacksonville: always 70, always sunny. A moody launch site with founding-membership waitlist capture and an AI Robo Caddie.',
    img: '/images/work-foremotion.webp',
  },
  {
    slug: 'ellenton-family-practice',
    title: 'Ellenton Family Practice Direct',
    blurb: 'Direct primary care in Ellenton, Florida. Modern medicine, old-fashioned doctors. A warm, trustworthy site built around membership signups.',
    img: '/images/work-familypractice.webp',
  },
  {
    slug: 'southern-legacy-contractors',
    title: 'Southern Legacy Contractors',
    blurb: 'Residential, commercial, and industrial concrete across Northeast Florida. Six trades, one standard: a dark, photo-led build that leads with the pour and keeps a free quote and the phone number one tap away.',
    img: '/images/work-southernlegacy.webp?v=1',
  },
  {
    slug: 'synovial-marketing',
    title: 'Synovial Marketing',
    blurb: 'A full-service marketing team in Jacksonville that takes the whole puzzle off your plate: brand, social, web, and email. A warm, editorial site built around booking a discovery call, with their own client work front and center.',
    img: '/images/work-synovial.webp?v=1',
  },
  {
    slug: 'osteen-and-sons',
    title: 'Osteen & Sons',
    blurb: 'Lawn care, brush clearing, and junk removal in Gainesville. Type an address and the site pulls the lot from county records, then books a free walkthrough on the spot, with an AI assistant for the quick questions.',
    img: '/images/work-osteens.webp?v=1',
  },
  {
    slug: 'davids-bbq',
    title: "David's BBQ",
    blurb: "Gainesville pit barbecue since 1978. A smoky, photo-led site with the full menu and prices, catering and wedding paths, and online ordering one tap away.",
    img: '/images/work-davidsbbq.webp?v=1',
  },
];

// Responsive copies of the 2880 px project screenshots (the 2x captures of a
// 1440 px browser). A 390 px phone was downloading all five at full size,
// about 1.4 MB, to show them at about 340 px. scripts/build-work-sizes.mjs
// writes `<name>-<width>.webp` beside each original from this list; rerun it
// whenever one of these screenshots is replaced. The original stays the
// 2880w candidate, so a large retina screen gets exactly what it got before.
export const workWidths = [720, 1080, 1440];
export const responsiveWork = ['work-davidsbbq', 'work-familypractice', 'work-foremotion', 'work-osteens', 'work-pmbuild'];

/**
 * srcset for a project screenshot, or undefined when the image has no
 * responsive copies (the smaller captures are served as they are). The
 * original's ?v= cache key carries over to every copy.
 */
export function workSrcset(img) {
  const [file, query] = img.split('?');
  const name = file.split('/').pop().replace(/\.webp$/, '');
  if (!responsiveWork.includes(name)) return undefined;
  const v = query ? `?${query}` : '';
  const base = file.replace(/\.webp$/, '');
  return [...workWidths.map((w) => `${base}-${w}.webp${v} ${w}w`), `${file}${v} 2880w`].join(', ');
}
