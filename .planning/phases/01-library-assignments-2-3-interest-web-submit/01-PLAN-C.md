---
phase: 01-library-assignments-2-3-interest-web-submit
plan: C
type: execute
wave: 1
depends_on: []
files_modified:
  - assignment-3-library-2-credo-sources.md
autonomous: false
requirements: []

must_haves:
  truths:
    - "All 3 citations in assignment-3 are REAL sources verifiable on Credo Reference — not fabricated"
    - "The 1 already-verified source is retained exactly as-is"
    - "2 new sources are found by actually searching Credo Reference (not invented)"
    - "All citations are APA 7th edition format"
    - "Each source has a Credo Reference URL (search.credoreference.com)"
  artifacts:
    - path: "assignment-3-library-2-credo-sources.md"
      provides: "3 real APA citations from Credo Reference with research notes"
      contains: "search.credoreference.com"
  key_links:
    - from: "Credo Reference search"
      to: "assignment-3-library-2-credo-sources.md"
      via: "OpenAthens proxy login at FSW"
      pattern: "credoreference\\.com"
---

<objective>
Replace the 3 fabricated Credo Reference citations in assignment-3-library-2-credo-sources.md with 3 real sources — 1 already verified, 2 to find by searching Credo.

Purpose: The current draft has entirely fabricated citations with plausible-sounding but invented URLs. One real source is known. The other two must be found through actual Credo Reference searches. This assignment is worth 10 points and requires authentic academic sources.

Output:
- assignment-3-library-2-credo-sources.md — 3 real APA citations from Credo Reference with research notes
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/01-library-assignments-2-3-interest-web-submit/01-CONTEXT.md
</context>

<tasks>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 1: Search Credo Reference for 2 real sources</name>

  <what-built>
One verified Credo source is already known:
- "graphics processing unit; GPU" from *3D A-to-Z: An Encyclopedic Dictionary*, McFarland & Company, 2012
- URL: https://search.credoreference.com/articles/Qm9va0FydGljbGU6MzAyMzkwNw==

Two more real sources are needed. Automated search attempts via agent-browser will likely fail because the OpenClaw browser extension hijacks headless browsers on this machine (noted in STATE.md and CONTEXT.md).

**Executor: First attempt automated search:**
1. Try agent-browser to navigate to: https://go.openathens.net/redirector/fsw.edu?url=http://search.credoreference.com
2. Log in with FSW credentials (retrieve from Bitwarden "fsw.edu" entry — username: japarcedo)
3. Search for "parallel processing" — find a real encyclopedia/dictionary entry
4. Search for "artificial intelligence" — find a real encyclopedia/dictionary entry
5. Record the EXACT title, author(s), publication, year, and full Credo URL for each

If agent-browser fails due to OpenClaw hijack or login issues:
- Log the failure in AUTONOMOUS-LOG.md
- Proceed to this human checkpoint
  </what-built>

  <how-to-verify>
    The automated search likely failed because of the OpenClaw extension issue. Please search Credo Reference manually:

    1. Open your browser (with OpenClaw disabled if possible, or use a private window)
    2. Go to: https://go.openathens.net/redirector/fsw.edu?url=http://search.credoreference.com
    3. Log in with your FSW credentials (username: japarcedo, password from your authenticator)
    4. Search for "parallel processing" — find a dictionary/encyclopedia entry (not a book chapter or article)
    5. Open the entry and copy: title, author(s), publication name, year, and the full URL from your browser address bar
    6. Search for "artificial intelligence" (or "machine learning" if AI returns nothing useful) — find another dictionary/encyclopedia entry
    7. Open the entry and copy: title, author(s), publication name, year, and full URL

    Report back with this format:
    Source 2:
    - Title of entry:
    - Author(s) (if shown):
    - Publication name:
    - Year:
    - URL (copy from browser bar):

    Source 3:
    - Title of entry:
    - Author(s) (if shown):
    - Publication name:
    - Year:
    - URL (copy from browser bar):
  </how-to-verify>

  <resume-signal>Paste the two source records above (title, author, publication, year, URL for each). Claude will format the APA citations and write the research notes.</resume-signal>
</task>

<task type="auto">
  <name>Task 2: Write final citation document with all 3 real sources</name>
  <files>assignment-3-library-2-credo-sources.md</files>

  <read_first>
    - /home/josue/Documents/homework/cornerstone/assignment-3-library-2-credo-sources.md (current draft — structure to preserve, content to replace)
    - /home/josue/Documents/homework/cornerstone/.planning/phases/01-library-assignments-2-3-interest-web-submit/01-CONTEXT.md (verified source details in decisions section)
  </read_first>

  <action>
