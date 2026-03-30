# From Pixels to Intelligence: The Evolution of AI Hardware Architecture and the Democratization of Artificial Intelligence

**Josue Aparcedo Gonzalez**
**IDS2891 Cornerstone — Spring 2026**
**Florida SouthWestern State College**

---

## Abstract

The evolution of computing hardware from general-purpose processors to specialized artificial intelligence accelerators represents one of the most consequential architectural shifts in the history of computing. This paper traces the development of GPU architecture from its origins in graphics rendering through its pivotal transformation into the primary engine of modern AI, examines the emergence of purpose-built accelerators including Google's Tensor Processing Unit and neural processing units for on-device inference, and analyzes the implications of specialized hardware for the future accessibility and democratization of artificial intelligence. Drawing on peer-reviewed research, industry documentation, and market analysis, this paper argues that the architectural decisions embedded in silicon today will determine not only the capabilities of AI systems but also who has the power to build, deploy, and benefit from them.

---

## 1. Introduction

Every artificial intelligence tool in use today — from ChatGPT to image generators to voice assistants — runs on hardware that was originally designed for a completely different purpose: playing video games. This improbable origin story is central to understanding how artificial intelligence became the defining technology of the 2020s, because the hardware layer determines everything above it: what AI can do, how fast it runs, how much it costs, and ultimately, who gets access to it.

The central processing unit (CPU), the workhorse of general-purpose computing for decades, processes instructions sequentially through a small number of powerful cores optimized for complex logic and branching decisions (Glassner, 2012). This architecture excels at word processing, web browsing, and running operating systems, but it is fundamentally mismatched with the computational demands of artificial intelligence. Neural networks require millions of simple, identical mathematical operations — predominantly matrix multiplications — executed simultaneously (Jouppi et al., 2017). A CPU handling these operations is like a single brilliant chef trying to cook ten thousand identical dishes one at a time; the skill of the chef is not the bottleneck, the serial process is.

This mismatch between what AI needs and what CPUs provide set the stage for one of the most consequential accidental discoveries in technology: that graphics processing units, designed to render millions of pixels in parallel for video games, possessed an architecture coincidentally aligned with the mathematics of neural networks. Understanding this evolution — from gaming hardware to AI engine to a diversifying ecosystem of specialized chips — is essential for anyone seeking to comprehend the infrastructure that powers modern artificial intelligence.

This paper addresses three interconnected research questions: (1) How has the GPU architecture evolved from a graphics rendering device to an AI accelerator, and what specific design features facilitated this evolution? (2) What are the fundamental architectural differences between CPUs, GPUs, TPUs, and NPUs? (3) What does the emergence of specialized AI hardware mean for the future of computing and equitable access to artificial intelligence?

---

## 2. The GPU Revolution: From Graphics to General-Purpose Computing

### 2.1 Origins of the GPU

The graphics processing unit emerged in 1999 when NVIDIA released the GeForce 256, marketed as "the world's first GPU" (Bitdeer, 2025). Unlike CPUs, which featured a handful of powerful cores designed for sequential task execution, the GPU contained hundreds of smaller, simpler cores designed to perform the same operation on many data points simultaneously — a paradigm known as Single Instruction, Multiple Thread (SIMT) execution. This architecture was perfectly suited to graphics rendering, where each pixel on a screen requires an independent but identical calculation: given a 3D scene, compute the color of this specific pixel based on lighting, texture, and geometry.

Through the 2000s, GPU architectures grew increasingly powerful. NVIDIA's successive generations — from the GeForce 256 through the Fermi architecture (2010) — added more cores, more memory bandwidth, and more sophisticated processing pipelines. However, these chips remained locked inside a graphics-only paradigm. Programmers could not easily use GPU hardware for non-graphics computations, despite the raw parallel processing power sitting inside every gaming PC (CRV Science, 2024).

### 2.2 CUDA and the Programmability Breakthrough

