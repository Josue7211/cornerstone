# Project Check-in 3
**Josue Aparcedo Gonzalez**
**IDS2891 Cornerstone — Spring 2026**

---

## Project Overview

### Research Question
How has the GPU architecture evolved from a graphics rendering device to an AI accelerator, and what are the specific design features that facilitated this evolution? Supporting questions examine the fundamental architectural differences between CPUs, GPUs, TPUs, and NPUs (Jouppi et al., 2017; IBM, 2024), and what the emergence of specialized AI hardware means for the future of computing and equitable access to artificial intelligence (Data Center Knowledge, 2025).

### Scope of the Research
This project traces AI hardware architecture from the introduction of the first GPU (NVIDIA GeForce 256, 1999) through the development of CUDA (2007), tensor cores (2017), and dedicated AI accelerators like Google's TPU and Apple's Neural Engine, concluding with an analysis of where specialized hardware is headed. The genre is a multimodal interactive website combining visual architecture schematics, animated data-flow comparisons, and a timeline-based narrative. A concise research paper accompanies the website to synthesize findings in written form. The research boundaries are defined by hardware architecture — I am not investigating AI algorithms, software frameworks, or specific AI applications, but rather the physical silicon and design choices that enable them.

### Background Research
Background research has been conducted using FSW library databases (Credo Reference, ACM Digital Library), Google Scholar, and industry sources. Key findings include: NVIDIA's CUDA platform was the pivotal technology that made GPUs programmable for general-purpose computing (CRV Science, 2024); Google's TPU uses a systolic array architecture fundamentally different from both CPUs and GPUs, achieving 15–30x better performance per watt on neural network inference (Jouppi et al., 2017); NPUs represent a third architectural category optimized for energy-efficient on-device AI inference (IBM, 2024); and the AI chip market is projected to reach $164 billion by 2029 (UST, 2024). Additional sources include NVIDIA technical blogs tracing GPU architecture from Fermi through Blackwell (Bitdeer, 2024) and academic surveys comparing TPU performance across AI workloads (Sanmartín & Prohaska, 2023).

---

## Approach/Perspective

### Critical Lens and Methods
My research approach combines historical analysis with comparative technical evaluation. I trace the chronological development of each hardware architecture while simultaneously comparing their structural designs at key inflection points. This dual lens — historical and comparative — allows me to identify not just *what* changed, but *why* specific design decisions were made in response to computational demands. The comparative method draws on published benchmarks and architectural specifications from primary sources (Jouppi et al., 2017; Rathore, 2024) rather than marketing claims, ensuring technical accuracy.

### Modes of Analysis

**Change over time:** I trace GPU architecture evolution through six major NVIDIA generations — from Fermi (2010), which introduced GPU computing capabilities, through Kepler (2012), Maxwell (2014), Pascal (2016), Volta (2017, which added tensor cores), Ampere (2020), Hopper (2022, which added transformer engines), to Blackwell (2024). Each generation introduced specific hardware features that deepened the GPU's role in AI acceleration (Bitdeer, 2024). This mode directly supports my primary research question about how and why GPU architecture evolved.

**Compare and contrast:** I examine the fundamental architectural differences between four processor types: CPUs (sequential execution, few powerful cores, large caches), GPUs (SIMT parallel execution, thousands of smaller cores, high memory bandwidth), TPUs (systolic array matrix units, deterministic execution, no caches), and NPUs (fixed-function neural network accelerators, optimized for power efficiency). This comparison reveals why no single architecture is optimal for all workloads (IBM, 2024).

**Cause and effect:** The exponential growth in AI model complexity — from AlexNet (60M parameters, 2012) to GPT-4 (estimated 1.8T parameters, 2023) — created computational demands that general-purpose hardware could not meet, directly causing the semiconductor industry to invest billions in specialized AI silicon (Data Center Knowledge, 2025). This mode addresses my third research question about future implications.

