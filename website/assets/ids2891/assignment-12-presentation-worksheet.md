# Presentation Worksheet
**Josue Aparcedo Gonzalez**
**IDS2891 Cornerstone — Spring 2026**

---

## PART I: DESIGN & PREPARE

**Goal(s) (for presentation):**
Demonstrate how computing hardware evolved from general-purpose processors to specialized AI accelerators, make complex chip architecture concepts accessible to a non-technical audience, and advocate for why understanding AI hardware matters for everyone — not just engineers.

**Intended audience (for presentation):**
Classmates and professors — predominantly non-technical college students who use AI tools daily but have no understanding of the hardware underneath.

**Project Topic:**
The History of AI Hardware Architecture: GPU and Specialized Chip Development for Image Processing Up to AI Acceleration and What This Means for Computing Going Forward.

**Sub-topics/Buckets:**
1. GPU Architecture Evolution (graphics rendering → AI acceleration)
2. Specialized AI Chip Design (TPUs, NPUs, custom silicon)

**Basic Research Question(s):**
- How did GPUs go from gaming hardware to AI hardware?
- What's the difference between a CPU, GPU, TPU, and NPU?
- What does specialized AI hardware mean for the future?

**Complex Research Question(s):**
1. How has the GPU architecture evolved from a graphics rendering device to an AI accelerator, and what are the specific design features that facilitated this evolution?
2. What is the fundamental architectural difference between CPUs, GPUs, TPUs, and NPUs, and how do these differences determine their suitability for AI workloads?
3. What does the emergence of specialized AI hardware mean for the future of computing, including cost, accessibility, and the democratization of AI?

**Thesis Statement:**
The evolution of computing hardware from general-purpose CPUs to specialized AI accelerators — GPUs, TPUs, and NPUs — represents a fundamental architectural shift driven by the parallel processing demands of artificial intelligence, and understanding this hardware layer is essential for comprehending AI's capabilities, limitations, and future accessibility.

**Methods, Perspective, and Scope:**
Historical analysis combined with comparative technical evaluation. I trace the chronological development of each processor type while comparing their architectures at key inflection points. The scope covers hardware design only — not AI algorithms or software frameworks. Primary sources include Google's TPU paper (Jouppi et al., 2017), NVIDIA architectural documentation, and peer-reviewed computer architecture publications. The perspective emphasizes making expert-level hardware concepts accessible without sacrificing technical accuracy.

**Key Sources/Experts (outside library databases):**
- Norman Jouppi — principal architect of Google's TPU (ISCA 2017 paper)
- Jensen Huang — NVIDIA CEO, architect of the CUDA strategy that pivoted GPUs toward AI
- Jim Keller — legendary chip architect (AMD, Apple, Tesla, Intel)
- Ian Buck — creator of CUDA, Stanford PhD → NVIDIA VP of computing
- Industry analysts at Embedded.com, Data Center Knowledge, and semiconductor engineering journals

