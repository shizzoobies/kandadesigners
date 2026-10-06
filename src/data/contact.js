// Public contact details, in one place. The site published no phone number
// until 2026-09-25, when Alex approved tap-to-call. Every tel: link and the
// structured data read from here, so a change of number is one edit.
//
// `display` is the human spelling on the page. Listings use "(904) 210-1071"
// (see the handoff's facts for any listing); the site uses dashes because it
// reads cleanly inline and wraps as one unit. `href` is E.164 so the link
// dials correctly from any phone. `schema` is the schema.org spelling.
export const phone = {
  display: '904-210-1071',
  href: 'tel:+19042101071',
  schema: '+1-904-210-1071',
};

export const email = 'alex@ka-performancefl.com';

// The Google Business Profile, which is also the map pin. K&A is a
// service-area business with no public street address, so this link is how
// the site points at the map: never add a street here. BaseLayout's hasMap
// and sameAs, the footer's map link and the review links all read it.
export const mapUrl = 'https://g.page/r/CbVcBGWcGmNzEBM';

// Opening hours, exactly as K&A's Google Business Profile lists them,
// captured signed out on 2026-09-30 (Social Media Management/To Be Released/
// 2026-10-14-4/source/captures/capture-metadata.json), and published on the
// site 2026-10-06 with Alex's approval. Change the profile first, then here:
// the footer, the contact page and the openingHoursSpecification in
// BaseLayout all read this list. `label` and `time` are the page spelling;
// `days`, `opens` and `closes` are the schema.org values. A closed day has
// no `opens`, and the schema leaves it out, which is how schema.org says
// closed.
export const hours = [
  {
    label: 'Monday to Friday',
    time: '8 AM to 5 PM',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '17:00',
  },
  { label: 'Saturday', time: '8 AM to 2:30 PM', days: ['Saturday'], opens: '08:00', closes: '14:30' },
  { label: 'Sunday', time: 'Closed', days: ['Sunday'] },
];