The turning point came in 2007, when NVIDIA introduced CUDA (Compute Unified Device Architecture), a parallel computing platform that made GPU hardware programmable for general-purpose tasks. CUDA provided a C-like programming interface that allowed developers to write code targeting GPU cores directly, without needing to express their computations as graphics operations (CRV Science, 2024). This was a pivotal innovation — not because it changed the hardware, but because it unlocked the hardware's existing potential for an entirely new class of applications.

Ian Buck, the Stanford researcher who led CUDA's development before joining NVIDIA, recognized that GPUs possessed orders of magnitude more raw computational throughput than CPUs for parallel workloads. The challenge was making that throughput accessible to scientists, engineers, and — eventually — machine learning researchers. CUDA solved this accessibility problem, effectively converting every NVIDIA GPU into a programmable parallel processor.

### 2.3 AlexNet and the AI Watershed

The definitive proof that GPU computing could transform artificial intelligence came in 2012, when Alex Krizhevsky, Ilya Sutskever, and Geoffrey Hinton trained a deep convolutional neural network called AlexNet on two NVIDIA GTX 580 GPUs and achieved a dramatic victory in the ImageNet Large Scale Visual Recognition Challenge (Krizhevsky et al., 2012). AlexNet reduced the top-5 error rate to 15.3%, compared to 26.2% for the second-place entry — a gap so large it effectively ended the debate over whether deep learning could outperform hand-engineered computer vision features.

The significance of AlexNet extended far beyond image classification. It demonstrated that the combination of large datasets, deep neural network architectures, and GPU-accelerated parallel computing could achieve results that were simply impossible with CPU-only training. The AI research community pivoted almost overnight: GPU computing became the default infrastructure for machine learning research, and NVIDIA's gaming hardware became the foundation of a new industry.

### 2.4 The Architecture Evolution: Fermi Through Blackwell

Following the AlexNet moment, NVIDIA began deliberately optimizing GPU architectures for AI workloads alongside traditional graphics. The progression of major architectural generations tells the story of this dual-purpose evolution:

**Fermi (2010)** introduced true GPU computing capabilities with ECC memory support and improved double-precision floating-point performance, making GPUs viable for scientific computing beyond graphics (Bitdeer, 2025).

**Kepler (2012)** and **Maxwell (2014)** improved energy efficiency and introduced dynamic parallelism, allowing GPU programs to launch new GPU programs — a capability essential for recursive algorithms used in AI.

**Pascal (2016)** introduced NVLink for high-bandwidth GPU-to-GPU communication, enabling multi-GPU training of large neural networks.

**Volta (2017)** marked the most significant architectural shift for AI: the introduction of Tensor Cores, dedicated hardware units designed specifically for the mixed-precision matrix multiplication operations central to deep learning. Tensor Cores could perform matrix multiply-and-accumulate operations on 4×4 matrices in a single clock cycle, delivering dramatically higher throughput for AI workloads than general-purpose CUDA cores alone (Rathore, 2024).

**Ampere (2020)** expanded Tensor Core capabilities with support for sparsity-aware computation, effectively doubling throughput for neural networks that could be pruned.

**Hopper (2022)** added the Transformer Engine, hardware specifically optimized for the attention mechanisms used in large language models like GPT, with 900 GB/s NVLink bandwidth for multi-GPU communication.

**Blackwell (2024)** represents the current state of the art, with NVLink 5 providing 1.8 TB/s bandwidth — double that of Hopper — and second-generation Transformer Engines optimized for trillion-parameter models (Bitdeer, 2025). NVIDIA's roadmap extends through Vera Rubin (planned for 2026), which promises 8 exaflops of compute and 100 TB of memory capacity (Data Center Knowledge, 2025).

This progression from Fermi to Blackwell illustrates a fundamental shift: what began as a graphics chip with incidental parallel computing capabilities has become a purpose-built AI accelerator that also happens to render graphics.

---

