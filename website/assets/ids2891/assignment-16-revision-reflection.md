# Revision and Reflection
**Josue Aparcedo Gonzalez**
**IDS2891 Cornerstone — Spring 2026**

---

## Project Thesis

The cloud-first era of artificial intelligence is a temporary phase in computing history, not its conclusion. Four converging trends — silicon miniaturization, model compression, token optimization, and open-source model availability — are making centralized AI infrastructure unnecessary for most use cases. Within five years, the default way most people interact with AI will be through models running locally on their own devices, not through subscriptions to corporate server farms.

I did not start there. I started with a much narrower question: how did a chip designed to render video game graphics end up running the world's artificial intelligence? That question felt technical, bounded, and manageable. The research that followed proved me wrong on all three counts.

The thesis emerged from a collision between academic research and personal experience. Background work through the FSW Libraries — especially Jouppi et al.'s (2017) landmark paper on Google's Tensor Processing Unit — gave me the technical foundation. But it was hands-on experience building my own desktop PC with an NVIDIA RTX 4070 Ti SUPER and running AI models locally through Ollama that transformed the thesis from academic to something I actually believed. I was not reading about democratization from a distance. I was living it. The research expanded outward from there — from pure hardware analysis into the psychology of why people trust cloud services over local ones, the geopolitics of U.S.-China semiconductor export controls, the economics of the AI chip market, and the long trajectory toward artificial general intelligence. The thesis grew to fit the evidence: the cloud-first moment is not permanent, and the hardware proving that is already in people's homes (Jouppi et al., 2017; Data Center Knowledge, 2025; CRV Science, 2024).

---

## How the Research Evolved

### Scope

The most dramatic shift in this project was scope expansion, and it happened in a way I did not expect or plan. What started as a focused technical analysis of GPU architecture became a 13,000-word interdisciplinary paper covering hardware evolution, software optimization, open-source ecosystems, the psychology of cloud dependence, corporate incentive structures, geopolitics of semiconductor supply chains, military ethics, cybersecurity, and the trajectory toward AGI. The paper grew far beyond any assignment requirement — not because I lost discipline, but because the connections between these threads were genuinely inseparable.

Here is what I mean. I could not explain why local AI matters without explaining why people resist it. And I could not explain why people resist it without understanding the corporate incentive structures that have spent decades engineering the assumption that powerful technology must live on someone else's server. A purely technical paper would have described the hardware accurately but explained nothing important about it. The scope expansion was not drift. It was the research following the actual shape of the problem.

The check-in assignments document this expansion in real time. By Check-in 3, I was already writing about the psychology of the "delegation premium" — the behavioral economics concept describing why people pay more for cloud services that do things their own hardware could do for free. That concept did not appear in my original research questions. It appeared because the hardware story kept pointing toward a human question: given that local AI is often faster, cheaper, and more private than cloud AI, why do most people still choose the cloud?

### Approach and Perspective

The critical lens shifted fundamentally over the course of the project. The Research Documentation assignment described a technical analysis with democratization as a secondary theme — a lens applied to technical findings. By the time the full paper was complete, democratization had become the primary lens through which all the technical findings were interpreted. The hardware history was not the point. The question of who gets to use it was.

The most surprising discovery in the entire project was the psychology section. The "delegation premium" concept and the "bank versus mattress" analogy for cloud trust — the idea that people distrust storing money under a mattress even when the mattress is objectively safer — emerged from behavioral economics research that a purely technical framing would never have surfaced. I genuinely did not expect that the biggest barriers to local AI adoption would turn out to be psychological rather than technical. That finding changed how I understood the entire argument. The hardware question ("can consumer devices run capable AI?") had been answered yes. The actual question became: why are people still choosing cloud if the hardware exists to do it locally? That is a much more interesting and honest question (IBM, 2024; Meta AI, 2024; Rathore, 2024; Sanmartín & Prohaska, 2023).

### Context

The scholarly conversation this project engages with expanded substantially as the research deepened. I started inside computer architecture journals. I ended up drawing from science and technology studies, behavioral economics, geopolitics, and AI ethics. The audience for the final artifact broadened correspondingly — from "engineering students interested in chip architecture" to "anyone whose life is shaped by AI," which is increasingly everyone.

The decision to build an interactive scroll-driven website as the final deliverable, rather than a written paper or a PowerPoint, reflects this expansion. The subject demands visual communication. Static text cannot convey how data flows through a systolic array the way an animated diagram can. And the meta-narrative — using AI tools running on consumer hardware to build the website that argues consumer hardware will replace the cloud — is not a gimmick. It is evidence. The thesis needed to be demonstrated, not just argued.

---

## Research Strategies and Their Effectiveness

### Source Layering

The strategy that proved most effective was building the bibliography in deliberate layers. I started with tertiary sources from Credo Reference — Glassner (2012) for foundational GPU vocabulary, Daintith and Wright (2008) for the computational context of parallel processing, Marcovitz (2018) for the fourth industrial revolution framing — not because these sources would appear prominently in the final paper, but because they established the consensus baseline before I went looking for where the edges were. Starting with what is settled lets you identify what is still contested. Researchers who skip the tertiary layer and go directly to cutting-edge papers often lack the vocabulary to evaluate what they are reading.

