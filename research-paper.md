From Pixels to Intelligence: How Open-Source AI and Consumer Hardware Are Making Cloud Computing Obsolete

Josue Aparcedo Gonzalez

Department of Interdisciplinary Studies, Florida SouthWestern State College

IDS2891: Cornerstone

Spring 2026

---

## Abstract

This paper argues that the cloud-first era of artificial intelligence is ending. Through an analysis of GPU architecture evolution, the emergence of specialized AI accelerators, and the rapid advancement of software optimization techniques, this paper demonstrates that centralized AI infrastructure is becoming obsolete for most use cases — and that the companies building that infrastructure are accelerating their own disruption. The convergence of four trends — silicon miniaturization, model compression, token optimization, and open-source model ecosystems — has made it possible for individuals to run AI systems on consumer hardware that rival cloud-hosted services costing thousands of dollars per month. Drawing on peer-reviewed research, industry data, and firsthand experience running local AI on consumer hardware, this paper contends that the most consequential development in AI is not bigger models or faster chips, but the software optimizations and open-source movements that are making existing hardware orders of magnitude more capable. NVIDIA's recent pivot toward open-source AI tools — including its Nemotron open-weight models — suggests that even the dominant hardware manufacturer recognizes this shift. The paper concludes with a prediction: by 2031, the default way most people interact with AI will be through models running locally on their own devices, and the current cloud-dominated landscape will be remembered as a transitional phase — not a destination.

*Keywords:* GPU, open-source AI, local inference, CUDA, model compression, democratization, Moore's Law, NPU

---

## Introduction

In 2012, training a neural network to recognize images required two NVIDIA gaming GPUs and a research lab at the University of Toronto (Krizhevsky et al., 2012). By 2023, training a frontier AI model like GPT-4 required an estimated $100 million in cloud computing infrastructure and thousands of specialized chips that no individual could afford (Data Center Knowledge, 2025). The trajectory seemed clear: AI was becoming a technology that only the wealthiest companies could build and deploy, accessible to everyone else only through cloud subscriptions and API calls.

This paper argues that trajectory is reversing. The cloud-first era of AI — where intelligence lives on corporate servers and users rent access — is not the endgame of AI hardware evolution. It is a temporary phase, an artifact of a brief historical moment when consumer hardware could not keep up with model complexity. That moment is ending. The convergence of better silicon, radical software optimization, and an explosion of open-source AI models has made it possible for a college student with an $800 graphics card to run AI systems locally that would have required data center access three years ago. I know this because I am that student — I run quantized language models on my NVIDIA RTX 4070 Ti SUPER through Ollama on a homelab I built myself, and the experience rivals cloud-hosted alternatives at a fraction of the cost.

The implications extend far beyond personal convenience. If AI can run locally on consumer hardware, the entire economic model of cloud AI — pay-per-query pricing, mandatory data transmission to corporate servers, vendor lock-in — faces disruption from below. Microsoft, Apple, and Qualcomm are already embedding dedicated AI accelerators directly into consumer PCs and smartphones, betting that the future of AI is on-device rather than in the cloud (Built In, 2025). NVIDIA itself has begun releasing open-weight AI models like Nemotron, hedging against a future where its consumer GPUs matter more than its data center contracts. Even the geopolitical landscape reinforces this shift: U.S. chip export bans on China have made nations acutely aware that dependence on centralized AI infrastructure controlled by foreign companies is a strategic vulnerability (U.S. Congressional Research Service, 2024).

This paper traces how we got here — from the accidental discovery that gaming GPUs could accelerate neural networks, through the deliberate development of specialized AI chips, to the software revolution that is now making those chips dramatically more efficient. It then examines the geopolitical and ethical dimensions of this shift. It concludes with a prediction: the cloud-dominated AI landscape of 2025 will look, in retrospect, like the mainframe era of computing — a centralized phase that gave way to personal computing once the hardware and software caught up.

## The Accidental Revolution: How Gaming Hardware Became the Engine of AI

