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