**Transdisciplinary Connections:**
- **Computer Science:** Programming models (CUDA), parallel computing paradigms
- **Electrical Engineering:** Transistor design, power consumption, thermal constraints
- **Mathematics:** Linear algebra (matrix multiplication is literally what GPUs/TPUs compute)
- **History of Technology:** How accidental alignment between gaming hardware and AI math created an industry
- **Economics:** Market concentration (NVIDIA's 86% AI GPU share), cost of AI infrastructure, accessibility implications

**Intended Audience (for project):**
Computer engineering students, tech enthusiasts, and anyone curious about how hardware enables modern AI. Accessible to non-technical audiences.

**Project Type (What & Why?):**
Interactive multimodal website with animated architecture schematics + concise research paper. Why: 99% of classmates are non-technical — an interactive visual experience is more effective than reading a paper. The website itself is built using AI tools, creating a meta-demonstration of AI's capabilities. Not an essay. Not PowerPoint.

---

## PART II: CREATE

### Structure

**Presentation Title:** *From Pixels to Intelligence: How Gaming GPUs Became the Engine of AI*

### Sections/Slides

**Section 1: Title & Introduction (0:00 – 1:30)**
Content: Project title, name, date, and a hook question
Visuals: Side-by-side image of a gaming GPU and an AI data center rack
Speaking Points:
- "How many of you have used ChatGPT, image generators, or voice assistants this week?"
- "Every one of those tools runs on hardware that was originally designed to play video games."
- Preview: We're going to trace how a gaming chip became the most important piece of technology in AI.

**Section 2: The Problem — Why CPUs Couldn't Do AI (1:30 – 3:00)**
Content: What CPUs do well (sequential tasks) vs. what AI needs (massive parallelism)
Visuals: Animated comparison — a CPU processing tasks one at a time vs. thousands of operations needed simultaneously
Speaking Points:
- CPUs are like one brilliant chef cooking dishes sequentially
- AI needs 10,000 simple calculations happening at the same time
- Show the website's CPU architecture diagram — few powerful cores, large caches, sequential pipeline

**Section 3: The Accidental Revolution — GPUs Enter AI (3:00 – 5:00)**
Content: GPU architecture, CUDA (2007), AlexNet moment (2012)
Visuals: GPU architecture diagram (thousands of small cores), timeline on website showing key milestones
Speaking Points:
- GPUs were designed to render millions of pixels simultaneously — each pixel is a simple math operation
- That parallel architecture accidentally aligned with the matrix math neural networks need
- CUDA made GPUs programmable for non-graphics tasks
- 2012: AlexNet trained on 2 NVIDIA GPUs wins ImageNet → the AI community realizes GPUs are the answer
- Walk through the website's GPU evolution timeline

**Section 4: Specialized Chips — TPUs and NPUs (5:00 – 7:00)**
Content: Google TPU systolic array, Apple Neural Engine, NPU comparison
Visuals: Website's side-by-side comparison showing data flow through GPU vs. TPU vs. NPU
Speaking Points:
- Google asked: "What if we built a chip *only* for neural networks?"
- TPU uses a systolic array — data flows through a grid of processors without needing to go back to memory
- 15–30x better performance per watt than CPUs/GPUs on inference workloads (Jouppi et al., 2017)
- Apple put a Neural Engine in your iPhone — AI runs on your device without sending data to the cloud
- Show animated data flow comparison on the website

**Section 5: Transdisciplinary Connections (7:00 – 8:00)**
Content: How math, physics, CS, economics, and history intersect in this topic
Visuals: Visual map on website showing discipline connections
Speaking Points:
- The math you learn in linear algebra IS what these chips compute
- Physics determines how small we can make transistors and how much heat they generate
- Economics: NVIDIA has 86% market share in AI chips — that concentration of power matters
- History: A fortunate coincidence between gaming hardware and AI math created a trillion-dollar industry

**Section 6: Implications & Future (8:00 – 9:30)**
Content: Market projections ($164B by 2029), accessibility concerns, what's next
Visuals: Statistics and future chip architectures on website
Speaking Points:
- The AI chip market is growing from $30B to $164B in 5 years
- Who controls the hardware controls who gets to build AI
- Emerging approaches: photonic computing, analog chips, 3D stacked architectures
- The shift from "one chip does everything" to "specialized silicon for specific tasks" is a fundamental change in how we think about computing

**Section 7: Advocacy — Why This Matters (9:30 – 10:30)**
Content: Why understanding AI hardware matters for everyone, not just engineers
Visuals: Closing section of website with call to action
Speaking Points:
- You don't need to be an engineer to understand what powers the tools you use every day
- Hardware decisions determine AI's cost, speed, and who has access
- The website I built for this project was itself created using AI — running on the very hardware I'm presenting about
- Understanding the infrastructure layer is the difference between being a passive consumer and an informed participant

**Section 8: Reflection & Q&A (10:30 – 12:00)**
Content: Key takeaways, what I learned, what I'd explore further
Visuals: Final website page with summary and source links
Speaking Points:
- Biggest takeaway: The most transformative technology of our generation runs on hardware designed for a completely different purpose
- What I'd explore further: How specialized AI chips might affect who can afford to train AI models — the democratization question
- What surprised me: How few people understand the hardware layer, even in tech
- Open for questions

### Estimated Time Breakdown
| Section | Duration |
|---------|----------|
| Title & Introduction | 1:30 |
| CPUs & The Problem | 1:30 |
| GPU Revolution & CUDA | 2:00 |
| TPUs & NPUs | 2:00 |
| Transdisciplinary Connections | 1:00 |
| Implications & Future | 1:30 |
| Advocacy | 1:00 |
| Reflection & Q&A | 1:30 |
| **Total** | **12:00** |