### From Pixels to Parallel Processing

The graphics processing unit emerged in 1999 when NVIDIA released the GeForce 256, marketed as "the world's first GPU" (Bitdeer, 2025). Its purpose was straightforward: render 3D graphics for video games by performing the same mathematical operation on millions of pixels simultaneously. Each pixel calculation is simple and independent — compute a color based on lighting, texture, and geometry — but there are millions of them per frame. This demanded an architecture fundamentally different from the CPU: instead of a few powerful cores handling complex sequential tasks, the GPU used hundreds of smaller, simpler cores executing the same instruction across many data points simultaneously, a paradigm called Single Instruction, Multiple Thread (SIMT) execution.

For a decade, this architecture served gaming exclusively. Programmers could not easily use GPU cores for non-graphics computations, despite the raw parallel processing power sitting inside every gaming PC (CRV Science, 2024). The hardware was capable; the software was locked.

This progression was powered by Moore's Law — Intel co-founder Gordon Moore's 1965 observation that the number of transistors on an integrated circuit doubles approximately every two years (Computer History Museum, 1965). For decades, Moore's Law made both CPUs and GPUs faster through sheer transistor density. But by the mid-2010s, this trajectory began to slow. As transistors approached atomic scales — current leading-edge processes manufacture features at 3 nanometers, roughly 15 atoms wide — the physics of further miniaturization imposed hard limits on performance gains through shrinking alone (MIT CSAIL, 2023). This slowdown is precisely why specialized AI chips emerged: when you can no longer make general-purpose processors dramatically faster, the path forward is designing silicon that does fewer things but does them extraordinarily well.

### Jensen Huang's Bet: CUDA and the Platform Play

The turning point came in 2007, when NVIDIA introduced CUDA (Compute Unified Device Architecture), a parallel computing platform that unlocked GPU hardware for general-purpose tasks (CRV Science, 2024). NVIDIA CEO Jensen Huang made what seemed like a financially questionable decision: investing heavily in a software platform that added development cost to gaming hardware with no immediate revenue payoff. The bet was that if GPUs became programmable for scientific computing, NVIDIA would own the platform layer — and every researcher, scientist, and eventually AI developer would be locked into NVIDIA's ecosystem.

It worked. CUDA converted every NVIDIA GPU into a programmable parallel processor, and the bet paid off spectacularly when AI researchers discovered that the matrix multiplications central to neural network training mapped perfectly onto GPU parallel architectures.

### The AlexNet Moment

The definitive proof came in 2012. Alex Krizhevsky, Ilya Sutskever, and Geoffrey Hinton — a pioneer of neural network research who would later win the Nobel Prize in Physics for his foundational work on machine learning — trained a deep convolutional neural network called AlexNet on two NVIDIA GTX 580 gaming GPUs (Krizhevsky et al., 2012). AlexNet won the ImageNet competition by a margin so large it effectively ended the debate over whether deep learning could outperform traditional computer vision. ImageNet itself was built by Fei-Fei Li, a Stanford computer scientist who spent years assembling the massive labeled dataset that made this benchmark possible.

The significance was not just academic. AlexNet proved that the combination of large datasets, deep architectures, and GPU-accelerated parallel computing could achieve results impossible with CPU-only training. The AI research community pivoted almost overnight. GPU computing became the default infrastructure for machine learning, and NVIDIA's gaming hardware became the foundation of a new industry.

### The Architecture Arms Race

Following AlexNet, NVIDIA deliberately optimized each GPU generation for AI alongside traditional graphics. Table 1 summarizes this evolution.

### Table 1

*NVIDIA GPU Architecture Evolution for AI*