## 3. Beyond the GPU: Purpose-Built AI Accelerators

### 3.1 Google's Tensor Processing Unit

While NVIDIA was adapting GPUs for AI, Google took a different approach entirely: building a chip from the ground up exclusively for neural network computation. The Tensor Processing Unit (TPU), first deployed internally in 2015 and described in a landmark 2017 paper, used a fundamentally different architecture called a systolic array (Jouppi et al., 2017).

In a systolic array, data flows through a grid of processing elements in a rhythmic, wave-like pattern — each element performs a multiply-and-accumulate operation and passes the result to its neighbor. This design eliminates the need to repeatedly read from and write to memory between operations, which is the primary bottleneck in traditional architectures. The original TPU achieved 15 to 30 times better performance per watt than contemporary CPUs and GPUs on neural network inference workloads, demonstrating that specialized silicon could dramatically outperform general-purpose hardware for specific tasks (Jouppi et al., 2017).

Google has since released seven generations of TPUs. The latest, Ironwood (TPU v7, 2025), delivers 4.6 petaflops of FP8 compute per chip and can be assembled into superpods of 9,216 chips producing 42.5 exaflops — enough to train the largest frontier AI models (Introl, 2025). The TPU architecture achieves 95% scaling efficiency at 32,768 chips, meaning near-linear performance gains as more chips are added. However, TPUs remain locked to Google's cloud platform, limiting their accessibility to organizations willing to commit to the Google Cloud ecosystem.

Recent cost analyses show TPUs achieving approximately 4x better performance-per-dollar than NVIDIA GPUs for inference workloads, with real-world case studies showing companies reducing inference costs by 65% after migrating from GPUs to TPUs (AI News Hub, 2025).

### 3.2 Neural Processing Units: AI on Your Device

Neural processing units (NPUs) represent a third architectural approach, optimized not for training massive models in data centers but for running AI inference efficiently on consumer devices — smartphones, laptops, and wearables. NPUs use architectures similar to TPU systolic arrays but at a much smaller scale, prioritized for energy efficiency rather than raw performance (IBM, 2024).

Apple's Neural Engine, integrated into every iPhone since the A11 Bionic chip (2017), can perform up to 15.8 trillion operations per second on the latest hardware, enabling features like Face ID, real-time photo processing, and on-device Siri processing without sending data to the cloud (Built In, 2025). Qualcomm's Snapdragon X2 mobile platform includes an NPU capable of 80 TOPS (trillion operations per second), and Google's collaboration with Qualcomm has demonstrated that large language models up to 3 billion parameters — including Meta's Llama 3 — can now run entirely on a smartphone NPU (Google Developers, 2024).

The emergence of NPUs is architecturally significant because it represents the migration of AI compute from centralized cloud data centers to the edge — the billions of personal devices already in people's pockets. This shift has profound implications for privacy, latency, and accessibility.

---

## 4. Architectural Comparison: CPU vs. GPU vs. TPU vs. NPU

Understanding the differences between these four processor types requires examining their fundamental design philosophies:

**CPUs** use a small number of powerful cores (typically 4–64) optimized for sequential execution of complex, varied instructions. Their large caches and branch prediction units excel at general-purpose tasks but create significant overhead for the simple, repetitive operations AI requires (Daintith & Wright, 2008).

**GPUs** use thousands of smaller cores (up to 18,000+ on current NVIDIA architectures) executing the same instruction across many data points simultaneously. This SIMT model maps naturally to matrix operations but wastes energy on general-purpose features unnecessary for pure AI computation. GPUs are the most versatile AI accelerator, capable of both training and inference across diverse model types.

**TPUs** use systolic arrays that eliminate the memory bottleneck by flowing data directly between processing elements. This fixed-function design achieves superior efficiency for matrix operations but cannot handle tasks outside its specialized scope. TPUs excel at large-scale training and inference within Google's ecosystem.