Rewrite assignment-3-library-2-credo-sources.md with 3 real sources.

SOURCE 1 (already verified — use exactly as specified in CONTEXT.md decisions):

Citation:
Glassner, A. (2012). Graphics processing unit; GPU. In *3D A-to-Z: An encyclopedic dictionary*. McFarland & Company. https://search.credoreference.com/articles/Qm9va0FydGljbGU6MzAyMzkwNw==

Research Notes:
This encyclopedia entry defines the graphics processing unit and traces its development from a dedicated graphics rendering chip into a general-purpose parallel processor. It explains the architectural characteristics — the large number of smaller, specialized processing cores — that distinguish GPUs from CPUs and enable the kind of massive parallelism required for AI workloads. This source establishes the foundational vocabulary for understanding why GPUs became the hardware backbone of modern AI, connecting the graphics origins to the current AI acceleration role.

SOURCES 2 AND 3: Use the real source data provided by the human in Task 1. Format as follows:

For each source:
1. Build the APA 7th edition citation:
   - If author shown: Author Last, First Initial. (Year). Entry title. In *Publication name* (edition if stated). Publisher. URL
   - If no author shown: Entry title. (Year). In *Publication name*. Publisher. URL
2. Write 3-5 sentence research notes:
   - Sentence 1: What the entry covers (plain-English summary)
   - Sentence 2-3: Specific concepts relevant to AI Hardware Architecture research
   - Sentence 4-5: Why this source is useful for the democratization/local AI angle

DOCUMENT FORMAT — keep the same structure as the current draft:
```
# IDS2891 Cornerstone - Assignment 3: Library Assignment #2 (Credo Reference Sources)
**Josue Aparcedo Gonzalez**
**Florida SouthWestern State College - Spring 2026**

---

## Source 1
**Citation (APA 7th Edition):**
[citation]

**Research Notes:**
[notes]

---

## Source 2
[same structure]

---

## Source 3
[same structure]
```

IMPORTANT: All 3 citations must include a URL containing "credoreference.com". Do not invent or modify URLs — use only what was provided or verified.
  </action>

  <verify>
    <automated>grep -c "credoreference\.com" /home/josue/Documents/homework/cornerstone/assignment-3-library-2-credo-sources.md</automated>
  </verify>

  <acceptance_criteria>
    - File contains exactly 3 Credo Reference URLs (grep "credoreference.com" returns 3 matches)
    - File contains "Source 1", "Source 2", "Source 3" section headers
    - File contains "APA" or the citation format headers
    - File contains "Research Notes" for each source
    - File does NOT contain the old fabricated Henderson (2009) citation (grep "Henderson" returns nothing)
    - File does NOT contain the old fabricated Daintith citation (grep "Daintith" returns nothing)
    - File does NOT contain the old fabricated Marcovitz citation (grep "Marcovitz" returns nothing)
    - File still has the FSW header (Josue Aparcedo Gonzalez, Florida SouthWestern State College)
  </acceptance_criteria>

  <done>All 3 citations are real Credo Reference sources with verified URLs. APA 7th edition formatting applied. Research notes written connecting each source to the AI Hardware Architecture research topic. Document ready for Canvas submission.</done>
</task>

</tasks>

<verification>
1. grep -c "credoreference.com" assignment-3-library-2-credo-sources.md — must return 3
2. grep "Henderson\|Daintith\|Marcovitz" assignment-3-library-2-credo-sources.md — must return nothing (fabricated sources gone)
3. grep "Qm9va0FydGljbGU6MzAyMzkwNw==" assignment-3-library-2-credo-sources.md — must match (verified source 1 URL retained)
4. grep "Source 1\|Source 2\|Source 3" assignment-3-library-2-credo-sources.md — must return 3 matches
</verification>

<success_criteria>
- All 3 sources are real Credo Reference entries that can be accessed at their URLs
- Source 1 verified URL (Qm9va0FydGljbGU6MzAyMzkwNw==) is present exactly as-is
- Sources 2 and 3 are from real searches performed by the human in Task 1
- APA 7th edition format applied to all 3
- Document ready for Canvas submission as Assignment #3
</success_criteria>

<output>
After completion, create .planning/phases/01-library-assignments-2-3-interest-web-submit/01-C-SUMMARY.md documenting:
- Whether automated Credo search succeeded or required manual human search
- The 3 sources used (titles only — no fabricated URLs needed in the summary)
- Any APA formatting decisions made
</output>