| Generation | Year | Key AI Innovation | Significance |
|---|---|---|---|
| Fermi | 2010 | ECC memory, double-precision | Made GPUs viable for scientific computing |
| Kepler | 2012 | Dynamic parallelism | GPU programs could launch GPU programs |
| Pascal | 2016 | NVLink interconnect | Enabled multi-GPU training |
| Volta | 2017 | Tensor Cores | Dedicated matrix multiplication hardware |
| Ampere | 2020 | Sparsity-aware Tensor Cores | Doubled throughput for pruned networks |
| Hopper | 2022 | Transformer Engine | Optimized for large language models |
| Blackwell | 2024 | NVLink 5 (1.8 TB/s) | Trillion-parameter model support |

*Note.* Compiled from Bitdeer (2025), Rathore (2024), and Data Center Knowledge (2025).

The most significant architectural shift came with Volta's Tensor Cores in 2017 — dedicated hardware units designed specifically for the mixed-precision matrix multiplication at the heart of deep learning (Rathore, 2024). This was the moment GPU architecture stopped being "graphics chips repurposed for AI" and became "AI chips that also do graphics." Each subsequent generation deepened this transformation, culminating in Blackwell's second-generation Transformer Engines optimized specifically for the attention mechanisms used in large language models.

## The Challengers: Purpose-Built AI Silicon

### Google's TPU: The Anti-GPU

While NVIDIA adapted gaming hardware for AI, Google asked a different question: what if we built a chip exclusively for neural networks? The result was the Tensor Processing Unit (TPU), first deployed in 2015, which used a fundamentally different architecture called a systolic array (Jouppi et al., 2017).

In a systolic array, data flows through a grid of processing elements in a rhythmic, wave-like pattern — each element performs a multiply-and-accumulate operation and passes the result to its neighbor, eliminating the need to repeatedly read from and write to memory between operations. This design achieved 15 to 30 times better performance per watt than contemporary CPUs and GPUs on inference workloads (Jouppi et al., 2017). Google's latest TPU, Ironwood (v7, 2025), delivers 4.6 petaflops per chip with 95% scaling efficiency at 32,768 chips (Introl, 2025), and recent analyses show TPUs achieving 4x better cost-per-inference than NVIDIA GPUs (AI News Hub, 2025).

But TPUs have a critical limitation that strengthens the thesis of this paper: they are locked to Google Cloud. You cannot buy a TPU. You cannot run one in your home. Google's approach — building the most efficient AI chip possible and keeping it inside a walled garden — represents the cloud-first model at its most extreme. The counter-trend, explored in the next sections, is the opposite: making AI run on hardware you already own.

### NPUs: AI Moves Into Your Pocket

Neural processing units represent the most direct evidence that the industry is betting on local AI. NPUs are miniaturized, energy-optimized AI accelerators built directly into consumer devices — not add-on cards or cloud services, but standard components of smartphones and laptops (IBM, 2024).

Apple's Neural Engine, present in every iPhone since 2017, enables Face ID, real-time photo processing, and on-device Siri without sending data to the cloud (Built In, 2025). Qualcomm's Snapdragon X2 includes an 80-TOPS NPU, and Google's collaboration with Qualcomm has demonstrated Meta's Llama 3 (3B parameters) running entirely on a smartphone NPU at sub-5-millisecond latency (Google Developers, 2024). Microsoft's Copilot+ PC initiative requires dedicated NPUs in every qualifying Windows laptop (Microsoft, 2024). Apple Intelligence processes requests on-device by default, only reaching to the cloud for tasks that exceed local capability (Apple, 2024).

The message from the three most influential consumer technology companies is unanimous: the future of AI is on your device, not in their cloud.

## Architectural Comparison

Understanding why local AI is becoming viable requires examining the fundamental design differences between processor types. Table 2 summarizes these distinctions.

### Table 2

*Architectural Comparison of AI Processor Types*

