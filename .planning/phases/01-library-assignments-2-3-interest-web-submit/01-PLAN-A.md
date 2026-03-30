---
phase: 01-library-assignments-2-3-interest-web-submit
plan: A
type: execute
wave: 1
depends_on: []
files_modified:
  - assignment-1-discussion-post.md
  - assignment-6-library-3-buckets.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "Discussion post uses only REAL personal details — no fabricated interests (no Interstellar, Mr. Robot, UFC, gaming references from old draft)"
    - "Discussion post covers: movies, shows, music, food, sports, career goals, physical object (computer), free weekend, historical place, dinner guests, values"
    - "Research buckets reflect the locked democratization/local AI angle — not the old GPU architecture / specialized chip framing"
    - "Assignment 6 names at least one specific expert by name, not just category"
  artifacts:
    - path: "assignment-1-discussion-post.md"
      provides: "Rewritten discussion post with real personal details"
      contains: "Josue Aparcedo Gonzalez"
    - path: "assignment-6-library-3-buckets.md"
      provides: "Updated research buckets aligned with locked subtopics"
      contains: "Local"
  key_links:
    - from: "assignment-6-library-3-buckets.md"
      to: "01-CONTEXT.md decisions"
      via: "subtopics must match the 5 locked topics"
      pattern: "Local.*AI|Token Optimization|AI Affordability"
---

