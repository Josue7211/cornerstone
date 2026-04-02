# Research Consultations — Project Check-in 2
**Josue Aparcedo Gonzalez**
**IDS2891 Cornerstone — Spring 2026**

---

## PROJECT TRACKER

**1. PROJECT TOPIC:**
The History of AI Hardware Architecture: GPU and Specialized Chip Development for Image Processing Up to AI Acceleration and What This Means for Computing Going Forward.

**2. INTENDED AUDIENCE:**
College students and young adults (18–30) who use AI-powered tools daily but have no understanding of the hardware enabling them. Secondary audience includes tech enthusiasts interested in the hardware side of AI. The presentation will make complex architecture concepts accessible through visual comparisons and real-world analogies.

**3. SOURCES FOR IN-DEPTH RESEARCH:**
- Jouppi, N. P., et al. (2017). In-datacenter performance analysis of a tensor processing unit. *ISCA '17*. https://doi.org/10.1145/3079856.3080246
- Rathore, A. (2024). How Nvidia built the ultimate AI engine. *Embedded.com*. https://www.embedded.com/how-nvidia-built-the-ultimate-ai-engine-a-look-at-gpu-core-architecture/
- IBM. (2024). NPU vs GPU: What's the difference? https://www.ibm.com/think/topics/npu-vs-gpu
- CRV Science. (2024). Why Nvidia dominates AI: A history of CUDA and parallel computing. https://www.crvscience.com/post/why-nvidia-dominates-ai-a-history-of-cuda-and-parallel-computing
- Sanmartín, D., & Prohaska, V. (2023). Exploring TPUs for AI applications. *arXiv:2309.08918*. https://arxiv.org/abs/2309.08918
- Bitdeer. (2024). NVIDIA GPU evolution and the road ahead. https://www.bitdeer.ai/en/blog/nvidia-gpu-evolution-and-the-road-ahead/
- Data Center Knowledge. (2025). The hottest data center chip developments in 2025. https://www.datacenterknowledge.com/infrastructure/the-hottest-data-center-chip-developments-in-2025

**4. RESEARCH QUESTION(S):**
1. How has the GPU architecture evolved from a graphics rendering device to an AI accelerator, and what are the specific design features that facilitated this evolution?
2. What is the fundamental architectural difference between CPUs, GPUs, TPUs, and NPUs, and how do these differences determine their suitability for AI workloads?
3. What does the emergence of specialized AI hardware mean for the future of computing, including cost, accessibility, and the democratization of AI?

**5. MODES OF ANALYSIS:**
- **Change over time:** GPU architecture timeline from GeForce 256 (1999) → CUDA introduction (2007) → AlexNet moment (2012) → Volta tensor cores (2017) → Hopper transformer engine (2022) → Blackwell (2024). Each generation introduced specific hardware features that deepened the GPU's role in AI.
- **Compare and contrast:** Side-by-side architectural comparison of how data flows through a CPU (sequential pipeline), GPU (SIMT parallel cores), TPU (systolic array matrix unit), and NPU (fixed-function neural network accelerator). Focus on core count, memory hierarchy, and instruction handling.
- **Cause and effect:** The exponential growth in AI model parameters (GPT-3: 175B, GPT-4: ~1.8T) created compute demands that general-purpose hardware could not meet, directly causing investment in specialized silicon.

**6. PROJECT TYPE:**
Interactive multimodal website with animated architecture schematics, timeline navigation, and side-by-side processor comparisons. Built using AI-assisted development to demonstrate the very capabilities being researched. Accompanied by a concise research paper synthesizing findings. This format was chosen because the audience is non-technical and responds better to visual, self-paced, interactive content than traditional essays or slideshows.