| Feature | CPU | GPU | TPU | NPU |
|---|---|---|---|---|
| Core count | 4-64 powerful cores | 1,000-18,000+ small cores | 256x256 systolic array | Hundreds of MAC units |
| Execution model | Sequential | SIMT parallel | Systolic flow | Fixed-function neural ops |
| Strength | Complex varied tasks | Versatile parallel math | Maximum matrix efficiency | Energy-efficient inference |
| Weakness | Bad at parallel AI | Wastes energy on non-AI | Cannot do non-ML tasks | Inference only |
| Power | 65-250W | 200-700W | 100-400W | 5-15W |
| Access | Every computer | Consumer ($300+) or cloud | Google Cloud only | Built into phones/laptops |

*Note.* Compiled from Daintith and Wright (2008), Jouppi et al. (2017), Google Developers (2024), and IBM (2024).

The critical column is "Access." CPUs and NPUs are in every device. Consumer GPUs are affordable. Only TPUs remain cloud-exclusive. The hardware for local AI already exists in billions of devices — what was missing was software efficient enough to use it. That gap is now closing.

## The Real Revolution: Software Is Eating Hardware

This is the section most technology coverage gets wrong. The dominant narrative is that AI progress requires bigger chips, more powerful GPUs, larger data centers. But the most consequential advances of the past two years have been in software optimization — techniques that make existing hardware dramatically more capable without changing the silicon at all. As Andrej Karpathy, former head of AI at Tesla and a leading voice in AI democratization, has repeatedly argued, the software layer is advancing faster than hardware, and that asymmetry is what makes local AI inevitable.

### Model Compression: Trillion-Parameter Models on Consumer Hardware

The most capable AI models contain hundreds of billions of parameters. GPT-4's estimated 1.8 trillion parameters would require approximately 3.6 terabytes of memory at full precision — far beyond any consumer device. Model compression solves this through three techniques:

Quantization reduces the precision of each parameter from 32-bit or 16-bit floating-point numbers to 8-bit or 4-bit integers. A 70-billion-parameter model at 16-bit precision requires 140 GB; quantized to 4-bit, it requires roughly 35 GB — within reach of a high-end consumer GPU or Apple M-series laptop with unified memory.

Knowledge distillation trains a smaller "student" model to replicate a larger "teacher" model's behavior. Pruning removes the least important neural network connections. Combined, these techniques have reached the point where a well-compressed 7-billion-parameter model matches an uncompressed 13-billion-parameter model from a year prior.

### Token Optimization: Doing 4x More on the Same Chip

Model compression addresses storage. Token optimization addresses runtime efficiency — how much compute each query actually consumes.

PagedAttention, developed by the vLLM project, manages the key-value cache (which stores conversation context) like virtual memory, reducing waste by over 50% and increasing throughput 2-4x on identical hardware (Glukhov, 2025). Speculative decoding uses a small, fast model to generate candidate tokens that a larger model verifies in parallel, doubling generation speed without quality loss. Flash Attention restructures attention computation to minimize memory reads and writes, achieving 2-4x speedup through algorithm design rather than faster chips.

These optimizations compound. A quantized model running PagedAttention with Flash Attention delivers usable inference on a $300 consumer GPU that would have required a $10,000 data center card two years ago. The hardware did not change. The software made it 10x more efficient.

### Open-Source Models: The Catalyst

Hardware improvements and software optimization matter only if people have models to run. The open-source AI movement has provided exactly that. Meta's Llama series, Mistral's models, Alibaba's Qwen, Google's Gemma, and NVIDIA's own Nemotron provide frontier-quality models that anyone can download, quantize, fine-tune, and deploy — no API key, no subscription, no permission required (Meta AI, 2024).

NVIDIA's participation in open-source AI deserves particular attention because it reveals the strategic logic. NVIDIA dominates AI hardware with 86% market share in AI GPUs (Data Center Knowledge, 2025). Its data center revenue depends on companies buying expensive H100 and B200 chips for cloud AI infrastructure. Yet NVIDIA is actively releasing open-weight models and investing in tools that help people run AI locally on consumer GPUs. Why would the dominant cloud hardware company help build the local alternative?

