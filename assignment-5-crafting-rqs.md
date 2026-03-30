# Finding Your Topic: Crafting a Research Question
**Josue Aparcedo Gonzalez**
**IDS2891 Cornerstone — Spring 2026**

---

## Background Research Synthesis (250 words)

The evolution of computing hardware from general-purpose processors to specialized AI accelerators represents one of the most significant architectural shifts in the history of computing. Early central processing units were designed to handle a wide range of sequential tasks, but they were fundamentally ill-equipped for the massively parallel computations that modern artificial intelligence demands (Henderson, 2009). The turning point came when researchers discovered that graphics processing units, originally engineered to render images for video games, possessed an architecture coincidentally aligned with the matrix multiplication operations central to neural network training. NVIDIA's introduction of CUDA in 2007 formalized this transition by making GPUs programmable for general-purpose computing, effectively opening the floodgates for GPU-accelerated machine learning (CRV Science, 2024). The 2012 ImageNet competition, where AlexNet was trained on two NVIDIA GPUs, demonstrated definitively that GPU parallelism could revolutionize deep learning performance.

This realization triggered a hardware arms race. Google developed its Tensor Processing Unit, an application-specific integrated circuit designed from the ground up for neural network inference, achieving 15 to 30 times better performance per watt than contemporary CPUs and GPUs on specific machine learning workloads (Jouppi et al., 2017). Apple integrated its Neural Engine into consumer devices, and companies across the industry began developing neural processing units optimized for on-device AI inference (IBM, 2024). Today, NVIDIA maintains approximately 86% market share in AI GPUs, but the landscape is diversifying rapidly as specialized architectures emerge for different segments of the AI pipeline (Data Center Knowledge, 2025). This shift from general to specialized computing architectures raises fundamental questions about the future accessibility and democratization of artificial intelligence.

---

## Research Questions

1. **How has the GPU architecture evolved from a graphics rendering device to an AI accelerator, and what are the specific design features that facilitated this evolution?**
   *Mode of analysis: Change over time*

2. **What is the difference between a general-purpose processor (CPU) and AI-specialized hardware (GPUs, TPUs, NPUs) at a fundamental architectural level?**
   *Mode of analysis: Compare and contrast*

3. **What does the development of AI-specialized hardware mean for the future of computing and equitable access to artificial intelligence?**
   *Mode of analysis: Cause and effect*

---

## References

CRV Science. (2024). Why Nvidia dominates AI: A history of CUDA and parallel computing. https://www.crvscience.com/post/why-nvidia-dominates-ai-a-history-of-cuda-and-parallel-computing

Data Center Knowledge. (2025). The hottest data center chip developments in 2025. https://www.datacenterknowledge.com/infrastructure/the-hottest-data-center-chip-developments-in-2025

Henderson, H. (2009). Graphics processing unit. In *Encyclopedia of computer science and technology* (Rev. ed.). Facts On File. Credo Reference.

IBM. (2024). NPU vs GPU: What's the difference? https://www.ibm.com/think/topics/npu-vs-gpu

Jouppi, N. P., Young, C., Patil, N., Patterson, D., Agrawal, G., Bajwa, R., Bates, S., Bhatia, S., Boden, N., Borber, A., Boyle, R., Cantin, P., Chao, C., Clark, C., Coriell, J., Daley, M., Dau, M., Dean, J., Gelb, B., … Yoon, D. H. (2017). In-datacenter performance analysis of a tensor processing unit. *Proceedings of the 44th Annual International Symposium on Computer Architecture*, 1–12. https://doi.org/10.1145/3079856.3080246

Rathore, A. (2024). How Nvidia built the ultimate AI engine: A look at GPU core architecture. *Embedded.com*. https://www.embedded.com/how-nvidia-built-the-ultimate-ai-engine-a-look-at-gpu-core-architecture/

Sanmartín, D., & Prohaska, V. (2023). Exploring TPUs for AI applications. *arXiv preprint arXiv:2309.08918*. https://arxiv.org/abs/2309.08918
