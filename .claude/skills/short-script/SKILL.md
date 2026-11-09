---
name: short-script
description: Research a surprising fact or curious question and write one 20-30 second YouTube Shorts voiceover
  (50-70 words) for a simple 2D cut-out cartoon, or in long mode a 4-6 scene script (150-450 words) for a 1-3 minute
  video. Use when making a new Short or video, or when asked for a Shorts script or topic.
---

# Short script

Two modes. Default = one Short (sections 1-4). Long mode = `--format long-vertical|long-horizontal` (section 5, which
changes sections 1, 3 and 4). The slug is `<yyyy-mm-dd>-<short-kebab-title>`, with today's date.

## 1. Pick a topic
- Read data/topics.json first. Never reuse a topic or a close variation of one, and rotate categories
  (science, animals, history, human body, space, engineering, everyday mysteries). Pick a category that is not
  among the last 3 used.
- Search the web for 5-8 candidate ideas. Good ones look like "Why don't we throw trash into volcanoes?": a simple
  solution people assume would work, and a surprising reason it doesn't. Other good shapes: an everyday mystery,
  a strange animal ability, an engineering choice that looks wrong but isn't.
- Score each idea 1-5 on: surprising answer, explainable in 25 seconds, easy to show with simple 2D cut-outs
  (one character + 1-3 objects + one setting), needs no background knowledge. Keep the highest total.

## 2. Verify
- Confirm the central fact in at least two reliable sources: original research, universities, museums, government
  agencies, established science organisations. Encyclopedias / news only as a cross-check.
- Do not invent facts, numbers, quotes or consequences. Where the science is uncertain, say so in the script
  ("probably", "most of it").
- If you cannot browse, say so and stop. Never pretend to have researched.

## 3. Write the voiceover (50-70 words, 20-30 s, 6-9 short lines)
- Line 1 is a specific question or surprising statement that names what we see in frame 0. No greeting.
- Build curiosity: what would happen, why the obvious answer is wrong, what makes it odd. Then a clear, satisfying
  answer near the end. The payoff lands on the last words.
- Plain, spoken English, short connected sentences. Casual words ("so", "basically", "right?") are allowed where
  they sound natural, never required. Every sentence adds information.
- Banned: "Did you know", "This will blow your mind", "You won't believe", "here's the thing", "but here's the part",
  hype words (incredible, shocking, amazing, insane), "!" lines, calls to action, AI-sounding phrases.
- Original wording only; never copy another creator's script.

## 4. Output (write files, then show the user)
- shorts/<date>-<slug>/script.md: one-sentence idea, the voiceover (one line per beat, no scene directions),
  word count.
- shorts/<date>-<slug>/sources.md: the links, each with one line on what it supports.
- shorts/<date>-<slug>/meta.json: {slug, date, title, category, topic, status: "script", word_count}.
  For a Short also `format: "short"`. Keep any fields that are already there.
- Append {slug, topic, category, date} to data/topics.json. Run `python scripts/register.py`.

## 5. Long mode (`--format long-vertical` or `--format long-horizontal`)
Same research rules, more of everything.

| format | length | words (about 150 a minute) | scenes |
|---|---|---|---|
| long-vertical | 60-180 s, must stay UNDER 3:00 | 150-430 | 4-6 |
| long-horizontal | 3:05-3:30, must run PAST 3:00 | 460-520 | 5-6 |

- Topic: it needs enough depth for 4-6 steps: a chain of causes, a "what would happen if" with several stages, a
  history with a twist. Score ideas on depth (1-5) as well as on the four Short criteria; keep the highest total.
- Structure: 4-6 scenes of 20-40 s each. Scene 1 opens on the premise exactly like a Short (line 1 names what we see
  in frame 0, no greeting). Every scene ends with a small open question that the next scene answers ("so why doesn't
  that work?"). The main payoff still lands at the very end.
- Each scene is voiced as its own take, so every scene must make sense when read alone: no sentence may run across a
  scene boundary.
- Verify every fact, not just the central one: each claim in the script gets a line in sources.md with the link that
  supports it, cross-checked in a second source. More facts means more checking; cut a fact you cannot confirm.
- Same wording rules and the same banned phrases as section 3.
- Output: script.md with the one-sentence idea, then one `## Scene N - <name>` heading per scene with its lines (one
  line per beat, no scene directions), a word count per scene and the total, and the estimated length
  (words / 150 x 60 s). meta.json gets `format`, `aspect` ("9:16" or "16:9"), `word_count`,
  `scenes: {count, names}` and `image_budget: 60`. topics.json and register.py as in section 4.
- Check before you finish: estimated length is inside the format's range. A long-vertical script over 430 words or a
  long-horizontal script under 460 words must be rewritten, not hoped for.