Because NVIDIA recognizes that the shift to local AI is inevitable — driven by the software optimizations described above — and it would rather sell the consumer GPUs that power local AI than be disrupted by companies that do. If AI moves from the cloud to the edge, NVIDIA wants to be the chip in every laptop and desktop, not just every data center. This is Jensen Huang's second platform bet, echoing the CUDA decision of 2007: position NVIDIA for the next era before the current one ends.

### The Evidence: What Local AI Actually Looks Like

This is not theoretical. I built my own desktop PC with an NVIDIA RTX 4070 Ti SUPER — an $800 consumer graphics card with 16 GB of VRAM — and run a homelab that includes local AI model hosting. Through Ollama, I run quantized versions of Llama 3 (8B parameters) at conversational speeds for coding assistance, research, and experimentation. I can load a quantized 70B-parameter model for more demanding tasks with slower but functional inference. My data never leaves my machine. I pay no API fees. I have no rate limits.

The economics make the case concretely: enterprise API costs for cloud-hosted AI can reach $47,000 per month for heavy usage; local deployment on owned hardware reduces this to $8,000 per month — an 83% cost reduction (Glukhov, 2025). On mobile devices, Qualcomm NPUs run 3-billion-parameter models at sub-5ms latency — real-time voice AI that never contacts a server (Google Developers, 2024). The hardware a college student can afford in 2026 is architecturally descended from the same CUDA-enabled GPUs that trained AlexNet in 2012. The difference is that compression, quantization, and open-source tools have caught up to the silicon.

## The Stakes: Why This Shift Matters Beyond Technology

### Privacy and the Data Sovereignty Problem

Every interaction with cloud-hosted AI generates data that passes through corporate servers. In 2023, Samsung banned employees from using ChatGPT after engineers uploaded proprietary semiconductor source code during debugging sessions (Wiggers, 2023). This incident crystallized a tension facing every organization: the most capable AI tools demand that sensitive data leave your control.

Local AI resolves this entirely. A model running on your hardware processes your data locally — nothing is transmitted, nothing is stored on external servers, nothing can be leaked, subpoenaed, or used to train a competitor's model. As regulatory frameworks like GDPR and CCPA push toward data minimization, the demand for AI that never phones home will only grow.

### The Distillation Wars: When Companies Steal From Each Other

The AI industry's own internal conflicts are accelerating the shift to open-source. OpenAI accused Chinese AI lab DeepSeek of model distillation — systematically querying OpenAI's API to train a competing model on the outputs (Foundation for Defense of Democracies, 2026). This corporate espionage dynamic has pushed companies toward more restrictive APIs, output watermarking, and rate limiting — making cloud AI less open and more expensive.

The irony is that these restrictions strengthen the case for open-source models. If cloud APIs become restrictive and expensive, the rational response is to use freely available open-weight models that have no usage restrictions. Every time a cloud AI company tightens its API, it pushes users toward the open-source alternative. Dario Amodei, CEO of Anthropic, has acknowledged this tension: the safety arguments for keeping models closed conflict with the practical reality that open models are rapidly closing the capability gap (Amodei, 2025).

### The AI Cold War: Chips as Geopolitical Weapons

In October 2022, the United States imposed export controls restricting the sale of advanced AI chips to China, specifically targeting NVIDIA's A100 and H100 GPUs (U.S. Congressional Research Service, 2024). NVIDIA created modified chips (A800, H800) to comply; the U.S. tightened restrictions again in 2023, banning those too (Cutress, 2023). China has responded by investing over $100 billion in domestic semiconductor development, with Huawei's Ascend 910B chip representing its most advanced AI accelerator (Semiconductor Industry Association, 2024; Trendforce, 2024).

This geopolitical reality strengthens the case for open-source local AI from a national security perspective. Dependence on centralized AI infrastructure controlled by foreign companies — or powered by chips subject to export controls — is a strategic vulnerability. Nations that cannot access NVIDIA hardware have a powerful incentive to invest in open-source models running on alternative or domestically produced chips. The chip export bans intended to contain AI development may inadvertently accelerate the diversification of AI hardware and the adoption of open-source models that run on whatever silicon is available.

