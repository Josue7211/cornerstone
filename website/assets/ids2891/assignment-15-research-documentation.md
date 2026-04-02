# Research Documentation
**Josue Aparcedo Gonzalez**
**IDS2891 Cornerstone — Spring 2026**

---

## Scope

My research project investigates the history of AI hardware architecture — specifically, how the graphics processing unit evolved from a chip designed for rendering video game graphics into the engine powering modern artificial intelligence, and what that evolution means for who gets to participate in the AI revolution. The project is built around three research questions that emerged from narrowing a broad interest in computer engineering into a focused historical and comparative study:

1. How has GPU architecture evolved from a graphics rendering device to an AI accelerator, and what specific design features facilitated this evolution?
2. What is the fundamental architectural difference between general-purpose processors (CPUs) and AI-specialized hardware (GPUs, TPUs, NPUs)?
3. What does AI-specialized hardware mean for the future of computing and future access to AI?

The final deliverable is an interactive scroll-driven website built with GSAP and ScrollTrigger — a visual, animated experience that walks the audience through the hardware evolution narrative. This is not a PowerPoint or a written essay. The medium was a deliberate choice: hardware architecture is inherently spatial and visual, and static slides cannot communicate the way data flows through a systolic array or how tensor cores execute matrix operations in parallel. Building the website with AI tools running on the very hardware I am describing adds a genuine meta-narrative to the presentation. The research behind it grew far beyond typical course requirements — I eventually produced a 13,000-word paper with 35 sources because the technical, economic, ethical, and geopolitical threads I kept uncovering were interconnected and could not be treated in isolation (Glassner, 2012; Jouppi et al., 2017; Data Center Knowledge, 2025).

---

## Approach and Perspective

The critical lens guiding this research is the democratization of technology — specifically, examining who has access to AI hardware and how that access is shifting from centralized cloud infrastructure toward consumer devices. This lens is not abstract for me. I built my own desktop PC with an NVIDIA RTX 4070 Ti SUPER, and I run AI models locally through an open-source tool called Ollama. Three years ago, the AI models I run today existed only on corporate servers accessible through paid API subscriptions. Today, they run on hardware I own, with my data never leaving my machine. That lived experience informed the central thesis: the cloud-first era of AI is a transitional phase, not the endpoint of hardware evolution.

The research uses three modes of analysis that map directly onto the three research questions. The first is change over time — tracing NVIDIA GPU architecture across seven generations from Fermi (2010) through Blackwell (2024), identifying specific inflection points like the introduction of Tensor Cores in Volta (2017), which was the moment GPU architecture stopped being "gaming chips repurposed for AI" and became AI hardware that also does graphics (Rathore, 2024). The second mode is compare and contrast — examining the structural differences between CPUs, GPUs, TPUs, and NPUs, from the sequential few-core design of a CPU to the systolic array of Google's TPU, which eliminates the memory-access bottleneck that limits GPU performance on certain workloads (Jouppi et al., 2017). The third mode is cause and effect — tracing how the exponential growth of AI model complexity, from AlexNet's 60 million parameters in 2012 to GPT-4's estimated 1.8 trillion parameters in 2023, drove the semiconductor industry to invest billions in hardware that does fewer things but does them extraordinarily well.

IDS2891 provided the interdisciplinary framework that connected these technical findings to economics, ethics, social equity, and psychology. Without that framework, I would have written a technical paper about chips. With it, I recognized that AI hardware is a question of civic literacy — understanding who controls the silicon that runs the world's AI determines who controls the world's AI (CRV Science, 2024; IBM, 2024).

---

## Process and Plan

The research began, as required, in the FSW Libraries. Credo Reference provided the foundational definitions that established vocabulary and scope: Glassner's (2012) encyclopedia entry on GPUs gave a clear starting definition of parallel architecture, and Daintith and Wright's (2008) entry on parallel processing provided context for why that architecture matters computationally. Marcovitz (2018) situated the hardware story inside the broader fourth industrial revolution framing. These tertiary sources were not the heart of the research, but they were the necessary entry point — they told me what the established consensus was before I went looking for where the edges were.

The most important single source in the entire project is Jouppi et al.'s (2017) landmark paper describing Google's Tensor Processing Unit, which has been cited over 5,000 times in the academic literature. Reading it directly — not summaries of it — gave me the technical foundation for understanding why specialized AI chips exist and what "15 to 30 times better performance per watt" actually means at an architectural level. Sanmartín and Prohaska's (2023) arXiv survey expanded that into a broader analysis of TPU applications across AI workloads. These peer-reviewed sources became the spine of the technical argument.

What I did not expect was how far the scope would expand. I started with a purely technical question about how GPUs work. Within a few weeks of research, I had found myself writing about the psychology of cloud dependence, U.S.-China semiconductor export controls, the economic case for universal basic income as AI automation displaces labor, and a leaked Anthropic model so capable at finding software vulnerabilities that its announcement crashed cybersecurity stocks. These threads were not tangents — they were the same story told at different scales. The hardware determines who can run AI; who can run AI determines who has economic power; economic power determines geopolitics. I followed the thread wherever it led (Daintith & Wright, 2008; Sanmartín & Prohaska, 2023; Bitdeer, 2025).

