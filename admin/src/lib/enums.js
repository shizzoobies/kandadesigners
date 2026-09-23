// Whitelists and their display labels. Form input is checked against these
// arrays; nothing outside them is ever written.

export const HOSTING = ['pages', 'worker', 'client-push', 'other'];
export const HOSTING_LABEL = {
  pages: 'Cloudflare Pages',
  worker: 'Cloudflare Worker',
  'client-push': "Client's repo or server",
  other: 'Other',
};

export const PROJECT_STATUS = ['live', 'in_progress', 'waiting_client', 'paused'];
export const STATUS_LABEL = {
  live: 'Live',
  in_progress: 'In progress',
  waiting_client: 'Waiting on client',
  paused: 'Paused',
};

export const LEVELS = ['red', 'amber', 'gray', 'green'];
export const LEVEL_LABEL = { red: 'Problem', amber: 'Needs a look', gray: 'No data', green: 'Healthy' };

export const ROLES = ['owner', 'maintainer'];