TSMC, which manufactures approximately 90% of the world's most advanced semiconductors on a single island, represents the most extreme concentration of strategic infrastructure on Earth (Council on Foreign Relations, 2023). The U.S. CHIPS and Science Act invested $52 billion to build domestic fabrication capacity (NIST, 2025), recognizing that the AI supply chain cannot remain this fragile.

### The Double-Edged Sword: Dangers of Democratized AI

Accessible AI hardware enables both unprecedented creativity and unprecedented harm. The same consumer GPU that runs a coding assistant can generate photorealistic deepfakes, produce convincing phishing emails at scale, or create synthetic media indistinguishable from reality. AI-powered autonomous weapons systems use the same NPU architectures found in smartphones. The ethical burden of AI is shifting from corporations to individuals — local AI has no content filter, no usage policy, and no monitoring.

Sam Altman, CEO of OpenAI, has argued that this is precisely why AI should remain centralized — so that safety guardrails can be enforced by responsible companies. The counter-argument, advanced by open-source advocates, is that transparency and broad access produce better safety outcomes because researchers can audit open models for bias and vulnerabilities. Neither position is fully wrong. But the hardware trajectory does not care about the debate — consumer chips are getting more capable regardless of anyone's policy preferences, and the software to exploit them is freely available.

## Prediction: AI Hardware in 2031

### The End of the Cloud-First Era

Following the historical pattern where each generation of consumer hardware matches data center hardware from 3-5 years prior, a mid-range consumer GPU in 2031 will offer performance comparable to today's NVIDIA A100. Combined with continued compression advances (2-bit and 1-bit quantization are already being researched), GPT-4-class models will run on a $500 device. The question shifts from "can I afford AI?" to "which AI do I want on my laptop?"

### AI Without the Internet

By 2031, fully capable AI assistants will operate entirely on-device — processing voice commands, writing, analyzing images, and managing tasks without any internet connection. This has particular significance for the roughly 2.6 billion people worldwide who lack reliable internet. When AI runs locally, the only infrastructure required is the device itself and a power source. Edge AI is projected to grow over 20% annually through 2030 (InfoWorld, 2025).

### Open-Source as the Default

The trajectory of open-source AI models mirrors the trajectory of open-source software: from niche alternative to industry default. Linux powers the majority of servers and mobile devices despite Microsoft and Apple's dominance in consumer operating systems. Open-source AI models will follow the same path — becoming the foundation that proprietary products build upon rather than compete against. Meta, NVIDIA, Google, and Alibaba have all released competitive open-weight models, and the pace is accelerating. By 2031, using a proprietary closed-source AI model will feel as unusual as using a proprietary web server feels today.

### AI Built Into Every Device

Microsoft, Apple, and Qualcomm are already shipping dedicated AI hardware in every new device. By 2031, application developers will assume AI capabilities are standard, the way they currently assume internet connectivity. AI features will stop being a selling point and become infrastructure — spell-check that understands context, photo apps that organize by content, development tools that catch bugs before compilation. The hardware disappears from awareness, which is the ultimate sign of technological maturity.

### The Remaining Tension: Who Trains, Who Runs?

The democratization story has one unresolved caveat. Running AI models is becoming accessible to anyone with consumer hardware, but training frontier models remains concentrated among companies with billions in compute budgets. This creates a two-tier system: a few organizations create foundational models, everyone else runs compressed versions locally. Whether this represents genuine democratization or a new form of dependency depends on whether open-source training — not just inference — becomes viable at smaller scales. Projects like Hugging Face's distributed training initiatives and academic efforts to train competitive models on university-scale compute suggest the training gap, too, will narrow — though it will take longer than the inference gap.

## Conclusion

