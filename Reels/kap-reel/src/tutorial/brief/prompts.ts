// The two prompts and the two real model outputs the "give the AI the brief"
// reel shows on screen.
//
// Copied verbatim from the day folder's source/prompt-run.md:
//   Social Media Management/To Be Released/2026-10-01/source/prompt-run.md
// Model: Claude Fable 5.1 (Anthropic), run in Claude Code on 2026-09-24 at
// 17:40 local. Both outputs are the model's first response to each prompt,
// unedited. Nothing here may be retyped, tidied or shortened except by
// dropping whole paragraphs: the weak output is shown in full, the good output
// shows its subject, greeting and first two paragraphs, as written. The bakery
// and "Maria" are fictional, and the reel labels them "example".
//
// No React in here, so the pipeline script can read it too.

/** An email as the model wrote it: a subject line, then paragraphs. */
export type ModelOutput = {
  subject: string;
  /** Every paragraph after the subject, in order, salutation included. */
  paragraphs: string[];
};

export const WEAK_PROMPT = "Write a follow up email";

export const GOOD_PROMPT =
  "Write a follow up to a bakery owner who asked about pricing and is nervous about cost";

/** Prompt 1's output, in full. */
export const WEAK_OUTPUT: ModelOutput = {
  subject: "Following Up",
  paragraphs: [
    "Hi [Name],",
    "I wanted to follow up on my previous message. Please let me know if you have any questions or if there is anything else I can help you with.",
    "I look forward to hearing from you.",
    "Best regards,\n[Your Name]",
  ],
};

/** Prompt 2's output, in full. The reel shows GOOD_OUTPUT_SHOWN. */
export const GOOD_OUTPUT: ModelOutput = {
  subject: "Your website, and what it would actually cost",
  paragraphs: [
    "Hi Maria,",
    "Thanks for asking about pricing. I know a website can feel like a big spend for a bakery, so here is the straight version.",
    "Most bakery sites we build land between $2,500 and $5,000, paid in three parts. That gets you a site people can order from on their phone, your hours and menu in one place, and a page that shows up when someone searches for bread near you.",
    "You do not need everything on day one. We can start with the pages that bring in orders and add the rest when they pay for themselves.",
    "If it helps, I can walk you through a bakery site we built and show you what each part did for them. No pressure either way.",
    "Alex",
  ],
};

/**
 * What the reel shows of the good output: the subject, the greeting and the
 * first two paragraphs of the body, word for word. The card says it is the
 * first two paragraphs, so nothing reads as the whole email.
 */
export const GOOD_OUTPUT_SHOWN: ModelOutput = {
  subject: GOOD_OUTPUT.subject,
  paragraphs: GOOD_OUTPUT.paragraphs.slice(0, 3),
};

/** The line under the two outputs. */
export const OUTPUTS_CREDIT = "Outputs: Claude, unedited";
