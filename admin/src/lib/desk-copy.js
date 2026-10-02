// The desk's own words, per viewer. Alex's desk talks about Claude, the
// release folders and the Stories README; a client's desk names none of K&A's
// tools, folders or files. Shared by the desk page (server) and its script.

export function deskCopy({ client, canWrite }) {
  if (!client) {
    return {
      conn: (stories) => (canWrite
        ? `Decisions${stories ? ' and Story ticks' : ''} save as you make them. Claude reads them from here.`
        : `Read only. Your access to this desk is view only, so you can see posts but not approve them${stories ? ' or tick Stories' : ''}.`),
      emptyDetail: (stories) => `New posts show up here after Claude builds them.${stories ? ' The Stories you post by hand are under Stories.' : ''}`,
      storiesPaused: 'Nothing to post by hand for now. Ask Claude to turn them back on when you have time for them.',
      noStories: 'No Stories on the schedule. Ask Claude to rebuild the desk after the next week is planned.',
      noteNeeded: 'Add a note so I know what to change',
      stickerFallback: 'See stories/README.md',
      noMedia: 'No media in this folder.',
      showInternalFacts: true,
    };
  }
  return {
    conn: (stories) => (canWrite
      ? `Your decisions${stories ? ' and Story ticks' : ''} save as you make them. K&A sees them right away.`
      : `Read only. Your access to this desk is view only, so you can see posts but not approve them${stories ? ' or tick Stories' : ''}.`),
    emptyDetail: (stories) => `New posts show up here once they are ready for you.${stories ? ' The Stories to post by hand are under Stories.' : ''}`,
    storiesPaused: 'Nothing to post by hand for now.',
    noStories: 'No Stories on the schedule yet.',
    noteNeeded: 'Add a note saying what should change',
    stickerFallback: 'No link for this Story yet.',
    noMedia: 'No media for this post yet.',
    showInternalFacts: false,
  };
}
