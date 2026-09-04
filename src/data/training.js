// The training content service line: one file every /training/* page reads.
//
// This is deliberately the ONLY place the section's facts live, because the
// business brief (TAAS/extracted/ka-handoff/05-website-build/BRIEF.md) puts
// hard limits on what may be published, and a single file is auditable in a
// way that copy scattered across five pages is not:
//
//   1. NO PRICING. No rates, fees, ranges, or "starting at". Engagement models
//      are described by shape only. Nothing in this file may carry a dollar
//      figure, and nothing rendered from it may either.
//   2. NO UNAUDITED PORTFOLIO WORK. Anything built for a former employer
//      belongs to that employer. A sample renders only when `status` is
//      'live', and 'live' is set by a person who has confirmed provenance,
//      never by inference.
//   3. NO NAMES WITHOUT PERMISSION. The four instructional designers and two
//      subject matter experts have a marketing-use election in their
//      Schedule A that is not filled in yet. Cards stay placeholders until
//      Alex flips `named` to true per person and supplies the approved text.
//   4. NO THROUGHPUT NUMBERS. Never state courses per week or per month. The
//      claim is "never the bottleneck", not a count.
//
// When Alex's answers arrive, this file is the whole edit.

// Roughly sixty combined years across the bench, per the handoff README.
// FLAGGED FOR CONFIRMATION: the brief lists this figure among the things
// Alex must confirm before launch. Render it as "roughly", never as exact.
export const combinedYears = 60;

export const section = {
  name: 'Training content',
  href: '/training/',
  email: 'alex@ka-performancefl.com',
  pdf: '/downloads/KA-Performance-Training-Capabilities.pdf',
  pdfName: 'KA-Performance-Training-Capabilities.pdf',
};

// The section's own navigation, rendered by TrainingSubnav.astro on every
// training page so the four surfaces read as one place.
export const sectionLinks = [
  { href: '/training/', label: 'Overview' },
  { href: '/training/samples/', label: 'Samples' },
  { href: '/training/team/', label: 'Meet the team' },
  { href: section.pdf, label: 'Capabilities (PDF)', download: true },
];

// What we build. Order is roughly "biggest to smallest", then the two
// services that act on content a client already has.
export const deliverables = [
  {
    title: 'Full courses',
    blurb: 'Multi-module programs with a learning path, practice, and assessment, built to run in your LMS on day one.',
  },
  {
    title: 'Standard modules',
    blurb: 'A single topic taught properly: objectives, teaching, practice, check. The unit most training libraries are actually made of.',
  },
  {
    title: 'Microlearning',
    blurb: 'Five to ten minutes on one thing, built for the moment someone needs it rather than the quarter they are assigned it.',
  },
  {
    title: 'Job aids and performance support',
    blurb: 'Checklists, decision trees, and reference pieces that live next to the work instead of in a course catalog.',
  },
  {
    title: 'Assessments',
    blurb: 'Scenario-based checks that measure whether someone can do the thing, not whether they can recognize the sentence about it.',
  },
  {
    title: 'Conversion and refresh',
    blurb: 'Existing slide decks, PDFs, and aging modules rebuilt as current, interactive, trackable content.',
  },
  {
    title: 'Accessibility remediation',
    blurb: 'Training you already own, brought up to WCAG 2.1 AA and tested in a real LMS rather than an authoring preview.',
  },
];

// How it ships. The point of listing these plainly is procurement: the
// hosting and learner-data lines remove an objection before it is raised.
export const delivery = {
  formats: ['SCORM 1.2', 'SCORM 2004', 'xAPI', 'Plain HTML'],
  notes: [
    'Delivered into your own LMS. We do not host your content.',
    'We never receive learner data. Completion, scores, and identities stay in your system.',
    'Standard blocks stay editable by your team. Custom interactive components come back to us, and we say which is which before the project starts.',
  ],
};

// The production pipeline, shown as a visible process because buyers ask
// what the process is and showing it signals experience.
export const pipeline = [
  {
    label: 'Discovery',
    note: 'Audience, objective, constraints, and what your LMS actually supports. We leave with a scope we can both point at.',
  },
  {
    label: 'Outline',
    note: 'Objectives mapped to content, in the order a learner needs them. Your subject matter expert signs off here, before anything expensive happens.',
  },
  {
    label: 'Storyboard',
    note: 'Every screen, every interaction, every assessment item, in writing and in wireframe. Changes are cheap at this stage and we say so.',
  },
  {
    label: 'Alpha',
    note: 'The working build, reviewed by our instructional designer and your reviewer against the storyboard.',
  },
  {
    label: 'Beta and LMS testing',
    note: 'Loaded into your real LMS, on real accounts, tested for tracking, completion, keyboard, and screen reader. Not in an authoring preview.',
  },
  {
    label: 'Final delivery',
    note: 'The package, the source, and a written note of anything your team can and cannot edit later.',
  },
];