The journey from NVIDIA's GeForce 256 to today's ecosystem of GPUs, TPUs, and NPUs is not just a story of hardware evolution. It is a story about power — who has it, who is gaining it, and who is about to lose it. A chip designed to render video game pixels became the engine of an artificial intelligence revolution because its parallel architecture accidentally aligned with the mathematics of neural networks. That accident has evolved into a trillion-dollar industry built on a simple economic model: intelligence lives in the cloud, and users pay to access it.

That model is breaking. Not because of any single breakthrough, but because of a convergence that no company can stop: silicon is getting more efficient; software optimization is making existing hardware 10x more capable; and open-source ecosystems are providing the models to run on it. Together, these forces are moving AI from corporate data centers into consumer GPUs, into smartphones, into laptops that ship with dedicated AI chips as standard equipment. Microsoft, Apple, Qualcomm, and even NVIDIA itself are building for this future — embedding AI directly into consumer hardware rather than routing it through the cloud.

The cloud era of AI was not a destination. It was a stopover — a temporary phase that existed because consumer hardware could not yet handle the computational demands of modern AI. That constraint is dissolving. Within five years, the default way most people interact with AI will be through models running locally on their own devices, private by default, free of API fees, independent of internet connectivity. The centralized AI infrastructure of 2025 will be remembered the way we remember mainframe computing — a necessary stage that gave way to something more personal, more accessible, and more powerful precisely because it belongs to everyone.

## References

AI News Hub. (2025). AI inference costs 2025: Why Google TPUs beat Nvidia GPUs by 4x. https://www.ainewshub.org/post/ai-inference-costs-tpu-vs-gpu-2025

Amodei, D. (2025). Machines of loving grace. https://darioamodei.com/machines-of-loving-grace

Apple. (2024). Apple Intelligence. https://www.apple.com/apple-intelligence/

Bitdeer. (2025). NVIDIA GPU evolution and the road ahead. https://www.bitdeer.ai/en/blog/nvidia-gpu-evolution-and-the-road-ahead/

Built In. (2025). What is a neural processing unit (NPU)? https://builtin.com/articles/npu-neural-processing-unit

Computer History Museum. (1965). Moore's law predicts the future of integrated circuits. *The Silicon Engine*. https://www.computerhistory.org/siliconengine/moores-law-predicts-the-future-of-integrated-circuits/

Council on Foreign Relations. (2023). Will China's reliance on Taiwanese chips prevent a war? https://www.cfr.org/blog/will-chinas-reliance-taiwanese-chips-prevent-war

CRV Science. (2024). Why Nvidia dominates AI: A history of CUDA and parallel computing. https://www.crvscience.com/post/why-nvidia-dominates-ai-a-history-of-cuda-and-parallel-computing

Cutress, I. (2023, October 18). Biden further chokes off China's AI chip supply with Nvidia bans. *TechCrunch*. https://techcrunch.com/2023/10/18/biden-china-nvidia-a800-h800-chips/

Daintith, J., & Wright, E. (2008). Parallel processing. In *A dictionary of computing* (6th ed.). Oxford University Press. Credo Reference.

Data Center Knowledge. (2025). The hottest data center chip developments in 2025. https://www.datacenterknowledge.com/infrastructure/the-hottest-data-center-chip-developments-in-2025

Foundation for Defense of Democracies. (2026, February 13). OpenAI alleges China's DeepSeek stole its intellectual property to train its own models. https://www.fdd.org/analysis/2026/02/13/openai-alleges-chinas-deepseek-stole-its-intellectual-property-to-train-its-own-models/

Glassner, A. (2012). Graphics processing unit; GPU. In *3D A-to-Z: An encyclopedic dictionary*. McFarland & Company. https://search.credoreference.com/articles/Qm9va0FydGljbGU6MzAyMzkwNw==

Glukhov, R. (2025). Local LLM hosting: Complete 2025 guide — Ollama, vLLM, LocalAI, Jan, LM Studio & more. *Medium*. https://medium.com/@rosgluk/local-llm-hosting-complete-2025-guide-ollama-vllm-localai-jan-lm-studio-more-f98136ce7e4a

