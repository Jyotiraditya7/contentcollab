# ContentCollab: project proposal

ECE1779 Introduction to Cloud Computing, Fall 2026.

Team: Nabeegh Khan (1001388152), Milton Wang (1009114192), Jyotiraditya Kale (1013397370), Yiqing Liu (1008052580).

## 1. Motivation

**Sharing a PDF is easy. Sharing the thinking behind it shouldn’t be hard.** Imagine a study group reviewing the same research paper: one student highlights a passage on their own copy, another asks a question in a group chat, and a third emails an annotated version. The document is shared, but the conversation is fragmented. Our proposed platform brings PDF annotations and discussions into one shared space, keeping feedback connected to the passages it refers to. Instead of piecing together separate notes and messages, users can review the document together and build a shared understanding.

Therefore, we aim to construct a stateful, cloud-native content review platform. A user uploads a document or a PDF and shares it with named collaborators or by a scoped link. The collaborators comment and annotate on it. Updates appear live for everyone viewing the same version. We primarily address groups with a strong demand for concurrent document interaction and co-viewing. Our target users center on remote professionals, lab and industry teams, clients and contractors navigating legal terms or architectural designs, and any organization engaged in global collaboration. Additionally, we intend to bring this collaborative approach into academic environments, fostering deeper engagement between students and educators to enrich the learning process.

While some literature argues that document review workflows are costly, contested, and inefficient [15], this limitation stems from existing tools' technical compromises rather than the concept itself. Critical technical gaps persist in native PDF workflows precisely because previous platforms failed to bridge smooth document interaction with robust architecture. Current office suites and canvas tools (e.g. Google Workspace, OneNote, Figma) either force conversion to editable formats or flatten PDFs into static images, creating a poor multi-page reading experience due to the complex engineering required for dynamic coordinate mapping, scaling, OCR, and font rendering. Meanwhile, alternative tools force difficult trade-offs: branch-based platforms (e.g. GitHub) conflict with intuitive review workflows, while handwriting-focused apps (e.g. GoodNotes 6) deliver subpar web experiences. Finally, while recent artificial intelligence (AI) and PDF entrants (e.g. Adobe PDF Space, ChatPDF, Notion AI) offer collaboration, their centralized cloud infrastructure incurs steep subscription costs and raises major data privacy concerns for enterprise users. Our platform directly targets these architectural bottlenecks to make native, seamless PDF collaboration viable and privacy-preserving.

## 2. Objectives, architecture and key features

### 2.1 Objectives

ContentCollab is a place where people share files and discuss them in place. Files, versions and comments stay together instead of scattering across email, chat and file copies.

Anyone can sign up, upload a document and share it with people as Owner, Editor, Commenter or Viewer, the roles Google Drive uses [11]; a link with an expiry admits people without an account. Everyone viewing a version sees new comments and pins (notes attached to a spot on the page) without refreshing. Each upload is a version, and any version can be restored.

The cloud objective is resilience: an API pod can crash, the database can move to another node, or a release can roll out, and no user loses a comment.

### 2.2 Architecture