// Engagement models, by shape only. The brief is explicit: never a number.
export const engagementModels = [
  {
    title: 'Fixed project',
    shape: 'Defined deliverables, defined scope, a fixed price agreed before work starts. Best when you know what you need and when you need it.',
  },
  {
    title: 'Monthly pod',
    shape: 'Dedicated capacity for a defined period. Best for a team with a backlog that never quite gets to the top of anyone\'s week.',
  },
  {
    title: 'Retainer bench',
    shape: 'On-call capacity for overflow and rush work. Best when the volume is unpredictable but the deadlines are not.',
  },
];

// Accessibility, as a section rather than a footnote. The delivery standard
// for client content is 2.1 AA (what procurement asks for); this site itself
// aims at 2.2 AA, see /accessibility/.
export const accessibility = {
  standard: 'WCAG 2.1 AA',
  tests: [
    'Keyboard alone: every interaction reachable and operable, in a sensible order, with a focus indicator you can see.',
    'Screen reader: read through with a real screen reader, not a checker, so labels and reading order make sense out loud.',
    'Contrast: measured, not eyeballed, across text, controls, and states.',
    'Motion: reduced-motion preferences respected in every animation.',
    'In the LMS: all of the above verified inside your actual LMS, because authoring previews lie.',
  ],
};

// AI transparency. Short and confident; volunteering this reads as maturity.
export const aiTransparency = [
  'AI-assisted authoring, with a human instructional designer reviewing and validating every output before it reaches you.',
  'Your confidential material is never entered into a tool that trains on submitted content.',
  'Any restriction you need, from specific tools to no AI at all, is written into the statement of work.',
];

// The bench's four focus areas. Rendered on the capabilities one-pager and
// as the "what the bench covers" list on the team page. The people themselves
// are in `team` below.
export const bench = [
  { focus: 'Curriculum architecture and assessment design', backdrop: '/images/training/backdrops/bench-curriculum.jpg?v=2' },
  { focus: 'Visual design and illustrated learning', backdrop: '/images/training/backdrops/bench-visual.jpg?v=2' },
  { focus: 'Interactive and scenario-based learning', backdrop: '/images/training/backdrops/bench-interactive.jpg?v=2' },
  { focus: 'Technical and compliance training', backdrop: '/images/training/backdrops/bench-technical.jpg?v=2' },
];

// The team, by Alex's call on 2026-09-04: the two owners, the instructional
// designers (three of whom are also the studio's artists), and the subject
// matter experts. A null `photo` renders the drawn placeholder portrait; an
// empty `bio` renders the "approved bio to follow" line. No employer is ever
// named for anyone. Owners and artists are already public on this site; the
// three newest people are here on Alex's instruction, pending their signed
// marketing-use elections and approved wording.
export const team = {
  owners: [
    {
      name: 'Alex Anderson',
      role: 'Managing member, design and development',
      line: 'Lead Learning Experience Designer',
      bio: 'Alex does the design and the development, so whoever storyboards your module is the one who builds it. He leads every training engagement personally, brings prior years of building training for the construction and skilled trades, and is pursuing IAAP CPACC certification in accessibility.',
      photo: '/images/Alex-Image.webp',
      link: null,
    },
    {
      name: 'Kristina Anderson',
      role: 'Strategy and content',
      line: 'Instructional Designer and Accessibility Specialist',
      bio: 'Kristina runs strategy and content. In practice she is the one asking why a module exists at all and what it is supposed to make somebody do once they have taken it, which is the question most training never gets asked.',
      photo: '/images/Kristina-Image.webp',
      link: null,
    },
  ],
  designers: [
    {
      name: 'Bobbie Connor',
      role: 'Instructional designer',
      line: 'Illustration and visual learning',
      bio: 'Bobbie draws for a living, and it shows: hand-lettered logotypes, character work, and full picture books, all built line by line rather than assembled from parts. On the bench she carries the illustrated and visual side of a course, the scenes and characters a scenario is built around.',
      photo: '/images/art/bb-portrait.webp',
      link: '/artists/bobbie/',
    },
    {
      name: 'Jon Marc Ostrom',
      role: 'Instructional designer',
      line: 'Graphic design and visual identity',
      bio: 'Jon Marc designs logotypes, campaign art, and full identity systems that scale from a single mark to a whole season of screens. On the bench he is the reason a course looks like the client it was built for rather than like an authoring tool.',
      photo: '/images/art/jm-portrait.jpg',
      link: '/artists/jon-marc/',
    },
    {
      name: 'Nicole Cruz',
      role: 'Instructional designer',
      line: 'Brand identity and print-ready design',
      bio: 'Nicole designs identities for teams, events, and small businesses, work built to survive being worn, handed out, and kept. On the bench she carries job aids and reference pieces, the parts of a course that have to hold up on a wall or in a pocket.',
      photo: '/images/art/nc-portrait.webp?v=1',
      link: '/artists/nicole/',
    },
    {
      name: 'James Hayes',
      role: 'Instructional designer',
      line: 'Curriculum and assessment',
      bio: '',
      photo: null,
      link: null,
    },
  ],
  smes: [
    {
      name: 'Brittany Ferguson, CPA',
      role: 'Subject matter expert',
      field: 'Accounting and finance',
      credentialLine: 'Licensed CPA',
      line: 'Licensed CPA',
      bio: '',
      photo: null,
      link: null,
    },
    {
      name: 'Coty Jones',
      role: 'Subject matter expert',
      field: 'Construction and industrial project management',
      credentialLine: 'Working construction project manager',
      line: 'Working construction project manager',
      bio: '',
      photo: null,
      link: null,
    },
  ],
};