Google Developers. (2024). Unlocking peak performance on Qualcomm NPU with LiteRT. *Google Developers Blog*. https://developers.googleblog.com/unlocking-peak-performance-on-qualcomm-npu-with-litert/

IBM. (2024). NPU vs GPU: What's the difference? https://www.ibm.com/think/topics/npu-vs-gpu

InfoWorld. (2025). Edge AI: The future of AI inference is smarter local compute. https://www.infoworld.com/article/4117620/edge-ai-the-future-of-ai-inference-is-smarter-local-compute.html

Introl. (2025). Google TPU architecture: Complete guide to 7 generations. https://introl.com/blog/google-tpu-architecture-complete-guide-7-generations

Jouppi, N. P., Young, C., Patil, N., Patterson, D., Agrawal, G., Bajwa, R., Bates, S., Bhatia, S., Boden, N., Borber, A., Boyle, R., Cantin, P., Chao, C., Clark, C., Coriell, J., Daley, M., Dau, M., Dean, J., Gelb, B., … Yoon, D. H. (2017). In-datacenter performance analysis of a tensor processing unit. *Proceedings of the 44th Annual International Symposium on Computer Architecture*, 1–12. https://doi.org/10.1145/3079856.3080246

Krizhevsky, A., Sutskever, I., & Hinton, G. E. (2012). ImageNet classification with deep convolutional neural networks. *Advances in Neural Information Processing Systems*, *25*, 1097–1105.

Meta AI. (2024). Introducing Llama 3.1: Our most capable models to date. https://ai.meta.com/blog/meta-llama-3-1/

Microsoft. (2024). Introducing Copilot+ PCs. https://blogs.microsoft.com/blog/2024/05/20/introducing-copilot-plus-pcs/

MIT CSAIL. (2023). The death of Moore's Law: What it means and what might fill the gap going forward. *CSAIL Alliances*. https://cap.csail.mit.edu/death-moores-law-what-it-means-and-what-might-fill-gap-going-forward

National Institute of Standards and Technology. (2025). CHIPS for America: Funding updates. U.S. Department of Commerce. https://www.nist.gov/chips/funding-updates

Rathore, A. (2024). How Nvidia built the ultimate AI engine: A look at GPU core architecture. *Embedded.com*. https://www.embedded.com/how-nvidia-built-the-ultimate-ai-engine-a-look-at-gpu-core-architecture/

Sanmartín, D., & Prohaska, V. (2023). Exploring TPUs for AI applications. *arXiv preprint arXiv:2309.08918*. https://arxiv.org/abs/2309.08918

Semiconductor Industry Association. (2024). Taking stock of China's semiconductor industry. https://www.semiconductors.org/taking-stock-of-chinas-semiconductor-industry/

Trendforce. (2024, June 11). Huawei's self-developed AI chip challenges NVIDIA, boasting its Ascend 910B to be equal in match with A100. https://www.trendforce.com/news/2024/06/11/news-huaweis-self-developed-ai-chip-challenges-nvidia-boasting-its-ascend-910b-to-be-equal-in-match-with-a100/

U.S. Congressional Research Service. (2024). U.S. export controls and China: Advanced semiconductors (Report R48642). Library of Congress. https://www.congress.gov/crs-product/R48642

UST. (2024). AI chips power growth while transforming the semiconductor industry. https://www.ust.com/en/insights/ai-chips-driving-the-next-semiconductor-supercycle-strategic-analysis-and-industry-outlook

VoltagePark. (2025). GPU as a service: Key benefits and providers in 2025. https://www.voltagepark.com/blog/gpu-as-a-service-key-benefits-and-providers-in-2025/

Wiggers, K. (2023, May 2). Samsung bans use of generative AI tools like ChatGPT after internal data leak. *TechCrunch*. https://techcrunch.com/2023/05/02/samsung-bans-use-of-ai-like-chatgpt-for-staff-after-misuse-of-chatbot.html
