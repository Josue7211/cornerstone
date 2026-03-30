---
phase: 01-library-assignments-2-3-interest-web-submit
plan: "01"
subsystem: assignments
tags: [discussion-post, research-buckets, personal-details, democratization, local-ai]
dependency_graph:
  requires: []
  provides: [assignment-1-discussion-post, assignment-6-library-3-buckets]
  affects: [assignment-5-crafting-rqs, assignment-8-short-proposal]
tech_stack:
  added: []
  patterns: [APA 7th edition, markdown assignment format]
key_files:
  created: []
  modified:
    - assignment-1-discussion-post.md
    - assignment-6-library-3-buckets.md
decisions:
  - "Used conversational tone for discussion post — avoids stiff academic writing for intro college course audience"
  - "Named Tim Dettmers and Georgi Gerganov as Bucket 1 experts (specific, verifiable, central to local AI movement)"
  - "Reframed TPU paper note to connect specialized silicon to democratization angle rather than just raw performance"
  - "Discussion post 382 words including markdown headers — clean target range"
metrics:
  duration: 94s
  completed: "2026-03-30"
  tasks: 2
  files: 2
---

# Phase 01 Plan 01: Rewrite Discussion Post + Update Research Buckets Summary

**One-liner:** Rewrote fabricated discussion post intro with real personal details, and updated research buckets from GPU/chip-design framing to local AI affordability / democratization angle with named real experts.

---

## What Changed

### assignment-1-discussion-post.md

Complete rewrite. Previous draft was entirely fabricated — it mentioned *Interstellar*, *Mr. Robot*, UFC, Phasmophobia, RTX GPU specs, and homelab/Proxmox details that are either made up or too obscure for a community college intro class. Replaced with real personal details captured from the user:

- Real movies: Sound of Metal, Moonrise Kingdom, Blade Runner 2049, Surf's Up
- Real shows: Naruto, How I Met Your Mother, Better Call Saul
- Real music: Backseat Lovers, Alice in Chains, Mac Miller
- Real food: burgers, quesadillas, steak
- Real sports: Barcelona, Brazil, Spain (soccer)
- Real careers: computer engineering + personal trainer
- Physical object: his computer (authentic, minus the spec list)
- Free weekend: girlfriend or a project
- Historical place: 80s Miami
- Dinner guests: Mac Miller, Jensen Huang, Wes Anderson
- Research topic tied to local AI / democratization at the end

Word count: 382 (target was 200–400). Tone is casual but genuine, appropriate for FSW classmates and professor.

### assignment-6-library-3-buckets.md

Replaced old research buckets that used outdated framing:

**Old (removed):**
- Bucket 1: GPU Architecture Evolution (Graphics to AI)
- Bucket 2: Specialized AI Chip Design (TPUs, NPUs, Custom Silicon)
- Experts section listed generic categories, not individuals

**New:**
- Bucket 1: Local/On-Device AI and Affordability
- Bucket 2: GPU Evolution and the Path to Accessible AI Computing
- Experts: Tim Dettmers (bitsandbytes), Georgi Gerganov (llama.cpp), Jensen Huang, Kunle Olukotun (Stanford)
- Both APA citations retained (Jouppi 2017, Rathore 2024)
- Research notes reframed to connect sources to democratization angle

---

## Decisions Made

1. **Tone of discussion post:** Conversational without being sloppy. Aimed for the voice of someone who is genuinely interested in tech but not trying to show off specs to non-technical classmates. Removed all jargon and homelab references.

2. **Expert selection for Bucket 1:** Chose Dettmers (bitsandbytes quantization) and Gerganov (llama.cpp) because they are the most concrete examples of people who directly made AI accessible on consumer hardware. Both are findable, verifiable, and directly relevant to the democratization angle.

3. **TPU paper reframing:** The Jouppi paper is about data center TPUs, not consumer devices — but the research note now connects the dots: efficient silicon is the underlying principle that eventually flows down to consumer hardware. This makes it relevant to the new framing without misrepresenting the source.

---

## Content That May Need Human Review

- **Discussion post tone:** I wrote it in first person as Josue would speak. Read through once to make sure it sounds like you, not like a robot guessing how you talk.
- **"Marty Supreme" movie not included:** It was in the personal details list but omitted because it reads as an obscure reference that might confuse non-film-savvy classmates. If you want it in, add it alongside the others.
- **Dinner guest context:** Jensen Huang is briefly explained ("CEO behind NVIDIA and the GPU revolution") since classmates likely won't know him. Mac Miller and Wes Anderson are left without explanation — they're well-known enough.

---

## Deviations from Plan

None. Plan executed exactly as written.

---

## Known Stubs

None. Both files are complete and ready for Canvas submission.

---

## Self-Check: PASSED

- assignment-1-discussion-post.md — FOUND
- assignment-6-library-3-buckets.md — FOUND
- 01-01-SUMMARY.md — FOUND
- Commit fa1d1c9 (Task 1) — VERIFIED
- Commit aef8143 (Task 2) — VERIFIED
