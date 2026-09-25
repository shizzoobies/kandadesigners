// Google reviews for the home-page rail. PLACEHOLDERS: swap each entry for
// a real review. Copy the text exactly as posted on the Google Business
// profile and keep the reviewer's first name as shown there. The rail
// renders whatever is in this list.
export const reviews = [
  {
    name: 'Placeholder One',
    rating: 5,
    text: '[Placeholder] Swap this for a real Google review. Copy the wording exactly as posted and keep the first name as shown.',
  },
  {
    name: 'Placeholder Two',
    rating: 5,
    text: '[Placeholder] A shorter review goes here so the rail has natural rhythm.',
  },
  {
    name: 'Placeholder Three',
    rating: 5,
    text: '[Placeholder] Reviews of different lengths read best. This one runs a little longer to show how a fuller quote wraps inside the card without breaking the layout.',
  },
  {
    name: 'Placeholder Four',
    rating: 5,
    text: '[Placeholder] Another medium-length review to round out the loop.',
  },
  {
    name: 'Placeholder Five',
    rating: 5,
    text: '[Placeholder] One more so the rail loops without visible repetition.',
  },
];

// The Google rating quoted in the home hero's proof line. This is the one
// place to update it: rating and count as the Business Profile shows them
// (checked against /api/reviews on 2026-09-25: 5.0 across 8 reviews). The
// reviews rail refreshes the hero line from the live API when it loads, so
// these numbers are the first paint and the no-JS fallback.
export const googleRating = { rating: 5.0, count: 8 };