From there I moved to peer-reviewed primary sources. Jouppi et al. (2017) was the single most important source in the project. Reading the original paper — not a summary of it — gave me the technical foundation to understand what "15 to 30 times better performance per watt" means architecturally, not just as a statistic. Krizhevsky et al.'s (2012) AlexNet paper provided the same grounding for the neural network history. I supplemented these with current industry analysis for data that peer review cannot yet capture, since the AI hardware landscape is changing faster than academic publication cycles. This layered approach was highly effective across all three levels: it built understanding incrementally, ensured the bibliography had both scholarly depth and current relevance, and reduced the risk of treating a contested claim as settled fact (Glassner, 2012; Daintith & Wright, 2008; Bitdeer, 2025).

### AI-Assisted Research

The second strategy was using locally hosted AI models — running via Ollama on the RTX 4070 Ti SUPER — for drafting, fact-checking connections between sources, and surfacing literature I had not found independently. This strategy was both effective and ironic in a way that became central to the paper's argument: the tools I used to research and write the paper were themselves the thesis in practice. Running capable AI locally, seeing what a consumer GPU could do that three years ago required a corporate server subscription, directly informed the claims I was making about democratization. The tool was not just useful. It was evidence.

### What Could Have Been Better

The scope expansion, while intellectually rewarding, produced a paper that far exceeded any reasonable course requirement. A more disciplined researcher would have constrained scope earlier and more aggressively. I understand the argument for that discipline. But I also think the paper needed to be as comprehensive as it is to be honest — the hardware story without the psychology section is technically accurate but misleading about why any of it matters. The connections between hardware, psychology, economics, and geopolitics are not decorative. They are load-bearing. Cutting them would have made the paper shorter and shallower.

---

## Revised Bibliography

Apple. (2024). *Apple Intelligence*. https://www.apple.com/apple-intelligence/

Bitdeer. (2025). NVIDIA GPU evolution and the road ahead. https://www.bitdeer.ai/en/blog/nvidia-gpu-evolution-and-the-road-ahead/

Built In. (2025). What is a neural processing unit (NPU)? https://builtin.com/articles/npu-neural-processing-unit

CRV Science. (2024). Why Nvidia dominates AI: A history of CUDA and parallel computing. https://www.crvscience.com/post/why-nvidia-dominates-ai-a-history-of-cuda-and-parallel-computing

Daintith, J., & Wright, E. (2008). Parallel processing. In *A dictionary of computing* (6th ed.). Oxford University Press. Credo Reference.

Data Center Knowledge. (2025). The hottest data center chip developments in 2025. https://www.datacenterknowledge.com/infrastructure/the-hottest-data-center-chip-developments-in-2025

Glassner, A. (2012). Graphics processing unit; GPU. In *3D A-to-Z: An encyclopedic dictionary*. McFarland & Company. Credo Reference.

Glukhov, R. (2025). Local LLM hosting: Complete 2025 guide. *Medium*. https://medium.com/@rosgluk/local-llm-hosting-complete-2025-guide-ollama-vllm-localai-jan-lm-studio-more-f98136ce7e4a

IBM. (2024). NPU vs GPU: What's the difference? https://www.ibm.com/think/topics/npu-vs-gpu

Introl. (2025). Google TPU architecture: Complete guide to 7 generations. https://introl.com/blog/google-tpu-architecture-complete-guide-7-generations

Jouppi, N. P., Young, C., Patil, N., Patterson, D., Agrawal, G., Bajwa, R., Bates, S., Bhatia, S., Boden, N., Borber, A., Boyle, R., Cantin, P., Chao, C., Clark, C., Coriell, J., Daley, M., Dau, M., Dean, J., Gelb, B., … Yoon, D. H. (2017). In-datacenter performance analysis of a tensor processing unit. *Proceedings of the 44th Annual International Symposium on Computer Architecture*, 1–12. https://doi.org/10.1145/3079856.3080246

Krizhevsky, A., Sutskever, I., & Hinton, G. E. (2012). ImageNet classification with deep convolutional neural networks. *Advances in Neural Information Processing Systems*, *25*, 1097–1105.

Marcovitz, H. (2018). Artificial intelligence and machine learning. In *The fourth industrial revolution* (pp. 30–41). ReferencePoint Press. Credo Reference.

Meta AI. (2024). Introducing Llama 3.1: Our most capable models to date. https://ai.meta.com/blog/meta-llama-3-1/

Rathore, A. (2024). How Nvidia built the ultimate AI engine: A look at GPU core architecture. *Embedded.com*. https://www.embedded.com/how-nvidia-built-the-ultimate-ai-engine-a-look-at-gpu-core-architecture/

Sanmartín, D., & Prohaska, V. (2023). Exploring TPUs for AI applications. *arXiv preprint arXiv:2309.08918*. https://arxiv.org/abs/2309.08918

UST. (2024). AI chips power growth while transforming the semiconductor industry. https://www.ust.com/en/insights/ai-chips-driving-the-next-semiconductor-supercycle-strategic-analysis-and-industry-outlook

Wiggers, K. (2023, May 2). Samsung bans use of generative AI tools like ChatGPT after internal data leak. *TechCrunch*. https://techcrunch.com/2023/05/02/samsung-bans-use-of-ai-like-chatgpt-for-staff-after-misuse-of-chatbot.html
