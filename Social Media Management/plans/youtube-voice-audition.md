# Brief: YouTube narrator voice audition

Part of `plans/youtube-channel.md`, build step 1. Written 2026-09-28.
Approved: yes (Alex, 2026-09-28, as written)

## What it is for
To choose the stock ElevenLabs voice that narrates every long-form YouTube video. You pick by ear.

## The script (about 20 seconds, the opening of topic 1)
> Here's a test you can run on your own website in about a minute. Move your mouse aside and
> press the Tab key. Watch where the highlight goes. If you can't see it, or it skips right past
> your Book Now button, some of your customers can't use your site either. I'm with K and A
> Performance in Gainesville. Let's fix it.

It's written the way the videos will sound: second person, short sentences, one clear next step.
"K and A" is spelled out for the voice, as the pipeline rules require.

## Shortlist (warm, plain-spoken, American, made for long listening; Sarah left out)
| Voice | ElevenLabs description | Why it's here |
|---|---|---|
| Chris | Charming, down-to-earth, American male, middle-aged | "Natural and real", the closest to a local owner talking |
| Eric | Smooth, trustworthy, American male, 40s | Calm tenor; the control voice from the tutorial audition |
| Amy | Natural and sweet, American female, 30s | Conversational rather than announcer |
| Diane | Assured and smooth, American female, middle-aged | Steady pace, easy for 5 to 10 minutes |
| Matilda | Knowledgeable, professional, American female, alto | Was the runner-up in the Sarah audition |

Left out: the social-media, hyped and character voices (Laura, Jessica, Liam, Adam), and the
British and Australian voices, because the channel is for Gainesville owners.

## How it's made
- Model `eleven_multilingual_v2`, default settings, for all five, so only the voice differs. v2 is
  steadier over long reads than v3, and you felt the v3 reads sounded like AI.
- Each voice reads the script once (seed fixed) and saves an MP3 to
  `Reels/youtube/voice-audition/`, plus one page where you can play them side by side.
- Cost: about 330 characters for each of the five voices, around 1,650 credits in total.

## After you pick
The chosen voice is written into the YouTube config and used for every long-form video. A second
round is possible if none of the five land.

## Result (2026-09-28)
Alex picked **Amy** (voice id `OZxMHsGaBmV5pjMIDIn0`), `eleven_multilingual_v2`, stability 0.5,
similarity 0.75, style 0, speaker boost on, speed 1, output mp3_44100_192. Her read of the
331-character script ran 19.6 s. Takes: `Reels/youtube/voice-audition/` (`audition.json` logs them).