**NPUs** are miniaturized, energy-optimized versions of similar fixed-function designs, prioritizing performance-per-watt over raw throughput. They enable real-time AI inference on battery-powered devices, achieving 100x speedup over CPU and 10x over GPU for specific on-device workloads (Google Developers, 2024).

The key insight is that no single architecture is optimal for all AI workloads. The industry is moving toward heterogeneous computing, where different processor types handle different parts of the AI pipeline based on their architectural strengths (Sanmartín & Prohaska, 2023).

---

## 5. The Convergence: How Four Trends Are Making AI Run Anywhere

The story of AI democratization is not about any single breakthrough — it is about four interconnected trends that feed into each other, creating a compounding effect that is rapidly moving AI from exclusive data centers to everyday devices. Each trend enables the next: smaller silicon makes better chips, model compression makes models fit on those chips, token optimization makes them run efficiently, and together they power the local AI movement.

### 5.1 Silicon Shrinks: More Power in Less Space

The foundation of everything is semiconductor manufacturing. As transistor sizes have shrunk from 14nm to 7nm to 3nm, chip designers can pack more computational units into the same physical space while consuming less power. But the more consequential innovation is architectural: putting different types of processors on the same chip.

Apple's M-series processors, introduced in 2020, demonstrated this approach for consumer hardware. The M1 chip integrated a CPU, GPU, and Neural Engine (NPU) onto a single piece of silicon with unified memory — meaning all three processors share the same pool of RAM instead of copying data between separate memory spaces. This unified memory architecture eliminated one of the biggest bottlenecks in AI computation: the time spent moving data between the CPU's memory and the GPU's memory. An M1 MacBook Air with 16 GB of unified memory can run AI models that would choke on a traditional laptop where the GPU has only 4 GB of dedicated VRAM, because the model can use all 16 GB seamlessly.

This design philosophy has since spread across the industry. Qualcomm's Snapdragon X Elite integrates CPU, GPU, and a 45-TOPS NPU with shared memory for Windows laptops. Intel's Meteor Lake and Lunar Lake processors include dedicated NPU cores alongside traditional CPU and GPU blocks. The trend is clear: the future of computing hardware is heterogeneous chips where specialized AI accelerators are as standard as the CPU itself, not an expensive add-on but a default component of every new device (Built In, 2025).

### 5.2 Model Compression: Making Giants Fit in Your Pocket

Even with better silicon, a fundamental math problem remains: the most capable AI models contain hundreds of billions of parameters, and each parameter is a number that must be stored in memory and processed during inference. GPT-4's estimated 1.8 trillion parameters would require approximately 3.6 terabytes of memory at full precision — far beyond any consumer device.

Model compression techniques solve this by making models dramatically smaller without proportionally losing capability. The most impactful technique is **quantization** — reducing the precision of each parameter from 32-bit or 16-bit floating-point numbers down to 8-bit or even 4-bit integers. A 70-billion-parameter model stored at 16-bit precision requires approximately 140 GB of memory; the same model quantized to 4-bit precision requires roughly 35 GB — small enough to fit in the memory of a high-end consumer GPU like an NVIDIA RTX 4090 or across the unified memory of an Apple M-series laptop.

Other compression methods include **knowledge distillation**, where a large "teacher" model trains a smaller "student" model to replicate its behavior, and **pruning**, which removes the least important connections in a neural network. These techniques have progressed to the point where a well-compressed 7-billion-parameter model can match the quality of an uncompressed 13-billion-parameter model from just a year prior. The practical result is that models that previously demanded a server rack now run on a desktop PC or even a tablet.

### 5.3 Token Optimization: Doing More with Less

Compression addresses how much space a model takes up in memory. Token optimization addresses how efficiently the model runs once loaded — how much computation and memory each request actually consumes.

