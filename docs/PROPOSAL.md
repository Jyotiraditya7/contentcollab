# ContentCollab: project proposal

ECE1779 Introduction to Cloud Computing, Fall 2026. Due Saturday 7 November 2026, 11:59pm. One Markdown file, at most 2,000 words. Drafted in the shared Google Doc; each section's owner moves the settled text here.

Team: Nabeegh Khan (1001388152), Milton Wang (1009114192), Jyotiraditya Kale (1013397370), Yiqing Liu (1008052580).

## 1. Motivation

Owner: Eyrika. Problem, intended users, why it is worth addressing, limitations of existing approaches.

## 2. Objectives, architecture and key features

Owner: Nabeegh. From `ARCHITECTURE.md`: objectives and core functionality, the architecture, how each required technology is used, the advanced features, scope and feasibility.

## 3. Project plan and team responsibilities

Owner: Milton. From `PLAN.md`: stages, division of work, integration strategy, dependencies and coordination, risks.

## 4. Initial team reasoning and AI-assisted exploration

### 4.1 Initial Team Reasoning

During our October 10 meeting, we compared several project ideas, including a GitHub clone, inventory management system and scientific data repository. We selected the Content Sharing and Collaboration Platform because it was applicable across different industries and allowed us to demonstrate cloud capabilities such as storage, access control and real-time collaboration. Initially, our project was envisioned as a Google Docs-style editor, as reflected in the repository description on October 14. However, during our October 17 meeting, we recognized that live co-editing required a complex conflict-resolution engine, such as a CRDT, making it a substantial standalone product. We therefore narrowed our scope to collaborative document review. PDFs and images would be rendered for review, while Office files would be stored, versioned, and downloadable. The platform would support uploads, link sharing, version history, live comments with @-mentions and pins, search, and metadata export. Access would be managed through four roles: Owner, Editor, Commenter, and Viewer. Our remaining open questions included the cost of hosting, whether Kubernetes could be deployed by November 15 and session affinity support in the Gateway controller.

### 4.2 Exploration and Evaluation

During subsequent architectural discussions, we evaluated Kubernetes against Docker Swarm and Fly.io, ultimately selecting DigitalOcean Kubernetes (DOKS) to maintain a single cloud provider and support orchestration requirements. We chose React for the frontend because demonstrating live comments, document versions, and role-based access through an interface was more effective than relying solely on API requests using curl. We also planned a separate BullMQ worker service using Redis to process bulk imports without blocking API requests. On October 24, we revisited our real-time architecture. AI was used to evaluate the simplest way to run Socket.IO behind a load balancer with multiple API pods and a Redis adapter. AI recommended WebSocket-only transport to avoid session affinity, with sticky sessions as an alternative. We critically evaluated this recommendation and chose sticky sessions with a Redis adapter, retaining WebSocket-only transport as a fallback if Gateway session affinity could not be supported. Our proposal commits to security features, including JSON Web Token (JWT) authentication and HTTPS, and a GitHub Actions CI/CD pipeline. Autoscaling and high availability remain planned extensions.