The execution plan for the final project centers on the interactive website. It will present the hardware evolution narrative through animated architecture diagrams and scroll-driven transitions. The presentation covers the core arc from gaming GPUs to AI accelerators; the website provides the depth for viewers who want to go further. At least 5 of the research sources will be directly integrated into the final artifact as citations and visual data points.

---

## Context

The intended audience for this project is college students, computer engineering students, and tech-curious individuals who interact with AI every day but have little understanding of the hardware making it possible. The interactive website format was specifically chosen to lower the barrier — visual architecture diagrams communicate what pages of technical prose cannot, and an animated comparison of CPU versus GPU data flow is more immediately comprehensible to a non-engineer than any written description. The audience does not need to be technical to walk away with a genuine understanding of why NVIDIA controls roughly 86% of the AI GPU market, why Google built a completely different kind of chip, and what it means that their iPhone now contains a dedicated neural processing unit running AI locally without sending anything to a server.

This research sits at an intersection of several scholarly conversations. The core technical literature — Jouppi et al. (2017), Krizhevsky et al.'s (2012) AlexNet paper, and industry analysis from Data Center Knowledge (2025) — represents the hardware and AI systems research community. Alongside it is a policy and ethics conversation about AI concentration, democratization, and access: whether intelligence should be centralized in a few corporate data centers (Sam Altman's safety argument) or distributed onto consumer hardware (the open-source advocacy position). My research contributes to both conversations but speaks most directly to the second — using the technical history to argue that the hardware constraints that made centralization necessary are dissolving.

The general education connections in this project are not decorative. My mathematics background — particularly linear algebra — gave me the conceptual tools to understand what GPUs and TPUs actually compute: matrix multiplications, tensor operations, dot products. Understanding the chip means understanding the math. My computer science courses provided the programming context to appreciate why CUDA was revolutionary: it made GPU hardware accessible to software developers without forcing them to express every computation as a graphics problem. IDS2891 itself taught me to recognize economics (market concentration, the UBI argument), ethics (autonomous weapons, privacy), political science (export controls as geopolitical instruments), and psychology (the "delegation premium" — why people trust cloud AI even when local AI is faster and cheaper) as dimensions of the same research question, not separate topics. The most surprising finding in this entire project was that the biggest barriers to local AI adoption are not technical. They are psychological (Krizhevsky et al., 2012; Meta AI, 2024; UST, 2024).

---

## Bibliography

Bitdeer. (2025). NVIDIA GPU evolution and the road ahead. https://www.bitdeer.ai/en/blog/nvidia-gpu-evolution-and-the-road-ahead/

Built In. (2025). What is a neural processing unit (NPU)? https://builtin.com/articles/npu-neural-processing-unit

CRV Science. (2024). Why Nvidia dominates AI: A history of CUDA and parallel computing. https://www.crvscience.com/post/why-nvidia-dominates-ai-a-history-of-cuda-and-parallel-computing

Daintith, J., & Wright, E. (2008). Parallel processing. In *A dictionary of computing* (6th ed.). Oxford University Press. Credo Reference.

Data Center Knowledge. (2025). The hottest data center chip developments in 2025. https://www.datacenterknowledge.com/infrastructure/the-hottest-data-center-chip-developments-in-2025

Glassner, A. (2012). Graphics processing unit; GPU. In *3D A-to-Z: An encyclopedic dictionary*. McFarland & Company. Credo Reference.

IBM. (2024). NPU vs GPU: What's the difference? https://www.ibm.com/think/topics/npu-vs-gpu

Introl. (2025). Google TPU architecture: Complete guide to 7 generations. https://introl.com/blog/google-tpu-architecture-complete-guide-7-generations

Jouppi, N. P., Young, C., Patil, N., Patterson, D., Agrawal, G., Bajwa, R., Bates, S., Bhatia, S., Boden, N., Borber, A., Boyle, R., Cantin, P., Chao, C., Clark, C., Coriell, J., Daley, M., Dau, M., Dean, J., Gelb, B., … Yoon, D. H. (2017). In-datacenter performance analysis of a tensor processing unit. *Proceedings of the 44th Annual International Symposium on Computer Architecture*, 1–12. https://doi.org/10.1145/3079856.3080246

Krizhevsky, A., Sutskever, I., & Hinton, G. E. (2012). ImageNet classification with deep convolutional neural networks. *Advances in Neural Information Processing Systems*, *25*, 1097–1105.

Marcovitz, H. (2018). Artificial intelligence and machine learning. In *The fourth industrial revolution* (pp. 30–41). ReferencePoint Press. Credo Reference.

Meta AI. (2024). Introducing Llama 3.1: Our most capable models to date. https://ai.meta.com/blog/meta-llama-3-1/

Rathore, A. (2024). How Nvidia built the ultimate AI engine: A look at GPU core architecture. *Embedded.com*. https://www.embedded.com/how-nvidia-built-the-ultimate-ai-engine-a-look-at-gpu-core-architecture/

Sanmartín, D., & Prohaska, V. (2023). Exploring TPUs for AI applications. *arXiv preprint arXiv:2309.08918*. https://arxiv.org/abs/2309.08918

UST. (2024). AI chips power growth while transforming the semiconductor industry. https://www.ust.com/en/insights/ai-chips-driving-the-next-semiconductor-supercycle-strategic-analysis-and-industry-outlook