The key innovation is **KV-cache optimization.** When a language model generates text, it must remember all the previous tokens in the conversation. Naively, this "key-value cache" grows linearly with conversation length and can quickly exhaust available memory. Techniques like **PagedAttention**, developed by the vLLM project, manage this cache like an operating system manages virtual memory — allocating and deallocating memory pages dynamically, reducing memory waste by over 50% and increasing throughput by 2-4x on the same hardware (Glukhov, 2025).

**Speculative decoding** is another breakthrough: a small, fast "draft" model generates candidate tokens, and the larger model verifies them in parallel. Because verification is cheaper than generation, this can double generation speed without any loss in quality. **Flash Attention** algorithms restructure the attention computation to minimize memory reads and writes, achieving 2-4x speedup through better use of GPU memory hierarchy rather than more raw compute.

These optimizations compound with each other and with model compression. A quantized model running with PagedAttention on Flash Attention can deliver usable inference speeds on a $300 consumer GPU that would have required a $10,000 data center card two years ago.

### 5.4 Local AI: Running Intelligence at Home

The convergence of better silicon, compressed models, and optimized inference has produced something that seemed improbable just three years ago: fully functional AI systems running on consumer hardware, entirely offline, with no cloud dependency.

Tools like **Ollama** provide a one-command interface for downloading and running open-source large language models locally. A user with an NVIDIA RTX 4070 Ti SUPER — a $800 consumer graphics card — can run Meta's Llama 3 (8B parameters) at conversational speeds, or load a quantized 70B-parameter model for more capable but slower inference. Apple Silicon users can run these same models using the unified memory architecture, with an M2 MacBook handling 7B-parameter models comfortably.

The economics are striking. Enterprise API costs for cloud-hosted AI models can reach $47,000 per month for heavy usage; local deployment using open-source models on owned hardware can reduce this to $8,000 per month — an 83% cost reduction — while also eliminating concerns about data privacy, rate limits, and vendor lock-in (Glukhov, 2025). On mobile devices, Qualcomm's latest NPUs can run 3-billion-parameter language models at sub-5-millisecond latency, fast enough for real-time voice assistants that never send a word to the cloud (Google Developers, 2024).

The open-source model ecosystem has been the critical enabler. Meta's Llama series, Mistral's models, Alibaba's Qwen, and Google's Gemma provide high-quality foundation models that anyone can download, quantize, fine-tune, and deploy — no API key, no subscription, no permission required. When combined with efficient inference engines like vLLM, llama.cpp, and Apple's MLX framework, these models turn consumer hardware into personal AI infrastructure.

### 5.5 Cloud Access and Alternative Accelerators

For workloads that exceed consumer hardware — training new models, running multiple concurrent users, or deploying production services — cloud GPU access has become dramatically more affordable. The GPU-as-a-Service market grew from $4.31 billion in 2024 to $5.79 billion in 2025 and is projected to reach $49.84 billion by 2032 (VoltagePark, 2025). NVIDIA A100 GPUs rent for as little as $0.66 per hour, eliminating the need for tens of thousands of dollars in upfront hardware investment.

Meanwhile, alternative accelerators are breaking NVIDIA's 86% market dominance (Data Center Knowledge, 2025). Google's TPUs offer 4x better cost-per-inference than GPUs for many workloads, with real-world migrations showing 65% cost reductions (AI News Hub, 2025). Intel's Gaudi 3 and Amazon's Trainium 3 (built on 3nm) provide competitive alternatives at lower price points, and the growing competition is driving costs down across the entire ecosystem.

---

## 6. Where This Is Heading: AI Hardware in 2031

Projecting forward five years based on current trajectories, several developments appear likely — and their combined effect will be transformative.

### 6.1 Consumer Hardware Catches Up to Today's Data Centers

Following the historical pattern where each generation of consumer hardware matches the data center hardware of 3-5 years prior, a mid-range consumer GPU in 2031 will likely offer the performance of today's NVIDIA A100 — the current workhorse of AI data centers. Combined with continued advances in model compression (8-bit and 4-bit quantization are standard today; 2-bit and 1-bit methods are already being researched), this means models equivalent in capability to today's GPT-4 class systems could plausibly run on a $500 device. The question shifts from "can I afford to use AI?" to "which AI do I want running on my laptop?"

