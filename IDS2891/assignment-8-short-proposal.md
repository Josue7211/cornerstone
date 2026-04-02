# Finding Your Topic: Short Proposal
**Josue Aparcedo Gonzalez**
**IDS2891 Cornerstone — Spring 2026**

---

## Section A: Background Information and Research

The history of computing hardware reveals a fundamental architectural shift driven by the demands of artificial intelligence. For decades, central processing units served as the universal engine of computation, designed to execute diverse sequential tasks efficiently. However, the rise of machine learning — particularly deep learning — exposed a critical limitation: CPUs were architecturally ill-suited for the massively parallel matrix operations that neural networks require (Glassner, 2012). The breakthrough came not from AI researchers, but from the gaming industry. NVIDIA's graphics processing units, originally designed to render millions of pixels simultaneously for video games, possessed a parallel architecture that coincidentally aligned with the mathematical foundations of neural network training.

In 2007, NVIDIA released CUDA, a parallel computing platform that allowed developers to program GPUs for general-purpose tasks beyond graphics (CRV Science, 2024). This was the pivotal moment that unlocked GPUs for scientific computing and, eventually, AI. By 2012, when Alex Krizhevsky trained the AlexNet neural network on two NVIDIA GTX 580 GPUs and won the ImageNet competition by a decisive margin, the AI community recognized that GPU parallelism could fundamentally accelerate deep learning.

This realization triggered a hardware arms race. Google developed the Tensor Processing Unit, an application-specific integrated circuit engineered exclusively for neural network inference, reporting 15 to 30 times better performance per watt compared to contemporary CPUs and GPUs on machine learning benchmarks (Jouppi et al., 2017). Apple integrated its Neural Engine into consumer silicon, bringing on-device AI to iPhones and MacBooks. Intel, AMD, and startups across the semiconductor industry began developing neural processing units optimized for specific AI workloads (IBM, 2024). The global AI chip market is now projected to reach $40.79 billion in 2025 and $164 billion by 2029, reflecting a fundamental restructuring of how computing hardware is designed and deployed.

What makes this evolution particularly significant is its implications for the future. The shift from general-purpose processors to domain-specific accelerators represents a philosophical change in computing architecture — moving away from the "one chip does everything" paradigm toward specialized silicon designed for specific computational tasks (Data Center Knowledge, 2025). This raises important questions about cost, accessibility, and who gets to participate in the AI revolution.

## Section B: Reflection

My interest in AI hardware architecture comes directly from my experience building and working with computing hardware. I built my own desktop from scratch — selecting components, understanding how the CPU, GPU, memory, and storage interact as a system. Through that process, I developed an intuitive understanding of hardware tradeoffs: clock speed versus core count, thermal limits versus performance, general-purpose flexibility versus specialized efficiency. When I started following AI developments and realized that the same GPU I use for gaming is architecturally similar to the hardware training large language models in data centers, I knew I had found my research direction.

My coursework in computer science and mathematics has given me the foundation to understand the computational principles underlying this topic. Linear algebra, which felt abstract in a classroom, is literally what GPUs and TPUs compute — matrix multiplications, dot products, tensor operations. Physics courses helped me understand the electrical engineering constraints that drive chip design decisions. These connections between classroom concepts and real-world hardware design are exactly what I want to explore and communicate through this project.

This topic matters because artificial intelligence is rapidly becoming embedded in every aspect of daily life — from the recommendations on your phone to medical diagnostics to autonomous vehicles. Yet the vast majority of people, including many who work in technology, have little understanding of the hardware that makes AI possible. Understanding this hardware layer is critical for informed participation in conversations about AI's future — who controls the infrastructure, who can afford to train models, and what happens when the demand for AI compute outpaces the supply of specialized chips. My audience does not need to be engineers to benefit from understanding these dynamics. I want to make this topic accessible to anyone curious about why AI works the way it does.

## Section C: Research Question

My central research question is: *How has the GPU architecture evolved from a graphics rendering device to an AI accelerator, and what are the specific design features that facilitated this evolution?*

This question emerged through a deliberate narrowing process. I started with a broad interest in computer engineering, then focused on AI hardware specifically after recognizing that the hardware perspective is underrepresented in public discourse about AI. From there, I narrowed to GPU architecture evolution because it represents the most impactful and well-documented case of hardware repurposing in computing history — a chip designed for games becoming the engine of the AI revolution.

Supporting questions that define my scope include: What is the fundamental architectural difference between CPUs, GPUs, TPUs, and NPUs? And what does the emergence of specialized AI hardware mean for the future of computing and equitable access to artificial intelligence? I will analyze these questions through three modes: change over time (tracing GPU architecture from the GeForce 256 through CUDA to modern tensor-core designs), compare and contrast (examining the structural and functional differences between processor types), and cause and effect (investigating how specific AI workload demands drove the creation of specialized hardware). This multi-modal analytical approach allows me to construct a comprehensive narrative that is both historically grounded and forward-looking.

---

## References

CRV Science. (2024). Why Nvidia dominates AI: A history of CUDA and parallel computing. https://www.crvscience.com/post/why-nvidia-dominates-ai-a-history-of-cuda-and-parallel-computing

Data Center Knowledge. (2025). The hottest data center chip developments in 2025. https://www.datacenterknowledge.com/infrastructure/the-hottest-data-center-chip-developments-in-2025

Glassner, A. (2012). Graphics processing unit; GPU. In *3D A-to-Z: An encyclopedic dictionary*. McFarland & Company. https://search.credoreference.com/articles/Qm9va0FydGljbGU6MzAyMzkwNw==

IBM. (2024). NPU vs GPU: What's the difference? https://www.ibm.com/think/topics/npu-vs-gpu

Jouppi, N. P., et al. (2017). In-datacenter performance analysis of a tensor processing unit. *Proceedings of the 44th Annual International Symposium on Computer Architecture*, 1–12. https://doi.org/10.1145/3079856.3080246