<objective>
Rewrite the discussion post (Assignment #1) using real personal details and update the research buckets document (Assignment #6) to align with the locked subtopics.

Purpose: The discussion post draft contains entirely fabricated interests (Interstellar, Mr. Robot, UFC, homelab details not asked for). It needs a full rewrite that sounds authentic. The research buckets need to reflect the democratization angle — not the old "GPU Architecture / Specialized Chips" framing.

Output:
- assignment-1-discussion-post.md — completely rewritten, authentic voice, covers all prompts
- assignment-6-library-3-buckets.md — updated buckets, experts, sources aligned to locked scope
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-library-assignments-2-3-interest-web-submit/01-CONTEXT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite discussion post with real personal details</name>
  <files>assignment-1-discussion-post.md</files>

  <read_first>
    - /home/josue/Documents/homework/cornerstone/assignment-1-discussion-post.md (current draft to replace)
    - /home/josue/Documents/homework/cornerstone/.planning/phases/01-library-assignments-2-3-interest-web-submit/01-CONTEXT.md (real personal details are in the decisions section)
  </read_first>

  <action>
Completely rewrite assignment-1-discussion-post.md. The current draft is fabricated — it mentions Interstellar, Mr. Robot, UFC, and excessively technical homelab details. Replace it entirely using ONLY these real personal details (from CONTEXT.md decisions section):

REAL DETAILS TO USE:
- Movies: Sound of Metal, Moonrise Kingdom, Marty Supreme, Blade Runner 2049, Surf's Up
- Shows: Naruto, How I Met Your Mother, Better Call Saul
- Music: Rock, indie — Backseat Lovers, Alice in Chains. Favorite rapper: Mac Miller
- School subjects: Anything with tech
- Foods: Burgers, quesadillas, steak
- Sports: Barcelona, Brazil, Spain (soccer — mentions he doesn't watch much)
- Career goals: Computer engineering + personal trainer (both, not just hardware)
- Physical object that represents him: His computer — he works on all his projects on it
- Free weekend: Hang with his girlfriend or work on a project
- Historical time/place he'd visit: 80s Miami
- Dinner guests: Mac Miller, Jensen Huang, Wes Anderson
- Values: Hands-on learning, building things from the ground up

FORMAT REQUIREMENTS:
- Conversational tone — not stiff academic writing, not over-the-top technical
- Keep it natural and brief. Discussion posts in college intro classes should be 200-350 words
- Mention the research topic (AI Hardware Architecture) at the end, tied to the democratization angle
- DO NOT mention: Interstellar, Mr. Robot, UFC, gaming, Phasmophobia, RTX specs, homelab, Proxmox, CrowdSec, self-hosting, network security — these were fabricated or are too obscure
- DO NOT over-explain tech — the class is 99% non-technical
- Write in first person, casual but genuine voice
- Audience: FSW community college classmates and professor
  </action>

  <verify>
    <automated>grep -c "Sound of Metal\|Moonrise Kingdom\|Mac Miller\|Backseat Lovers\|Jensen Huang\|quesadilla\|80s Miami\|personal trainer" /home/josue/Documents/homework/cornerstone/assignment-1-discussion-post.md</automated>
  </verify>

  <acceptance_criteria>
    - File contains "Sound of Metal" or "Moonrise Kingdom" (real movies, not fabricated ones)
    - File contains "Mac Miller" (real music detail)
    - File contains "Jensen Huang" (dinner guest)
    - File contains "80s Miami" (historical place)
    - File does NOT contain "Interstellar" (old fabricated detail)
    - File does NOT contain "Mr. Robot" (old fabricated detail)
    - File does NOT contain "homelab" (too technical, not in source details)
    - Word count between 200-400 words (grep -c "" to count lines, or wc -w)
  </acceptance_criteria>

  <done>Discussion post replaced with authentic content using only the real personal details captured in CONTEXT.md. No fabricated interests remain. Natural, conversational tone appropriate for an intro college course discussion.</done>
</task>

<task type="auto">
  <name>Task 2: Update research buckets to match locked subtopics</name>
  <files>assignment-6-library-3-buckets.md</files>

  <read_first>
    - /home/josue/Documents/homework/cornerstone/assignment-6-library-3-buckets.md (current draft)
    - /home/josue/Documents/homework/cornerstone/.planning/phases/01-library-assignments-2-3-interest-web-submit/01-CONTEXT.md (locked subtopics in decisions section)
  </read_first>

  <action>
Rewrite assignment-6-library-3-buckets.md. The current draft uses outdated research buckets ("GPU Architecture Evolution" and "Specialized AI Chip Design") that no longer match the locked subtopics. The locked research focus is LOCAL AI + AFFORDABILITY (democratization angle).

LOCKED SUBTOPICS (from CONTEXT.md, per D decisions):
1. GPU Evolution (Graphics → AI)
2. Local/On-Device AI (running AI at home, consumer hardware)
3. Token Optimization (efficiency, running models on less hardware)
4. AI Affordability (how AI hardware is becoming more accessible)
5. Future of AI Computing (where hardware and AI are heading)
Research focus: Local AI + Affordability (democratization angle)

REWRITE INSTRUCTIONS:

**Step 1 — Research Buckets:**
- Bucket 1: Local/On-Device AI and Affordability — How AI hardware has become accessible enough for consumer devices and home use. Covers local inference, consumer GPU capabilities, open-source models, and the cost curve of AI hardware.
- Bucket 2: GPU Evolution and the Path to Accessible AI Computing — The technical evolution from graphics-only GPUs to AI accelerators, and how that progression connects to the future of AI being democratized through better hardware efficiency (token optimization, inference hardware).

**Step 2 — Experts:**
For each bucket, name SPECIFIC real experts (not just "NVIDIA engineers" — name the person):
- Bucket 1 (Local AI/Affordability): Tim Dettmers (quantization researcher, published "bitsandbytes" library enabling 4-bit model inference on consumer GPUs), Georgi Gerganov (creator of llama.cpp, enabling LLMs on consumer hardware)
- Bucket 2 (GPU Evolution): Jensen Huang (NVIDIA CEO and architect of the GPU-to-AI strategy), Kunle Olukotun (Stanford professor, pioneer in specialized ML hardware research)

**Step 3 — FSW Library Source:**
Keep the existing Jouppi et al. (2017) TPU paper BUT reframe the research note to tie it to democratization — the TPU paper demonstrates how specialized silicon is a key step toward making AI computation efficient enough to reach consumer devices.

Citation to keep:
Jouppi, N. P., Young, C., Patil, N., Patterson, D., Agrawal, G., Bajwa, R., Bates, S., Bhatia, S., Boden, N., Borber, A., Boyle, R., Cantin, P., Chao, C., Clark, C., Coriell, J., Daley, M., Dau, M., Dean, J., Gelb, B., … Yoon, D. H. (2017). In-datacenter performance analysis of a tensor processing unit. *Proceedings of the 44th Annual International Symposium on Computer Architecture*, 1–12. https://doi.org/10.1145/3079856.3080246

**Step 4 — Google Source:**
Keep the existing Rathore (2024) embedded.com article. It already covers GPU core architecture evolution which fits Bucket 2.

Citation to keep:
Rathore, A. (2024). How Nvidia built the ultimate AI engine: A look at GPU core architecture. *Embedded.com*. https://www.embedded.com/how-nvidia-built-the-ultimate-ai-engine-a-look-at-gpu-core-architecture/

Keep the same document structure (Steps 1–4 with headers). All written for a non-technical audience — no jargon without brief plain-English explanation.
  </action>

  <verify>
    <automated>grep -c "Local\|Affordab\|Dettmers\|llama\.cpp\|Gerganov\|democratiz" /home/josue/Documents/homework/cornerstone/assignment-6-library-3-buckets.md</automated>
  </verify>

  <acceptance_criteria>
    - File contains "Local" (Bucket 1 references local AI)
    - File contains "Affordab" (affordability is one of the locked subtopics)
    - File names at least one specific real expert by last name (e.g., "Dettmers" or "Gerganov" or "Olukotun")
    - File does NOT contain "Specialized AI Chip Design" as a bucket title (old framing)
    - File still has all 4 section headers (Step 1, Step 2, Step 3, Step 4)
    - APA citations for both sources remain present
    - File uses plain-English explanations, not unexplained jargon
  </acceptance_criteria>

  <done>Research buckets updated to reflect democratization/local AI angle. Specific real experts named. Both source citations retained with updated research notes connecting to the new framing.</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. grep "Sound of Metal\|Mac Miller\|Jensen Huang\|80s Miami" assignment-1-discussion-post.md — must return matches
2. grep "Interstellar\|Mr. Robot\|homelab" assignment-1-discussion-post.md — must return nothing
3. grep "Local\|Affordab" assignment-6-library-3-buckets.md — must return matches
4. grep "Specialized AI Chip Design" assignment-6-library-3-buckets.md — must return nothing (old bucket gone)
5. wc -w assignment-1-discussion-post.md — should be 200-500 words (markdown overhead included)
</verification>

<success_criteria>
- Discussion post sounds authentic and natural, using only real personal details from CONTEXT.md
- Research buckets align with the 5 locked subtopics and the democratization research angle
- Both files ready for Canvas submission (no placeholders, no fabricated content)
</success_criteria>

<output>
After completion, create .planning/phases/01-library-assignments-2-3-interest-web-submit/01-A-SUMMARY.md documenting:
- What changed in each file
- Key decisions made (tone choices, expert selection rationale)
- Any content that might need human review before submission
</output>
