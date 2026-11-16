---
name: short-script
description: Research a surprising fact or curious question, package it first (title + thumbnail or frame-0 idea,
  checked against existing videos), then write one 20-30 second YouTube Shorts voiceover (50-70 words) for a simple 2D
  cut-out cartoon, or in long mode a scene script for a 16:9 video (long-horizontal 1-3.5 minutes, 4-6 scenes;
  long-midroll 8-12 minutes, 10-16 scenes). Use when making a new Short or video, or when asked for a Shorts script,
  a topic, a title or a thumbnail idea.
---

# Short script

Two modes. Default = one Short (sections 1-4, 9:16). Long mode = `--format long-horizontal` or
`--format long-midroll` (section 5, which changes sections 1, 3 and 4): anything over one minute is a 16:9 video. The
slug is `<yyyy-mm-dd>-<short-kebab-title>`, with today's date. The channel's identity (audience, mascot, packaging
style) is in data/channel.json: read it first.

## 1. Pick a topic and package it first
A video is chosen for its title and its thumbnail (or, for a Short, its first frame) before anyone hears a word, so
the package is decided before the script and the script is written to deliver it.

### 1.1 Candidates
- Read data/topics.json first. Never reuse a topic or a close variation of one, and rotate categories
  (science, animals, history, human body, space, engineering, everyday mysteries). Pick a category that is not
  among the last 3 used.
- Demand signal (when YOUTUBE_API_KEY is set): 2-4 searches in the category's shapes,
  `python .claude/skills/cutout-cartoon-shorts/scripts/find_topics.py --query "why don't we" --query "what would happen if" --for short`
  (`--for long-horizontal` / `--for long-midroll` in long mode; 100 quota units per query, 10,000 a day). Outliers
  (x 3 or more: far more views than their channel usually gets) show which questions people want answered right now.
  They are a signal, never a source: no title, thumbnail, script or transcript is copied; we answer the question our
  own way, with our own research, mascot and angle.
- Search the web for 5-8 candidate ideas. Good ones look like "Why don't we throw trash into volcanoes?": a simple
  solution people assume would work, and a surprising reason it doesn't. Other good shapes: an everyday mystery,
  a strange animal ability, an engineering choice that looks wrong but isn't.
- Score each idea 1-5 on: surprising answer, explainable in 25 seconds, easy to show with simple 2D cut-outs
  (one character + 1-3 objects + one setting), needs no background knowledge. Keep the 2-3 highest totals for 1.2.