### Why This Topic
This topic matters to me because I built my own desktop PC and run a homelab infrastructure, which gave me hands-on understanding of how hardware components interact as a system. The GPU in my machine — an NVIDIA RTX 4070 Ti SUPER — is architecturally related to the data center GPUs training the AI models I use every day. That personal connection to hardware made me want to understand the deeper story: how did a chip designed for gaming become the engine of the AI revolution? My coursework in computer science, mathematics (particularly linear algebra — the math GPUs actually compute), and physics (understanding electrical constraints on chip design) directly informs my ability to analyze and communicate these architectural concepts.

### Relevance to Potential Audience
My audience — college students and tech-curious individuals — interacts with AI constantly through tools like ChatGPT, image generators, and voice assistants, but almost none of them understand the hardware making it possible. This matters because hardware determines what AI can do, how much it costs, and who has access to it. As the AI chip market grows from $29.65 billion in 2024 to a projected $164 billion by 2029 (UST, 2024), understanding the hardware layer becomes essential for informed participation in conversations about AI's role in society. NVIDIA currently holds approximately 86% of the AI GPU market (Data Center Knowledge, 2025), raising questions about concentration of computational power that my audience should be aware of.

---

## Research Process and Plan

### Initial Research Steps
1. Search FSW library databases (ACM Digital Library, IEEE Xplore) for peer-reviewed papers on GPU architecture evolution and AI accelerator design
2. Access NVIDIA technical blogs and whitepapers for primary-source architectural documentation
3. Use Google Scholar to find survey papers comparing CPU, GPU, TPU, and NPU architectures
4. Review industry analyst reports on AI chip market trends and projections
5. Identify expert interviews and conference talks from chip architects (ISCA, Hot Chips conferences)

### Plan of Execution
- **Weeks 1–2:** Complete background research, finalize source collection (10+ sources), refine research questions
- **Weeks 3–4:** Draft research paper sections (introduction, background, comparative analysis, future implications)
- **Weeks 5–6:** Design and build interactive website with architecture schematics and timeline
- **Week 7:** Integrate research paper content into website narrative, create animated comparisons
- **Week 8:** Rehearse presentation, refine website interactivity, finalize all deliverables

---

## Context and Audience

### Audience Definition
Primary: College students aged 18–25 who use AI-powered tools daily but have no background in hardware engineering. They consume information through websites, videos, and social media rather than academic papers. They respond to visual content, interactive elements, and real-world analogies rather than technical jargon.

Secondary: Tech enthusiasts and early-career professionals who understand software but want to learn the hardware perspective. This group appreciates more technical depth while still benefiting from visual explanations.

### Scholarly Conversation
This research sits at the intersection of computer architecture, AI/ML systems, and the history of technology. The scholarly conversation includes Jouppi et al.'s foundational TPU paper (2017), which established benchmarks for comparing general-purpose and specialized AI hardware; ongoing debates in IEEE and ACM conferences about the tradeoffs between flexibility (GPUs) and efficiency (ASICs/TPUs); and industry analysis of how hardware constraints shape AI capability and accessibility. My contribution is synthesizing this technical conversation into an accessible, visually-driven format for a non-specialist audience.

### Relevance to General Education Courses
My mathematics courses (particularly linear algebra and calculus) provided the foundation for understanding what GPUs and TPUs actually compute — matrix multiplications, tensor operations, gradient calculations. Physics courses informed my understanding of the electrical engineering constraints that drive chip design decisions (power consumption, heat dissipation, transistor scaling). Computer science courses gave me the programming context to understand why CUDA was revolutionary — it allowed software developers to harness parallel hardware without writing low-level graphics code. These interdisciplinary connections demonstrate how general education coursework directly informs specialized research.

---

## Reflection and Strategy

### How will you ensure the relevance of your sources?
I prioritize primary sources (published research papers, official technical documentation) over secondary summaries. I cross-reference claims across multiple sources — for example, TPU performance claims from Google's paper are validated against independent benchmarks. I use the CRAAP test (Currency, Relevance, Authority, Accuracy, Purpose) to evaluate each source, with particular attention to authority (is the author a chip architect, researcher, or journalist?) and currency (hardware changes rapidly, so sources older than 5 years require verification against current data).

