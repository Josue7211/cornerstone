# Library Assignment #3 — Research Buckets & Expert Sources
**Josue Aparcedo Gonzalez**
**IDS2891 Cornerstone — Spring 2026**

---

## Step 1: Research Buckets

**Bucket 1: Local/On-Device AI and Affordability**
How AI hardware has become accessible enough for consumer devices and home use. This includes how open-source AI models can now run on a standard laptop or gaming PC, the falling cost curve of AI hardware over time, and the tools and techniques that make running AI locally practical for everyday people — not just research labs. The central question: who gets to use powerful AI, and is that changing?

**Bucket 2: GPU Evolution and the Path to Accessible AI Computing**
The technical progression from graphics-only GPUs to today's AI accelerators, and how that shift is directly connected to democratizing AI. As GPUs became better at parallel computation, they also became the key hardware that allows AI models to run on consumer-grade machines. This bucket also covers efficiency breakthroughs — like running AI models on less memory and cheaper hardware (token optimization, quantization) — that are expanding what's possible outside of data centers.

---

## Step 2: Experts for Each Bucket

**Bucket 1 — Local/On-Device AI and Affordability:**
- **Tim Dettmers** — PhD researcher known for his work on quantization techniques (reducing AI model size so they run on consumer hardware). He created the *bitsandbytes* library, which makes it possible to run large AI models in 4-bit precision on GPUs that cost a few hundred dollars.
- **Georgi Gerganov** — Creator of *llama.cpp*, an open-source project that brought large language model inference to consumer hardware (including laptops and older machines with no GPU). His work is one of the most concrete examples of AI democratization in practice.

**Bucket 2 — GPU Evolution and Path to Accessible AI:**
- **Jensen Huang** — CEO and co-founder of NVIDIA. He led the strategic shift from GPUs as graphics hardware to GPUs as general AI accelerators, starting with the CUDA platform in 2006. His decisions shaped the hardware infrastructure that now makes consumer AI possible.
- **Kunle Olukotun** — Professor at Stanford and a pioneer in domain-specific hardware research for machine learning. His academic work on specialized compute architectures has directly influenced how researchers think about building efficient AI hardware for broader deployment.

---

## Step 3: Source from FSW Libraries

**Citation (APA):**

Jouppi, N. P., Young, C., Patil, N., Patterson, D., Agrawal, G., Bajwa, R., Bates, S., Bhatia, S., Boden, N., Borber, A., Boyle, R., Cantin, P., Chao, C., Clark, C., Coriell, J., Daley, M., Dau, M., Dean, J., Gelb, B., … Yoon, D. H. (2017). In-datacenter performance analysis of a tensor processing unit. *Proceedings of the 44th Annual International Symposium on Computer Architecture*, 1–12. https://doi.org/10.1145/3079856.3080246

**Link:** https://doi.org/10.1145/3079856.3080246

**Research Note:** Google's 2017 TPU paper, authored by Norman Jouppi and the team that built the first Tensor Processing Unit, is relevant beyond just describing a single chip. It demonstrates that purpose-built, efficient silicon is a key step in making AI computation practical at scale — and eventually affordable enough to reach consumer devices. The performance-per-watt gains documented here are the same logic that now powers efficient on-device AI in phones, laptops, and consumer hardware. Available through FSW library access to the ACM Digital Library.

---

## Step 4: Source from Google Search

**Citation (APA):**

Rathore, A. (2024). How Nvidia built the ultimate AI engine: A look at GPU core architecture. *Embedded.com*. https://www.embedded.com/how-nvidia-built-the-ultimate-ai-engine-a-look-at-gpu-core-architecture/

**Link:** https://www.embedded.com/how-nvidia-built-the-ultimate-ai-engine-a-look-at-gpu-core-architecture/

**Research Note:** This article traces NVIDIA's GPU architecture from early graphics hardware through the CUDA platform and tensor cores, explaining in accessible terms how those engineering decisions are what made GPUs the default tool for AI today. It directly supports Bucket 2 by showing the technical evolution path — and connects to the democratization angle because the same GPU innovations that scaled AI in data centers are what now power affordable consumer AI hardware.

