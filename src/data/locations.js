// Where the studio is and where it works, in one place. The schema's
// areaServed, the footer's serving line, the contact page's "Where we work",
// and the two location pages all read from here, so adding a town or opening
// a door is one edit, and the pages cannot drift from the structured data.
//
// Gainesville is the headquarters and stays city-only: there is no public
// street address there. Ellenton is the office. Its street is recorded here
// and nowhere else in the repo, and scripts/seo-check.mjs fails the build if
// it turns up anywhere in dist/ while `published` is false.
export const locations = {
  gainesville: { name: 'Gainesville', region: 'FL', role: 'headquarters', page: '/locations/gainesville/', published: true, street: null },
  ellenton: {
    name: 'Ellenton', region: 'FL', role: 'office', page: '/locations/ellenton/',
    // Flip to true the day the lease is signed. Until then nothing renders the
    // street, the postal code, a map or hours, and the build gate fails if the
    // street appears anywhere in dist/.
    published: false,
    street: '909 25th Dr', postalCode: '34222', mapUrl: null, hoursNote: 'By appointment',
  },
};

// In display order. `inPerson` is whether meetings happen in a room; `base` is
// the location the region is worked from.
export const regions = [
  { key: 'north-central',      label: 'North Central Florida', inPerson: true,  base: 'gainesville', cities: ['Gainesville', 'Alachua', 'Newberry', 'High Springs', 'Ocala'] },
  { key: 'northeast',          label: 'Northeast Florida',     inPerson: false, base: 'gainesville', cities: ['Jacksonville', 'Fleming Island', 'Orange Park', 'St. Augustine'] },
  { key: 'bradenton-sarasota', label: 'Bradenton & Sarasota',  inPerson: true,  base: 'ellenton',    cities: ['Ellenton', 'Bradenton', 'Sarasota', 'St. Petersburg', 'Tampa', 'Brandon'] },
];

export const citiesServed = regions.flatMap((r) => r.cities); // fifteen, fixed order
