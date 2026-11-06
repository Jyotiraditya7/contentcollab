# ContentCollab: project proposal

ECE1779 Introduction to Cloud Computing, Fall 2026.

Team: Nabeegh Khan (1001388152), Milton Wang (1009114192), Jyotiraditya Kale (1013397370), Yiqing Liu (1008052580).

## 1. Motivation

**Sharing a PDF is easy. Sharing the thinking behind it shouldn’t be hard.** Imagine a study group reviewing the same research paper: one student highlights a passage on their own copy, another asks a question in a group chat, and a third emails an annotated version. The document is shared, but the conversation is fragmented. Our proposed platform brings PDF annotations and discussions into one shared space, keeping feedback connected to the passages it refers to. Instead of piecing together separate notes and messages, users can review the document together and build a shared understanding.

Therefore, we aim to construct a stateful, cloud-native content review platform. A user uploads a document or a PDF and shares it with named collaborators or by a scoped link. The collaborators comment and annotate on it. Updates appear live for everyone viewing the same version. We primarily address groups with a strong demand for concurrent document interaction and co-viewing. Our target users center on remote professionals, lab and industry teams, clients and contractors navigating legal terms or architectural designs, and any organization engaged in global collaboration. Additionally, we intend to bring this collaborative approach into academic environments, fostering deeper engagement between students and educators to enrich the learning process.

While some literature argues that document review workflows are costly, contested, and inefficient [15], this limitation stems from existing tools' technical compromises rather than the concept itself. Critical technical gaps persist in native PDF workflows precisely because previous platforms failed to bridge smooth document interaction with robust architecture. Current office suites and canvas tools (e.g. Google Workspace, OneNote, Figma) either force conversion to editable formats or flatten PDFs into static images, creating a poor multi-page reading experience due to the complex engineering required for dynamic coordinate mapping, scaling, OCR, and font rendering. Meanwhile, alternative tools force difficult trade-offs: branch-based platforms (e.g. GitHub) conflict with intuitive review workflows, while handwriting-focused apps (e.g. GoodNotes 6) deliver subpar web experiences. Finally, while recent artificial intelligence (AI) and PDF entrants (e.g. Adobe PDF Space, ChatPDF, Notion AI) offer collaboration, their centralized cloud infrastructure incurs steep subscription costs and raises major data privacy concerns for enterprise users. Our platform directly targets these architectural bottlenecks to make native, seamless PDF collaboration viable and privacy-preserving.

## 2. Objectives, architecture and key features

### 2.1 Objectives

ContentCollab lets people share files and discuss them in place, so files, versions and comments stay together instead of scattering across email and chat.

Users upload a document and share it as Owner, Editor, Commenter or Viewer, the roles Google Drive uses [11], or by a link with an expiry. Everyone viewing a version sees new comments and pins (notes on a page position) without refreshing.

The cloud objective is resilience: an API pod can crash, the database can move to another node, or a release can roll out, and no user loses a comment.

### 2.2 Architecture

