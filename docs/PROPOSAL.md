# ContentCollab: project proposal

ECE1779 Introduction to Cloud Computing, Fall 2026. Due Saturday 7 November 2026, 11:59pm. One Markdown file, at most 2,000 words. Drafted in the shared Google Doc; each section's owner moves the settled text here.

Team: Nabeegh Khan (1001388152), Milton Wang (1009114192), Jyotiraditya Kale (1013397370), Yiqing Liu (1008052580).

## 1. Motivation

**Sharing a PDF is easy. Sharing the thinking behind it shouldn’t be hard.** Imagine a study group reviewing the same research paper: one student highlights a passage on their own copy, another asks a question in a group chat, and a third emails an annotated version. The document is shared, but the conversation is fragmented. Our proposed platform brings PDF annotations and discussions into one shared space, keeping feedback connected to the passages it refers to. Instead of piecing together separate notes and messages, users can review the document together and build a shared understanding.

Therefore, we aim to construct a stateful, cloud-native content review platform. A user uploads a document, or a PDF, shares it with named collaborators or by a scoped link, and the collaborators comment and annotate on it, with updates appearing live for everyone viewing the same version. Our target audience is highly specific: remote professionals working from home, academic and industry teams, clients and contractors navigating legal terms or architectural designs, and any organization engaged in global collaboration.

While some literature argues that real-time co-editing is costly, contested, and inefficient for review workflows (Sun 2020; Attiya 2021), this limitation stems from existing tools' technical compromises rather than the concept itself. Critical technical gaps persist in real-time PDF workflows precisely because previous platforms failed to bridge continuous document interaction with concurrency. Current office suites and canvas tools (e.g., Google Workspace, OneNote, Figma) either force conversion to editable docs or flatten PDFs into static images, creating a poor multi-page reading experience due to the complex engineering required for dynamic coordinate mapping, scaling, OCR, and font rendering. Meanwhile, alternative tools force difficult trade-offs: branch-based platforms (e.g., GitHub) conflict with live co-editing, while handwriting-focused apps (e.g., GoodNotes 6) deliver subpar web experiences. Finally, while recent AI and PDF entrants (e.g., Adobe PDF Space, ChatPDF, Notion AI) offer collaboration, their centralized cloud infrastructure incurs steep subscription costs and raises major data privacy concerns for enterprise users. Our platform directly targets these architecture bottlenecks to make native, seamless real-time PDF co-editing viable and privacy-preserving.


## 2. Objectives, architecture and key features

Owner: Nabeegh. From `ARCHITECTURE.md`: objectives and core functionality, the architecture, how each required technology is used, the advanced features, scope and feasibility.

## 3. Project plan and team responsibilities

Owner: Milton. From `PLAN.md`: stages, division of work, integration strategy, dependencies and coordination, risks.

## 4. Initial team reasoning and AI-assisted exploration

Owner: Jyotiraditya. Initial understanding (10 October notes), technical hypotheses, open questions, how the thinking changed, one AI interaction with its evaluation, how the final proposal differs from the initial thinking.