### 1.2 Package before writing
For each of the 2-3 best ideas:
- 5-8 titles. A title is a specific question or claim with a curiosity gap the video really closes: concrete nouns
  ("trash", "volcano"), no hype words (incredible, shocking, insane, you won't believe), no ALL CAPS, no emoji, no
  clickbait the video does not pay off. Length: at most data/channel.json packaging.title_max_chars (a Short 50, a
  long video 60; YouTube cuts longer titles on phones). Sentence case.
- The picture. A Short: the frame-0 idea (the premise, centred, readable like a thumbnail: our mascot, the thing and
  the setting). A long video: a thumbnail idea in data/channel.json's thumbnail_style: the mascot big with one clear
  emotion next to the one thing the video is about, one focal point, a simple bold background, plus 0-4 words of
  thumbnail text that add to the title instead of repeating it ("NOPE", "1,200 °C").
- Pick the strongest title + picture pair: would a curious viewer who has never heard of us click it on a phone?
  Then a promise in one line: what the viewer expects to learn. The script must pay it off.

### 1.3 Originality check
- `python .claude/skills/cutout-cartoon-shorts/scripts/find_topics.py --similar "<title>" [--for short]`: exit code 4
  means a popular video (100,000+ views) already has a near-identical title: change the angle or the wording so ours
  is clearly a different video, and run it again. Without YOUTUBE_API_KEY, search the title on YouTube through the
  web and look at the first results yourself.
- For a long video add `--sheet shorts/<slug>/qa/niche-thumbs.png` once the folder exists and look at it: our
  thumbnail idea must not look like any of them (same layout, same colours, same pose).
- Never a character, logo, art style or name owned by someone else (Family Guy, Disney, anime, games ...), not even
  "a version of" one, and never another channel's look. Our mascot is data/channel.json's.

## 2. Verify
- Confirm the central fact in at least two reliable sources: original research, universities, museums, government
  agencies, established science organisations. Encyclopedias / news only as a cross-check.
- Verify what the title and the thumbnail promise too. If the facts do not support the promise, change the package
  (or take the next idea), never the facts.
- Do not invent facts, numbers, quotes or consequences. Where the science is uncertain, say so in the script
  ("probably", "most of it").
- If you cannot browse, say so and stop. Never pretend to have researched.

## 3. Write the voiceover (50-70 words, 20-30 s, 6-9 short lines)
- Deliver the package: line 1 is a specific question or surprising statement that names what we see in frame 0 (and,
  in a long video, what the thumbnail showed). No greeting. The payoff answers the title's question.
- Build curiosity: what would happen, why the obvious answer is wrong, what makes it odd. Then a clear, satisfying
  answer near the end. The payoff lands on the last words.
- Plain, spoken English, short connected sentences. Casual words ("so", "basically", "right?") are allowed where
  they sound natural, never required. Every sentence adds information.
- Banned: "Did you know", "This will blow your mind", "You won't believe", "here's the thing", "but here's the part",
  hype words (incredible, shocking, amazing, insane), "!" lines, calls to action, AI-sounding phrases.
- Original wording only; never copy another creator's script.
- Audio tags: Eleven v4 performs words in square brackets instead of reading them, and the subtitles never show
  them. Use them sparingly, where a real reaction belongs; plain lines are the default.
  - Allowed: emotion [excited] [playful] [tired] [bored] [angry] [menacing] [weak]; delivery [whispering] [softly]
    [slowly] [pause] [voice breaking] [singing]; vocalizations [chuckling] [laughing] [sighing] [gasping] [scoffing]
    [sharp exhale] [clears throat] [yawning] [humming] [panting] [sniffling] [coughing]. Lower case, spelled exactly so.
  - How many: a Short 1-3, a long video about one every 2-3 lines; one per line at most, never on every line, never
    the same tag twice in a row.
  - Where: right before the words it colours (emotion, delivery), or exactly where the sound happens (vocalization,
    [pause]). A vocalization is a beat the character acts on screen at that moment: [gasping] when the volcano opens
    its eyes, [chuckling] on the payoff. A [pause] goes before a reveal.
  - Character voices ([witch voice], [sleepy drowsy voice], [drunken voice]) only on a quoted line spoken by a
    character or an object, at most once per video.
  - Never sound-effect tags ([dog barking], [applause], [drum roll], [rain falling], [keyboard typing], [echoing],
    [knocking on door], [bell ringing], [phone ringing], [crowd cheering], [heartbeat], [engine starting] ...): every
    sound in a video is a real Openverse recording placed on its frame by the sound step.
  - Every line must read well with its tags removed (that is what the subtitles show). Tags are not words: leave them
    out of the word count; each vocalization or [pause] adds about half a second.
  - Check: `python .claude/skills/cutout-cartoon-shorts/scripts/audio_tags.py --slug <slug>` (fails on a sound-effect
    tag; warns on too many tags, an unknown spelling, a character voice outside quotes, a length outside the format).

## 4. Output (write files, then show the user)
- shorts/<date>-<slug>/packaging.md, in this layout (thumbnail.py and upload.py read the `Key: value` lines, so keep
  them exact and on one line each):

```
# Packaging

Title: <the chosen title>
Thumbnail: <long videos: what the picture shows, one sentence>
Thumbnail text: <0-4 words, or none>
Frame 0: <what the first frame shows>
Promise: <what the viewer learns; the script pays it off>
Description: <1-2 sentences for the top of the YouTube description: the question, no spoilers, no hype>

## Other titles
- <the titles not chosen, best first>

## Originality check
- <find_topics.py --similar: the closest existing titles with their views, and why ours is different>
```
- shorts/<date>-<slug>/script.md, in this layout (subtitles.py reads it, so keep it exact):
  `Idea: <one sentence>`, a blank line, the voiceover (one line per beat, no scene directions, no list markers, no
  quotes around whole lines; audio tags inline where they are performed), a blank line, `Words: N` (spoken words, tags
  not counted). The voiceover lines are exactly what the voice will say: without their tags they become the subtitles
  of long videos word for word. Run audio_tags.py on it.
- shorts/<date>-<slug>/sources.md: the links, each with one line on what it supports (upload.py copies them into
  the YouTube description).
- shorts/<date>-<slug>/meta.json: {slug, date, title (= the packaging title), category, topic, status: "script",
  word_count}. For a Short also `format: "short"`. Keep any fields that are already there.
- Append {slug, topic, category, date} to data/topics.json. Run `python scripts/register.py`.

## 5. Long mode (`--format long-horizontal` or `--format long-midroll`)
Same research rules, more of everything. Every video over one minute is 16:9; `long-vertical` is retired, so a
request for a "long vertical" video still gets a 16:9 script.

| format | length | words (about 150 a minute) | scenes | new pictures |
|---|---|---|---|---|
| long-horizontal | 1:00-3:30 (aim for 2:00-3:00 unless asked) | 150-520 (aim for 300-450) | 4-6 | 60 |
| long-midroll | 8:00-12:00 (aim for 8:20-10:00) | 1,250-1,800 (aim for 1,300-1,500) | 10-16 | 100 |

YouTube treats only square or vertical uploads of 3:00 or less as Shorts, so a 16:9 video is a normal video at any
length: there is no need to pass 3:00. long-midroll exists for mid-roll ads, which YouTube allows only from 8:00:
never let it end under 8:00, so aim for at least 8:20 (the take can come out shorter than the estimate).

- Topic: it needs enough depth for its scenes: a chain of causes, a "what would happen if" with several stages, a
  history with a twist. Score ideas on depth (1-5) as well as on the four Short criteria; keep the highest total.
  long-midroll needs a topic with 8-12 real steps or questions; do not stretch a 3-minute idea to 8 minutes.
- Package: the thumbnail matters most here (long videos are found in search and suggestions, by their thumbnail).
  Section 1.2 and 1.3 in full.
- Structure: scenes of 20-40 s (long-horizontal) or 30-60 s (long-midroll). Scene 1 opens on the premise exactly
  like a Short (line 1 names what we see in frame 0, no greeting) and pays off the thumbnail within the first 30 s.
  Every scene ends with a small open question that the next scene answers ("so why doesn't that work?"). The main
  payoff still lands at the very end. long-midroll: every 3-4 scenes a small payoff (an answer, a reveal) so the
  middle never sags, and scene joins where an ad break would not cut a sentence or a joke (they become the ad break
  suggestions).
- Each scene is voiced as its own take, so every scene must make sense when read alone: no sentence may run across a
  scene boundary.
- Verify every fact, not just the central one: each claim in the script gets a line in sources.md with the link that
  supports it, cross-checked in a second source. More facts means more checking; cut a fact you cannot confirm.
- Same wording rules, the same banned phrases and the same audio tag rules as section 3 (about one tag every 2-3
  lines in each scene; audio_tags.py checks each scene).
- Output: packaging.md as in section 4; script.md with `Idea: <one sentence>`, then one `## Scene N - <name>`
  heading per scene (N = 1, 2, ...; the name in a few words) with its lines (one line per beat, no scene directions,
  no list markers; audio tags inline) and a `Words: N` line (tags not counted), and at the end
  `Total: N words, about M:SS` (words / 150 x 60 s, plus about half a second per vocalization or [pause]). The lines
  are said word for word and shown word for word as subtitles: write numbers and names the way they should read on
  screen ("1,500", "FDE"), and make sure each reads well spoken too. meta.json gets `format` (long-horizontal or
  long-midroll), `aspect: "16:9"`, `word_count`, `scenes: {count, names}` and `image_budget` (60 or 100).
  topics.json and register.py as in section 4.
- Check before you finish: the estimated length is inside the format's range (long-midroll: at least 8:20). A script
  outside the word range must be rewritten, not hoped for. Then
  `python .claude/skills/cutout-cartoon-shorts/scripts/voice_budget.py --slug <slug>`: a long-midroll voice takes
  8,000-10,000 ElevenLabs credits; exit code 3 means the plan cannot pay for it this month: stop and report.