### 6.2 AI Without the Internet

On-device NPUs are already enabling basic AI features offline. By 2031, as NPU performance continues its rapid scaling and model compression advances further, fully capable AI assistants will operate entirely on-device — processing voice commands, writing text, analyzing images, and managing tasks without any internet connection. This has particular significance for the roughly 2.6 billion people worldwide who lack reliable internet access. When AI runs on local hardware, the only infrastructure required is the device itself and a power source. Edge AI is projected to grow at over 20% annually through 2030, with hybrid edge-cloud architectures delivering 75% energy savings compared to pure cloud processing (InfoWorld, 2025).

### 6.3 Personal AI That Stays Personal

The privacy implications of local AI are profound. Today, every interaction with cloud-hosted AI services — every question asked, every document analyzed, every image generated — is transmitted to and processed on corporate servers. Local AI eliminates this entirely. A personal AI assistant running on your own hardware can learn your preferences, access your files, and manage your schedule without any third party ever seeing your data. As regulatory frameworks like GDPR and CCPA push toward data minimization, and as consumers become more privacy-aware, the demand for AI that never phones home will grow. Hardware manufacturers are already responding: Microsoft's Copilot+ PC initiative requires dedicated NPUs specifically to enable on-device AI processing.

### 6.4 Every Application Becomes an AI Application

Perhaps the most transformative change is also the most subtle. When every device ships with dedicated AI hardware — as is already becoming standard in 2026 — application developers can assume AI capabilities are available, just as they currently assume internet connectivity or a touchscreen. This means AI features stop being a selling point and become infrastructure: spell-check that understands context, photo apps that automatically organize by content, development tools that catch bugs before compilation, and email that drafts responses matching your tone. The hardware layer disappears from the user's awareness entirely, which is the ultimate sign that a technology has matured.

### 6.5 The Open Question: Who Trains, Who Runs?

The democratization story has an important caveat. While *running* AI models is becoming accessible to anyone with consumer hardware, *training* frontier models remains concentrated among a handful of companies with billions of dollars in compute budgets. The gap between training costs and inference costs is growing, not shrinking. This creates a potential two-tier system: a small number of organizations create the foundational models, and everyone else runs compressed versions of them locally. Whether this represents genuine democratization or a new form of dependency — where local AI is only as good as what the model creators choose to release — is the central unresolved question in AI hardware's future.

---

## 7. Conclusion

The journey from NVIDIA's GeForce 256 to today's ecosystem of GPUs, TPUs, and NPUs tells a story of accidental discovery, deliberate optimization, and ongoing transformation. A chip designed to render video game pixels became the engine of an artificial intelligence revolution because its parallel architecture happened to align with the mathematical operations neural networks require. That accident has evolved into a diverse, competitive hardware landscape where specialized silicon is being designed not just for performance but for accessibility.

But the story does not end with the hardware itself. The real revolution is the convergence: smaller, more efficient silicon enables better chips; model compression makes AI models fit on those chips; token optimization makes them run fast; and open-source ecosystems make them available to anyone. Together, these four trends are moving artificial intelligence from exclusive data centers into cloud services available by the hour, into open-source tools running on consumer GPUs, into NPUs embedded in billions of smartphones, and — increasingly — into offline, private, personal AI that belongs entirely to the person using it.

Five years from now, the question will not be whether AI hardware is powerful enough. It will be whether the economic and policy structures surrounding it ensure that the power of AI is distributed as broadly as the hardware makes possible. The architectural choices being made in silicon today — what to optimize, what to open-source, what to keep proprietary — will determine the answer. Understanding this hardware layer is not just a technical exercise. It is essential for anyone who wants a voice in shaping the most consequential technology of our generation.