// The capabilities one-pager reads the SME fields from here.
export const smes = team.smes;

// Verticals we lead with. Construction first: Alex's prior years building
// training for the trades and a construction PM on the SME bench make it the
// deepest claim.
export const verticals = [
  {
    title: 'Construction and skilled trades',
    blurb: 'Safety, process, and craft training written by people who know a jobsite is not a classroom, validated by a working project manager.',
  },
  {
    title: 'Finance and accounting',
    blurb: 'Technical content reviewed by a licensed CPA, with the rigor that regulated topics and continuing education demand.',
  },
  {
    title: 'Everyone else with a backlog',
    blurb: 'Onboarding, compliance, systems training, and the fifty-slide deck that should have been a module years ago.',
  },
];

// Samples. `status` gates rendering:
//   'live'    renders in the grid and has a viewer page. Provenance CONFIRMED.
//   'planned' renders as a clearly marked placeholder card, no viewer page.
//   'audit'   renders NOWHERE. Listed so the provenance audit has a checklist.
//
// The viewer iframes `dir` (a self-contained HTML build under
// public/training-samples/). Each live sample owes a frame: what it is, what
// it demonstrates, the technique, and the accessibility standard it meets.
export const samples = [
  {
    slug: 'rfi-that-gets-answered',
    status: 'live',
    title: 'The RFI that gets answered',
    dir: '/training-samples/rfi/',
    backdrop: '/images/training/backdrops/sample-rfi.jpg?v=2',
    kind: 'Microlearning',
    vertical: 'Construction and trades',
    minutes: 6,
    what: 'A six-minute microlearning on writing a request for information that a design team can actually act on.',
    demonstrates: 'An original demonstration piece with a drawing-set identity: a title block, sheet numbers, and red-pen markups. No client, no employer material; the scenario is invented.',
    technique: 'Scenario branching with immediate feedback, a drag-free sorting activity, and a knowledge check that scores the decision rather than the recall.',
    accessibility: 'Keyboard operable end to end, screen reader tested, reduced motion respected, WCAG 2.1 AA.',
    built: 'Custom HTML, no framework, packaged for SCORM without changes.',
  },
  // The two originals that replaced the construction and finance placeholders
  // on 2026-09-03. Each has its own visual identity on purpose: a buyer
  // should see three pieces that look like three different clients, not
  // three pages of this website. Fonts and photography are licensed from
  // Envato Elements and live inside each sample's folder so the package is
  // self-contained for an LMS.
  {
    slug: 'hazard-recognition',
    status: 'live',
    title: 'Spot it before it hurts someone',
    dir: '/training-samples/safety/',
    backdrop: '/images/training/backdrops/sample-safety.jpg?v=2',
    kind: 'Short module',
    vertical: 'Construction and trades',
    minutes: 9,
    what: 'A nine-minute module on jobsite hazard recognition: a walk-through method, a hazard hunt, and the hierarchy of controls.',
    demonstrates: 'An original demonstration piece with a high-visibility industrial identity. No client, no employer material; the jobsite is invented. It is a teaching sample, not a substitute for a site-specific safety program.',
    technique: 'An illustrated hazard hunt with hotspots that also work as a keyboard list, a drag-free hierarchy-of-controls sorter, rapid stop-or-go decisions with feedback, and a walk-through checklist the learner assembles.',
    accessibility: 'Keyboard operable end to end, hotspots exposed as a list for screen readers, reduced motion respected, WCAG 2.1 AA.',
    built: 'Custom HTML, no framework, packaged for SCORM without changes.',
  },
  {
    slug: 'reading-the-pnl',
    status: 'live',
    title: 'The P&L, read like an owner',
    dir: '/training-samples/finance/',
    backdrop: '/images/training/backdrops/sample-finance.jpg?v=2',
    kind: 'Short module',
    vertical: 'Finance and accounting',
    minutes: 8,
    what: 'An eight-minute module for non-finance managers: what each line of a profit and loss statement means, why margin is the number that matters, and why profit is not cash.',
    demonstrates: 'An original demonstration piece with a ledger-book identity: ruled cream pages, folio numbers, a closing entry at the end. No client, no real figures; the business is invented. Reviewed for a general audience, not a substitute for advice from your accountant.',
    technique: 'A live profit and loss simulator with sliders and animated figures, a classify-the-line-item sorter, a profit-versus-cash scenario, and a margin check with a drawn waterfall chart.',
    accessibility: 'Keyboard operable end to end, sliders with accessible names and live value announcements, charts with text equivalents, reduced motion respected, WCAG 2.1 AA.',
    built: 'Custom HTML, no framework, packaged for SCORM without changes.',
  },
  {
    slug: 'planned-remediation',
    status: 'planned',
    title: 'Accessibility remediation, before and after',
    kind: 'Remediation',
    vertical: 'Any',
    what: 'An inaccessible legacy module and its remediated twin, side by side, with the audit findings that drove each change.',
  },

  // PROVENANCE AUDIT LIST. These eleven interactives already sit unlinked and
  // noindexed under public/interactives/ (sources in public/HTML Builds/).
  // Nothing in them names an employer, but that is not provenance. Each one
  // needs Alex to answer "built for a former employer, on their time, or from
  // their template?" before it can move to 'live'. Until then they render
  // nowhere.
  { slug: 'audit-welcome', status: 'audit', title: 'Welcome', dir: '/interactives/welcome/' },
  { slug: 'audit-the-why', status: 'audit', title: 'The why', dir: '/interactives/the-why/' },
  { slug: 'audit-learner-customer', status: 'audit', title: 'The learner is the customer', dir: '/interactives/the-learner-is-the-customer/' },
  { slug: 'audit-teaching-purpose', status: 'audit', title: 'Teaching with a purpose', dir: '/interactives/teaching-with-a-purpose/' },
  { slug: 'audit-success-measurable', status: 'audit', title: 'Success must be measurable', dir: '/interactives/success-must-be-measurable/' },
  { slug: 'audit-ideas-measure', status: 'audit', title: 'Ideas of things to measure', dir: '/interactives/ideas-to-measure/' },
  { slug: 'audit-strategy-design-1', status: 'audit', title: 'From strategy to design 1', dir: '/interactives/from-strategy-to-design-1/' },
  { slug: 'audit-strategy-design-2', status: 'audit', title: 'From strategy to design 2', dir: '/interactives/from-strategy-to-design-2/' },
  { slug: 'audit-check-in-1', status: 'audit', title: 'Check in 1', dir: '/interactives/check-in-1/' },
  { slug: 'audit-check-in-2', status: 'audit', title: 'Check in 2', dir: '/interactives/check-in-2/' },
  { slug: 'audit-phishing', status: 'audit', title: 'Phishing scenarios', dir: '/interactives/phishing-scenarios/' },
];

export const liveSamples = samples.filter((s) => s.status === 'live');
export const plannedSamples = samples.filter((s) => s.status === 'planned');
export const sampleBySlug = (slug) => liveSamples.find((s) => s.slug === slug);

// The inquiry form. This is the intake questionnaire from the launch
// checklist, so a lead arrives with what Alex needs to quote instead of
// what he needs to ask. Only the first four are required; the rest are
// optional and the labels say so. Posted to Web3Forms with the subject
// "New training inquiry | ka-performancefl.com".
export const inquiryFields = {
  required: ['name', 'organization', 'email', 'need'],
  sourceReadiness: ['Nothing yet, starting from scratch', 'Rough notes and slides', 'A complete existing course or document', 'Not sure'],
  smeAvailability: ['Yes, we have someone', 'Partly, limited hours', 'No, we would need yours', 'Not sure'],
  accessibilityRequirement: ['Required, WCAG 2.1 AA or similar', 'Preferred but not required', 'Not required', 'Not sure'],
  heardFrom: ['Referral', 'Search', 'LinkedIn', 'Other'],
};