![Component diagram: browser, Gateway, web, api and worker, PostgreSQL and Redis, Spaces, GitHub Actions and monitoring](https://raw.githubusercontent.com/nabeegh-khan/contentcollab/main/docs/img/architecture.png)

*Figure 1. Components and their connections. Solid lines carry application traffic; dashed lines are configuration, deployment and monitoring.*

A small React web app calls a JSON API through one Gateway, which terminates HTTPS for `contentcollab.app`; it exists because live comments in two browsers cannot be shown with curl. Files live in DigitalOcean Spaces, object storage reachable from every replica over HTTP; users, documents, shares, versions and comments live in PostgreSQL on block storage [7].

### 2.3 Key design decisions

| Decision | Reason | Trade-off |
|---|---|---|
| Slow work runs in a worker on a Redis queue | A large file cannot exhaust the API's memory or block other users | One more service, same health checks as the API |
| Socket.IO with sticky sessions and the Redis adapter | Without affinity the long-polling fallback breaks across replicas; the adapter relays events between pods [3] | Needs affinity at the Gateway; WebSocket-only is the fallback |
| Gateway API, not ingress-nginx | ingress-nginx was retired in March 2026 [1] | New objects to configure |
| One PostgreSQL instance on a volume; files in Spaces | A volume attaches to one node; a file on one pod's disk is invisible to the others [4], [5], [7] | No database failover; the restart test is rehearsed |
| Two small nodes | About US$54 a month shared by four: two US$18 nodes, a US$12 load balancer and US$5 for Spaces [2], [13], [14] | Little headroom; load tests run before the demo |

### 2.4 Failure handling

API pods hold no state, so any pod can be killed or added without losing data. Each service is its own container with its own health check and is deployed on its own, so a failure degrades one capability rather than the system: without Redis, comments still save and live updates fall back to polling; without the worker, uploads still succeed; without PostgreSQL, the readiness probe fails and the Service stops routing to that pod [8]. New capabilities are added behind the existing API contract, not as changes to it.

| Risk | How we handle it |
|---|---|
| Race conditions | Optimistic locking: a write based on an older row version is rejected with 409; transactions and unique constraints prevent partial or duplicate rows |
| Retries | Uploads and jobs carry an idempotency key; timeouts and retries with backoff on every call; reconnecting clients fetch events after their last sequence number |
| Memory | Uploads stream to Spaces; every container has requests and limits |
| Silent failure | Alerts on 5xx rate, latency, pod restarts, queue depth and disk |
| Drift | Pinned base images and lockfile installs; the image tested in CI is the one deployed, after a migration Job |

### 2.5 How the required technologies are used

| Requirement [10] | Our use |
|---|---|
| Docker and Docker Compose | One container per service; one Compose file runs the stack locally with health checks (API, PostgreSQL and Redis run since 25 October) [6] |
| PostgreSQL | Users, documents, shares with their roles, versions and comments, linked by foreign keys and changed inside transactions |
| Persistent storage | A persistent volume backed by a DigitalOcean Volume; the demonstration deletes the database pod and shows the data survives |
| Orchestration | DigitalOcean Kubernetes: Deployments, Services, a StatefulSet for PostgreSQL, a HorizontalPodAutoscaler for the API, each a manifest the cluster keeps converged to its desired state [8]; manifests tested on minikube first, Swarm as the fallback if the cluster is unstable on 14 November [9] |
| Deployment provider | DigitalOcean, the course's IaaS provider [7]; Fly.io's Kubernetes service is a paid beta the course does not recommend [12] |
| Monitoring | DigitalOcean alerts on CPU, memory and disk; request counts, errors and latency at `/metrics`; Datadog for dashboards and container logs |

### 2.6 Core features

- **Upload and preview.** PDFs and images render in the browser; other types, Office files included, are stored, versioned and downloadable.
- **Sharing and roles.** Share with a user by email or by a link with an expiry; Owner, Editor, Commenter and Viewer checked by one middleware before every action.
- **Comments.** Threads, pins on a page position, @-mentions, live for everyone viewing the version.
- **Versions.** Every upload is a version; any version can be restored.

### 2.7 Advanced features

We commit to two:

1. **Security.** bcrypt password hashes, JWT sessions, role checks on every route, expiring share links, HTTPS at the Gateway, credentials in Kubernetes Secrets rather than images or the repository [6].
2. **CI/CD.** GitHub Actions has checked lint, formatting and types on every pull request since 28 October; tests against a PostgreSQL service container join as features land; a merge to `main` builds the images, pushes them to the GitHub Container Registry and rolls them out one pod at a time [8].

One planned extension, reported as finished only if it is: **autoscaling and high availability**, more API replicas under load, readiness probes, and a rolling update with no dropped requests.

### 2.8 Scope and feasibility

Live co-editing of text is out of scope: it needs a conflict-resolution engine and an editor, a separate product. We deploy before we build features, so deployment problems surface early; each feature ships with tests, so a change that breaks another member's part fails in CI; and the team uses the deployed system as each piece lands. The cluster runs by 14 November; features on the demo path freeze on 21 November, leaving the days before the 25 November presentation for load tests and two rehearsals. Each part has a named owner (section 3).

## 3. Project plan and team responsibilities

For this project, we will divide it into multiple parts, with each person's scope showing their own commits, Issues, and pull requests on GitHub. Eyrika will work on the backend API, tags, and email notifications. Jyotiraditya will work on the backend live updates and with Eyrika on the API. Milton will work on the front end, backups, and API documentation. Nabeegh will work on the cloud orchestration and CI/CD pipeline. 

We will integrate the components through weekly milestones, where we first work on the schema and API contract before building features against them. The schema, authentication, documents and shares are the critical path. Real-time and the frontend build on them, so they merge first, one pull request at a time. The 14 November checkpoint is measured against them. 

To maintain code quality, prevent integration bottlenecks, and avoid needing to resolve problems at the last minute, we will follow a weekly testing cadence. We will also use the WhatsApp group chat and during weekly group meetings (Saturday, 3:30 p.m) for quick check-ins and GitHub Issues and pull requests to resolve technical problems. We will use the Issues on the GitHub repository and assign reviewers for each other’s work to verify functionality. Code changes require one review while reports and documentation will be reviewed by all four of us, requiring one approval to merge. The skeleton was completed on November 1. We will work on the core features and cloud in parallel until November 14, the real-time and additional features on November 9-20, with checkpoints on November 14 and 20. We will end work on features on the demonstration path on November 21 and do load tests and two rehearsals before the presentation, on November 21-24.   

We are also aware that unexpected issues may arise. These include a feature or stage slipping, a late feature, pod or volume losses, or issues with deployment. If the cluster is down during the presentation, the demonstration will run from the local Compose stack with the same data. We will exclude additional features that do not work from the demonstration, have those who are ahead take up work on open issues, and use the pg_dump backup to prevent volume loss.

## 4. Initial team reasoning and AI-assisted exploration

Owner: Jyotiraditya Kale. Initial understanding (10 October notes), technical hypotheses, open questions, how the thinking changed, one AI interaction with its evaluation, how the final proposal differs from the initial thinking.

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
