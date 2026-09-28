# YouTube channel setup: About text and checklist

Part of `plans/youtube-channel.md`, build step 3. Written 2026-09-28.
Approved: yes (Alex, 2026-09-28)

Everything here is typed into YouTube Studio > Customization by Alex (or with Claude walking
through it). Nothing is changed on the channel until Alex approves this file.

## About text (description)

YouTube allows 1,000 characters. This draft is about 830.

> Practical fixes for your business website, Google listing and everyday AI. A new walkthrough every week from a Gainesville web studio.
>
> We're Alex and Kristina Anderson of K&A Performance. We build websites for small businesses across North Central and Northeast Florida, and we'd rather show you how to fix something than sell you a buzzword.
>
> Each week you'll get a step-by-step video you can follow on your own:
> · Quick fixes for your website and Google Business Profile
> · Practical AI that saves real time in a small business
> · Short tips most weekdays
>
> Serving Gainesville, Alachua, Newberry, High Springs, Ocala, Jacksonville, Orange Park, Fleming Island and St. Augustine. Quotes are always free, and accessibility is built into every site we make.
>
> Want help with your own site? Call Alex at 904-210-1071 or visit ka-performancefl.com.

## Links (Customization > Profile > Links)

The first link shows beside the channel name. Every K&A link is tagged
`utm_source=youtube&utm_medium=social&utm_campaign=channel-about`.

| Order | Title | URL |
|---|---|---|
| 1 | Website | https://ka-performancefl.com/?utm_source=youtube&utm_medium=social&utm_campaign=channel-about |
| 2 | Get a free quote | https://ka-performancefl.com/contact/?utm_source=youtube&utm_medium=social&utm_campaign=channel-about |
| 3 | 90-Day AI Launch | https://ka-performancefl.com/ai-launch/?utm_source=youtube&utm_medium=social&utm_campaign=channel-about |
| 4 | Instagram | https://www.instagram.com/kaperformancefl/ |
| 5 | Facebook | https://www.facebook.com/profile.php?id=61592711216301 |
| 6 | LinkedIn | https://www.linkedin.com/company/129934379/ |

Contact info (Customization > Profile > Contact info): **alex@ka-performancefl.com**, the address
the site uses everywhere. It's shown to viewers who ask for it for business inquiries.

## Setup checklist

### Account (Alex)
- [ ] Add Kristina as a manager on the Brand Account (Settings > Permissions).
- [ ] Verify the channel by phone (youtube.com/verify). This unlocks custom thumbnails and videos
      longer than 15 minutes.
- [ ] Confirm the handle stays @KAPerformancefl.

### Profile (Customization > Profile)
- [ ] Name: K & A Performance (already set).
- [ ] Description: the About text above.
- [ ] Links: the six above, in that order.
- [ ] Contact info: alex@ka-performancefl.com.

### Branding (Customization > Branding), after the art is picked
- [ ] Profile picture: the chosen avatar (800x800).
- [ ] Banner: the chosen banner (2560x1440). Check the phone preview in the upload dialog.
- [ ] Video watermark: `watermark.png`, shown for the entire video.

### Upload defaults (Settings > Upload defaults)
- [ ] Visibility: Private. Videos are only made public by Metricool's schedule or by hand after
      approval, so nothing goes out by accident.
- [ ] Category: Howto & Style.
- [ ] Language: English. Captions certification: none (not broadcast TV).
- [ ] Audience: No, it's not made for kids.
- [ ] Altered or synthetic content: leave per video. Metricool sets it (`isAiGeneratedContent`),
      and every long-form video is flagged because Amy's voice is AI.
- [ ] Tags: `Gainesville web design, small business website, Google Business Profile, website
      accessibility, small business tips`.
- [ ] Description template:

```
<one-line hook: what the viewer will be able to do>
<tagged link to the page that fits>

<two or three sentences on what the video covers>

Chapters
0:00 <chapter>

The voice is AI narrated.

K&A Performance builds websites for small businesses in Gainesville and North Florida.
Free quotes: 904-210-1071 | ka-performancefl.com
```

### Layout (Customization > Layout), once there are videos
- [ ] Playlists: "Quick fixes for your website" and "Practical AI for small business".
- [ ] Home page sections: For you (default), Videos, Quick fixes playlist, Practical AI playlist, Shorts.
- [ ] Channel trailer for people who haven't subscribed: a 45 to 60 second cut, made once the first
      two videos exist.
- [ ] Featured video for returning subscribers: the latest upload (YouTube's default).

### Connections, after setup
- [ ] Alex: connect YouTube in Metricool brand 7076479. Claude then confirms it through the connector.
- [ ] Site footer and JSON-LD `sameAs`: add the channel URL (in a worktree off origin/main,
      deployed only on Alex's go-ahead).
- [ ] Instagram SmartLink: add a YouTube button.
- [ ] Google Business Profile: add the YouTube link under social profiles.

## Notes
- The About text says "a new walkthrough every week", so the first long-form video should be ready
  before the channel is promoted anywhere.
- "Short tips most weekdays" matches the plan: each weekday reel goes up as a Short.
- To confirm in Studio: the 1,000-character description limit and the number of allowed links.
  Studio shows a live counter.