---

## References

AI News Hub. (2025). AI inference costs 2025: Why Google TPUs beat Nvidia GPUs by 4x. https://www.ainewshub.org/post/ai-inference-costs-tpu-vs-gpu-2025

Bitdeer. (2025). NVIDIA GPU evolution and the road ahead. https://www.bitdeer.ai/en/blog/nvidia-gpu-evolution-and-the-road-ahead/

Built In. (2025). What is a neural processing unit (NPU)? https://builtin.com/articles/npu-neural-processing-unit

CRV Science. (2024). Why Nvidia dominates AI: A history of CUDA and parallel computing. https://www.crvscience.com/post/why-nvidia-dominates-ai-a-history-of-cuda-and-parallel-computing

Daintith, J., & Wright, E. (2008). Parallel processing. In *A dictionary of computing* (6th ed.). Oxford University Press. Credo Reference.

Data Center Knowledge. (2025). The hottest data center chip developments in 2025. https://www.datacenterknowledge.com/infrastructure/the-hottest-data-center-chip-developments-in-2025

Glassner, A. (2012). Graphics processing unit; GPU. In *3D A-to-Z: An encyclopedic dictionary*. McFarland & Company. https://search.credoreference.com/articles/Qm9va0FydGljbGU6MzAyMzkwNw==

Glukhov, R. (2025). Local LLM hosting: Complete 2025 guide — Ollama, vLLM, LocalAI, Jan, LM Studio & more. *Medium*. https://medium.com/@rosgluk/local-llm-hosting-complete-2025-guide-ollama-vllm-localai-jan-lm-studio-more-f98136ce7e4a

Google Developers. (2024). Unlocking peak performance on Qualcomm NPU with LiteRT. *Google Developers Blog*. https://developers.googleblog.com/unlocking-peak-performance-on-qualcomm-npu-with-litert/

IBM. (2024). NPU vs GPU: What's the difference? https://www.ibm.com/think/topics/npu-vs-gpu

InfoWorld. (2025). Edge AI: The future of AI inference is smarter local compute. https://www.infoworld.com/article/4117620/edge-ai-the-future-of-ai-inference-is-smarter-local-compute.html

Introl. (2025). Google TPU architecture: Complete guide to 7 generations. https://introl.com/blog/google-tpu-architecture-complete-guide-7-generations

Jouppi, N. P., Young, C., Patil, N., Patterson, D., Agrawal, G., Bajwa, R., Bates, S., Bhatia, S., Boden, N., Borber, A., Boyle, R., Cantin, P., Chao, C., Clark, C., Coriell, J., Daley, M., Dau, M., Dean, J., Gelb, B., … Yoon, D. H. (2017). In-datacenter performance analysis of a tensor processing unit. *Proceedings of the 44th Annual International Symposium on Computer Architecture*, 1–12. https://doi.org/10.1145/3079856.3080246

Krizhevsky, A., Sutskever, I., & Hinton, G. E. (2012). ImageNet classification with deep convolutional neural networks. *Advances in Neural Information Processing Systems*, *25*, 1097–1105.

Rathore, A. (2024). How Nvidia built the ultimate AI engine: A look at GPU core architecture. *Embedded.com*. https://www.embedded.com/how-nvidia-built-the-ultimate-ai-engine-a-look-at-gpu-core-architecture/

Sanmartín, D., & Prohaska, V. (2023). Exploring TPUs for AI applications. *arXiv preprint arXiv:2309.08918*. https://arxiv.org/abs/2309.08918

UST. (2024). AI chips power growth while transforming the semiconductor industry. https://www.ust.com/en/insights/ai-chips-driving-the-next-semiconductor-supercycle-strategic-analysis-and-industry-outlook

VoltagePark. (2025). GPU as a service: Key benefits and providers in 2025. https://www.voltagepark.com/blog/gpu-as-a-service-key-benefits-and-providers-in-2025/