![ContentCollab component diagram](https://raw.githubusercontent.com/nabeegh-khan/contentcollab/main/docs/img/architecture.png)

*Figure 1. Components and their connections. Solid lines carry application traffic; dashed lines are configuration, deployment and monitoring.*

A small React web app calls a JSON API through one Gateway, which terminates HTTPS for `contentcollab.app`. Files live in DigitalOcean Spaces, object storage every replica reaches over HTTP; users, documents, shares, versions and comments live in PostgreSQL on block storage [7].

### 2.3 Key design decisions

| Decision | Reason | Trade-off |
|---|---|---|
| Slow work runs in a worker on a Redis queue | A large file cannot exhaust API memory or block users | One more service |
| Socket.IO with sticky sessions and the Redis adapter | Without affinity the long-polling fallback breaks across replicas; the adapter relays events between pods [3] | Needs affinity at the Gateway; WebSocket-only is the fallback |
| Gateway API, not ingress-nginx | ingress-nginx was retired in March 2026 [1] | New objects to configure |
| One PostgreSQL instance on a volume; files in Spaces | A volume attaches to one node; a file on one pod's disk is invisible to the others [4], [5], [7] | No database failover |
| Two small nodes | About US$54 a month shared by four: two US$18 nodes, a US$12 load balancer and US$5 for Spaces [2], [13], [14] | Little headroom; load tests run before the demo |

### 2.4 Failure handling

API pods hold no state, so any pod can be killed or added without losing data. Each service has its own container, health check and rollout, so a failure degrades one capability: without Redis, comments still save and clients poll; without the worker, uploads still succeed; without PostgreSQL, the readiness probe fails and the Service stops routing to that pod [8].

| Risk | How we handle it |
|---|---|
| Race conditions | Optimistic locking rejects a stale write with 409; transactions and unique constraints prevent partial or duplicate rows |
| Retries | Idempotency keys on uploads and jobs; timeouts and backoff on every call; reconnecting clients fetch events after their last sequence number |
| Memory | Uploads stream to Spaces; every container has requests and limits |
| Silent failure | Alerts on 5xx rate, latency, pod restarts, queue depth and disk |
| Drift | Pinned base images and lockfile installs; the image tested in CI is the one deployed, after a migration Job |

### 2.5 How the required technologies are used

| Requirement [10] | Our use |
|---|---|
| Docker and Docker Compose | One container per service; one Compose file runs the stack locally with health checks [6] |
| PostgreSQL | Relational data linked by foreign keys and changed inside transactions |
| Persistent storage | A persistent volume backed by a DigitalOcean Volume; the demo deletes the database pod; the data survives |
| Orchestration | DigitalOcean Kubernetes: Deployments, Services, a PostgreSQL StatefulSet and an API HorizontalPodAutoscaler, each kept at its desired state [8]; tested on minikube first, Swarm the fallback if the cluster is unstable on 14 November [9] |
| Deployment provider | DigitalOcean, the course's IaaS provider [7]; Fly.io's Kubernetes service is a paid beta the course does not recommend [12] |
| Monitoring | DigitalOcean alerts on CPU, memory and disk; request counts, errors and latency at `/metrics`; Datadog for dashboards and container logs |

### 2.6 Core features

- **Upload and preview.** PDFs and images render in the browser; other types, Office files included, are stored, versioned and downloadable.
- **Sharing and roles.** By email or by a link with an expiry; one middleware checks the role before every action.
- **Comments.** Threads, pins on a page position, @-mentions, live for everyone viewing the version.
- **Versions.** Every upload is a version; any version can be restored.

### 2.7 Advanced features

We commit to two:

1. **Security.** bcrypt password hashes, JWT sessions, role checks on every route, expiring share links, HTTPS at the Gateway, credentials in Kubernetes Secrets, never in images or the repository [6].
2. **CI/CD.** GitHub Actions has checked lint, formatting and types on every pull request since 28 October; tests against a PostgreSQL service container join as features land; a merge to `main` builds the images, pushes them to the GitHub Container Registry and rolls them out one pod at a time [8].

One planned extension, reported as finished only if it is: **autoscaling and high availability**, more API replicas under load, readiness probes, and a rolling update with no dropped requests.

### 2.8 Scope and feasibility

Live co-editing is out of scope: it needs a conflict-resolution engine, a separate product. We deploy before we build features, so deployment problems surface early, and each feature ships with tests, so a change that breaks another member's part fails in CI. The cluster has run on DigitalOcean since 4 November; demo-path features freeze on 21 November, leaving 21 to 24 November for load tests and two rehearsals. Each part has a named owner (section 3).

## 3. Project plan and team responsibilities

For this project, we will divide it into multiple parts, with each person's scope showing their own commits, Issues, and pull requests on GitHub. Eyrika will work on the backend API, tags, and email notifications. Jyotiraditya will work on the backend live updates and with Eyrika on the API. Milton will work on the front end, backups, and API documentation. Nabeegh will work on the cloud orchestration and CI/CD pipeline. 

We will integrate the components through weekly milestones, where we first work on the schema and API contract before building features against them. The schema, authentication, documents and shares are the critical path. Real-time and the frontend build on them, so they merge first, one pull request at a time. The 14 November checkpoint is measured against them. 

To maintain code quality, prevent integration bottlenecks, and avoid needing to resolve problems at the last minute, we will follow a weekly testing cadence. We will also use the WhatsApp group chat and during weekly group meetings (Saturday, 3:30 p.m) for quick check-ins and GitHub Issues and pull requests to resolve technical problems. We will use the Issues on the GitHub repository and assign reviewers for each other’s work to verify functionality. Code changes require one review while reports and documentation will be reviewed by all four of us, requiring one approval to merge. The skeleton was completed on November 1. We will work on the core features and cloud in parallel until November 14, the real-time and additional features on November 9-20, with checkpoints on November 14 and 20. We will end work on features on the demonstration path on November 21 and do load tests and two rehearsals before the presentation, on November 21-24.   

We are also aware that unexpected issues may arise. These include a feature or stage slipping, a late feature, pod or volume losses, or issues with deployment. If the cluster is down during the presentation, the demonstration will run from the local Compose stack with the same data. We will exclude additional features that do not work from the demonstration, have those who are ahead take up work on open issues, and use the pg_dump backup to prevent volume loss.

## 4. Initial team reasoning and AI-assisted exploration

### 4.1 Initial Team Reasoning

During our October 10 meeting, we compared several project ideas, including a GitHub clone, inventory management system and scientific data repository. We selected the Content Sharing and Collaboration Platform because it was applicable across different industries and allowed us to demonstrate cloud capabilities such as storage, access control and real-time collaboration. Initially, our project was envisioned as a Google Docs-style editor, as reflected in the repository description on October 14. However, during our October 17 meeting, we recognized that live co-editing required a complex conflict-resolution engine, such as a CRDT, making it a substantial standalone product. We therefore narrowed our scope to collaborative document review. PDFs and images would be rendered for review, while Office files would be stored, versioned, and downloadable. The platform would support uploads, link sharing, version history, live comments with @-mentions and pins, search, and metadata export. Access would be managed through four roles: Owner, Editor, Commenter, and Viewer. Our remaining open questions included the cost of hosting, whether Kubernetes could be deployed by November 15 and session affinity support in the Gateway controller.

### 4.2 Exploration and Evaluation

During subsequent architectural discussions, we evaluated Kubernetes against Docker Swarm and Fly.io, ultimately selecting DigitalOcean Kubernetes (DOKS) to maintain a single cloud provider and support orchestration requirements. We chose React for the frontend because demonstrating live comments, document versions, and role-based access through an interface was more effective than relying solely on API requests using curl. We also planned a separate BullMQ worker service using Redis to process bulk imports without blocking API requests. On October 24, we revisited our real-time architecture. AI was used to evaluate the simplest way to run Socket.IO behind a load balancer with multiple API pods and a Redis adapter. AI recommended WebSocket-only transport to avoid session affinity, with sticky sessions as an alternative. We critically evaluated this recommendation and chose sticky sessions with a Redis adapter, retaining WebSocket-only transport as a fallback if Gateway session affinity could not be supported. We also plan to implement security features including JSON Web Token (JWT) authentication and HTTPS, and a GitHub Actions CI/CD pipeline. Autoscaling and high availability remain planned extensions.

## References

[1] Kubernetes, "Ingress NGINX retirement: what you need to know," Kubernetes Blog, Nov. 2025. https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/

[2] DigitalOcean, "Kubernetes pricing." https://www.digitalocean.com/pricing/kubernetes

[3] Socket.IO, "Using multiple nodes," Socket.IO v4 documentation. https://socket.io/docs/v4/using-multiple-nodes

[4] ECE1779 lecture slides, Lecture 3: DigitalOcean Volumes and Snapshots, slides 12–18, Fall 2026.

[5] ECE1779 lecture slides, Lecture 4: Docker Volumes, slides 90–94, Fall 2026.

[6] ECE1779 lecture slides, Lecture 5: Docker Secrets and Healthchecks, slides 28–51, Fall 2026.

[7] ECE1779 lecture slides, Lecture 2: IaaS Resources, block and object storage, slides 23–27; Why DigitalOcean and the DigitalOcean ecosystem, slides 42–45, Fall 2026.

[8] ECE1779 lecture slides, Lecture 7: Deployment Strategies, slide 16; Kubernetes core concepts, desired versus observed state and Services routing to ready Pods, slides 29–31, 59, 79 and 105, Fall 2026.

[9] ECE1779 lecture slides, Lecture 6: From VMs to managed deployment and Swarm rolling updates, slides 38 and 44–45, Fall 2026.

[10] ECE1779 lecture slides, Lecture 1: Project requirements, slide 14, Fall 2026.

[11] Google, "Share files from Google Drive," Google Drive Help. https://support.google.com/drive/answer/2494822

[12] ECE1779 course project handout, "Deployment Provider" and "Note on Orchestration on Fly.io," Fall 2026. https://www.eecg.utoronto.ca/~cying/courses/ece1779-cloud/project/handout/

[13] DigitalOcean, "Droplet pricing." https://www.digitalocean.com/pricing/droplets

[14] DigitalOcean, "Spaces object storage pricing." https://www.digitalocean.com/pricing/spaces-object-storage
