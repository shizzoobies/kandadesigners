# Client social: posts K&A makes, the client's owner posts

Each client with a Post Desk has a folder here, named by its admin site slug
(`clients/<slug>/`, e.g. `clients/davids-bbq/`). The slug matches the site in
admin.ka-performancefl.com, so its desk is `/sites/<slug>/social`.

Most of the K&A rules in `../README.md` apply (plan first, the day folder,
post.json, captions, no em dashes, US English). This file lists what is
different for a client.

## The client folder

```
clients/davids-bbq/
  client.json        who the client is and how posts reach them (below)
  plans/             weekly or batch plans Alex approves before anything is made
  To Be Released/    one day folder per post, exactly like K&A's (see ../README.md)
  Handed Off/        folders move here once the post is handed to the owner
  review/            built by the tools (data.json, files.json, proxies); do not edit
```

`validate` enforces the differences above for a `publish: "owner"` client: `platforms`
may only name a network in `networks`, `type` is `POST` or `REEL` only, and `manual`
is rejected (every network there is posted by hand already). `handoff` (below) is
the only command that writes `status: "handed-off"`; nothing else uses that status.

`client.json`:

```json
{
  "slug": "davids-bbq",
  "name": "David's BBQ",
  "site": "https://davidsbbq.com",
  "sitePath": "D:/Davis Catering/davids-catering",
  "publish": "owner",
  "networks": ["facebook", "instagram"],
  "timezone": "America/New_York",
  "handoff": {
    "drive": "K & A Social > Clients > David's BBQ > Ready to post",
    "driveFolderId": "1C2Ds2f-lVcPOgMu4ew8m2S4IlnFYHdZd"
  }
}
```

`publish: "owner"` means K&A does not have the client's social logins: nothing
goes through Metricool. The owner posts each approved post by hand from a
shared Drive folder.

## Making posts (what the content chat does)

1. Plan first: write `plans/<batch or week>.md` (post list, dates, pillar,
   hook, format) for Alex to approve. Nothing is made before that.
2. For each post, a day folder in `To Be Released/` named `YYYY-MM-DD` (the
   suggested posting date), `-2` for a second post that day. Same files as
   K&A: `post.json`, `brief.md`, `facebook.md`, `instagram.md`, `media/`.
3. `post.json`:
   - `platforms` names only `facebook` and/or `instagram` (from `networks`),
     each with `type` (`POST` or `REEL`) and `caption`. No `linkedin`, no
     `manual` flags: in a `publish: "owner"` client, every network is posted by
     the owner.
   - `time` is the suggested posting time the owner sees.
   - Leave `r2`, `metricool`, `published` empty; they are not used here.
   - Set `status` to `ready` once media and captions are final. That is what
     puts the post on the desk.
4. Captions:
   - `facebook.md`: posted as written. Put the client's link on line 2, tagged
     `https://davidsbbq.com/?utm_source=facebook&utm_medium=social&utm_campaign=<folder>`.
   - `instagram.md`: the caption, then `## First comment` and the hashtags.
     Links do not click on Instagram, so point to the link in their bio.
5. Media: images 1080x1350 (4:5) for feed posts, video 1080x1920 for reels.
   Every image has `alt` in post.json. Carousels are several `image` entries.
6. Brand: the client's brand, colors and URL, not K&A's. No K&A logo on a
   client's posts unless Alex asks for a credit.
7. Truth: menu items, prices, hours and claims come from the client's real
   site (`sitePath`) or from the owner. Nothing invented, no promised results.
   Photos: the client's own (site or owner-supplied) unless the brief says
   otherwise; mark AI visuals in `post.json` `ai`.
8. Questions for Alex go under `## Questions for Alex` in `brief.md`; they show
   on the desk.

## After making posts (what Claude runs, from Social Media Management)

```
node tools/social.mjs --client davids-bbq validate
node tools/review.mjs --client davids-bbq          # builds clients/davids-bbq/review/
node tools/social.mjs --client davids-bbq desk push
node tools/social.mjs --client davids-bbq desk pull   # Alex's decisions
node tools/social.mjs --client davids-bbq handoff     # approved posts -> hand-off folders
```

Alex approves on the client's desk (sites list, the client's Post Desk
button). Claude pulls, sets approved posts to `approved` (and stamps
`Approved: yes` into the brief, which `handoff` requires), runs `handoff`, and
creates each hand-off folder in the client's Drive folder with the three text
files. The videos are the one manual step: the Drive connector takes file
content inline, which is fine for captions and hopeless for a 4 to 9 MB reel,
and Drive's web UI blocks Claude in Chrome on this machine (an extension frame
on drive.google.com). Alex drags each `video.mp4` from
`Handed Off/<folder>/handoff/` into its Drive folder (first done Sept 27,
2026). `upload` and `release` refuse a `publish: "owner"` client: those are
for Metricool.

## The hand-off folder (what the owner gets)

One folder per post in Drive, named `<date> <title>`:

```
2026-10-06 Brisket Saturday/
  1.jpg, 2.jpg ...            the images in carousel order, numbered, own extension
  video.mp4                   a Reel/video, named plainly (video-2.mp4... for more than one)
  video-facebook.mp4          a video meant only for one network (its own post.json
                               media entry names `"platforms": ["facebook"]`)
  Facebook caption.txt        paste as the Facebook post
  Instagram caption.txt       the caption, then the hashtags as a first comment (only
                               written when there are hashtags to paste)
  How to post.txt             suggested date and time, which files go to which network,
                               and which caption file to paste where
```

`handoff` validates the folder first (the same rules as `validate`, except an
approved post's suggested time already having passed - late is fine) and
refuses one with a real problem, reported like a skip. It renames the folder
to `Handed Off/<folder>/` first, and only then writes `post.json`
`status: "handed-off"` with `handoff: {at, files}` (the file list above) into
the moved copy: if the rename itself fails, the original folder and its
`post.json` are untouched, safe to retry. A folder not `approved` (and not
already stuck mid-hand-off as `handed-off` in `To Be Released/`) is skipped
and reported, not touched.

Every monitored business has a Drive folder under K & A Social > Clients, with
three subfolders:
- `Photos and videos`: the owner drops their own photos and video there; the
  content chat uses them as source media.
- `In review`: posts waiting on Alex. The admin Post Desk is where he approves;
  this folder is the Drive-side home for drafts while the full pipeline comes
  together (for example, when a post is built outside these tools).
- `Ready to post`: hand-offs land there.

All ids are in `clients/drive-folders.json`. Alex shares the business folder
with the owner once; new posts appear there. If the owner has the whole
business folder, they can also see `In review`, so anything placed there is
visible to them before it is approved. The local copy of each hand-off is in `Handed Off/<folder>/handoff/`.