### What challenges might you face during the research process?
The primary challenge is technical complexity — translating hardware architecture concepts into language and visuals that a non-technical audience can understand without oversimplifying to the point of inaccuracy. A secondary challenge is the pace of change in this field — new chip architectures are announced regularly, requiring me to distinguish between established facts and emerging developments. Finally, building the interactive website requires balancing visual polish with research depth within the project timeline.

### What strategies will you use to stay organized throughout the research process?
I use NoodleTools for citation management and source organization. Research notes are organized by research bucket (GPU evolution vs. specialized chips). I maintain a project timeline with weekly milestones and track progress against deliverables. Source materials are saved locally with annotations for quick reference during writing.

---

## Project Modality

**Interactive multimodal website** with animated architecture schematics, a timeline-based narrative, and side-by-side processor comparisons. The website will be built using AI-assisted development tools, which adds a compelling meta-layer: the project about AI hardware was created *by* AI, running on the very hardware being discussed. This format was chosen because: (1) 99% of my class is non-technical, so an interactive visual experience is more effective than a paper or slideshow; (2) it allows self-paced exploration, letting each viewer go as deep as they want; (3) it demonstrates the capabilities of AI as a creative and engineering tool; and (4) it's a permanent, shareable artifact rather than a one-time presentation.

A concise research paper will accompany the website to satisfy the academic synthesis requirement.

This is explicitly **not** an essay or PowerPoint presentation.

---

## Next Steps

1. Finalize all 12+ sources and complete APA bibliography
2. Draft the research paper (introduction, comparative analysis, future implications)
3. Design the website structure (sections, timeline flow, visual schematics)
4. Build the interactive website with animated chip architecture comparisons
5. Integrate research content into website narrative
6. Rehearse 10–12 minute oral presentation walkthrough of the website
7. Submit all deliverables

---

## Bibliography / Reference List of Potential Sources

1. Bitdeer. (2024). NVIDIA GPU evolution and the road ahead. https://www.bitdeer.ai/en/blog/nvidia-gpu-evolution-and-the-road-ahead/

2. Built In. (2024). What is a neural processing unit (NPU)? https://builtin.com/articles/npu-neural-processing-unit

3. CRV Science. (2024). Why Nvidia dominates AI: A history of CUDA and parallel computing. https://www.crvscience.com/post/why-nvidia-dominates-ai-a-history-of-cuda-and-parallel-computing

4. Daintith, J., & Wright, E. (2008). Parallel processing. In *A dictionary of computing* (6th ed.). Oxford University Press. Credo Reference.

5. Data Center Knowledge. (2025). The hottest data center chip developments in 2025. https://www.datacenterknowledge.com/infrastructure/the-hottest-data-center-chip-developments-in-2025

6. Henderson, H. (2009). Graphics processing unit. In *Encyclopedia of computer science and technology* (Rev. ed.). Facts On File. Credo Reference.

7. IBM. (2024). NPU vs GPU: What's the difference? https://www.ibm.com/think/topics/npu-vs-gpu

8. Introl. (2024). Google TPU architecture: 7 generations explained. https://introl.com/blog/google-tpu-architecture-complete-guide-7-generations

9. Jouppi, N. P., Young, C., Patil, N., Patterson, D., Agrawal, G., Bajwa, R., ... & Yoon, D. H. (2017). In-datacenter performance analysis of a tensor processing unit. *Proceedings of the 44th Annual International Symposium on Computer Architecture*, 1–12. https://doi.org/10.1145/3079856.3080246

10. Marcovitz, H. (2018). Artificial intelligence and machine learning. In *The fourth industrial revolution* (pp. 30–41). ReferencePoint Press. Credo Reference.

11. Rathore, A. (2024). How Nvidia built the ultimate AI engine: A look at GPU core architecture. *Embedded.com*. https://www.embedded.com/how-nvidia-built-the-ultimate-ai-engine-a-look-at-gpu-core-architecture/

12. Sanmartín, D., & Prohaska, V. (2023). Exploring TPUs for AI applications. *arXiv preprint arXiv:2309.08918*. https://arxiv.org/abs/2309.08918

13. UST. (2024). AI chips power growth while transforming the semiconductor industry. https://www.ust.com/en/insights/ai-chips-driving-the-next-semiconductor-supercycle-strategic-analysis-and-industry-outlook
