# ContentCollab: project proposal

ECE1779 Introduction to Cloud Computing, Fall 2026.

Team: Nabeegh Khan (1001388152), Milton Wang (1009114192), Jyotiraditya Kale (1013397370), Yiqing Liu (1008052580).

## 1. Motivation

**Sharing a PDF is easy. Sharing the thinking behind it shouldn’t be hard.** Imagine a lab team reviewing the same research paper: one member highlights a passage on their own copy, another asks a question in a group chat, and a third emails an annotated version. The document is shared, but the conversation is fragmented. Our platform brings annotations and discussion into one shared space, keeping feedback connected to the passages it refers to.

We therefore aim to build a stateful, cloud-native content review platform. A user uploads a PDF, image or other document and shares it with named collaborators or by a scoped link. The collaborators comment and annotate on it, and updates appear live for everyone viewing the same version. Our target users are remote professionals, lab and industry teams, and clients and contractors reviewing legal terms or architectural designs; study groups and courses fit the same workflow. Because reviewers work from different places and at different times, the service must stay available, and live updates must survive pod restarts and new releases, which makes it a cloud problem rather than a desktop one.

Live co-editing needs complex concurrency control, so we focus on review. Existing tools cover parts of this loop. Office suites (e.g. Google Workspace) convert a PDF into an editable document and lose its layout, while branch-based platforms (e.g. GitHub) review text line by line, not positions on a page. The closest tools are Acrobat's shared review, where several people comment on a PDF at the same time and see feedback as it happens [15], and Hypothesis, social annotation of web pages and PDFs built for higher education [16]. Both are services run by their vendors. ContentCollab runs the same review loop as a deployment our team controls and observes on managed cloud infrastructure, with versioned files, role-scoped sharing and comments pinned to a page position.

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

Each member's scope is visible in their own GitHub commits, Issues and pull requests. Eyrika: the backend API, including authentication and roles, tags and email notifications. Jyotiraditya: comments and live updates, and the API with Eyrika. Milton: the frontend, backups and API documentation. Nabeegh: cloud orchestration, CI/CD, monitoring and autoscaling.

We first agree the schema and API contract, then build features against them. The schema, authentication, documents and shares are the critical path, and merge first, one pull request at a time; real-time and the frontend build on them. The skeleton stage ran to 1 November and closes with the schema (#37). Core features and the cloud are built in parallel until the 14 November checkpoint, real-time and additional features from 9 to 20 November. Demonstration-path features freeze on 21 November; load tests and two rehearsals follow.

Every pull request runs lint and type checks in CI, and Jest and Supertest tests once #71 merges. Code changes need one review; proposal and report sections are reviewed by all four, and one approval merges; minutes and other documentation go straight to `main`. We coordinate on WhatsApp and at Saturday meetings (3:30 p.m.); technical problems are resolved in Issues and pull requests.

Risks: a stage slipping, pod or volume loss, deployment problems, and the DigitalOcean cost, shared four ways. Features that do not work are left out of the demonstration; members who are ahead take open Issues. A nightly pg_dump backup restores data after a volume loss. If the cluster or an external service fails during the presentation, Nabeegh switches the demonstration to the local Docker Compose stack on the presenting laptop, seeded with the same data and rehearsed; Milton keeps presenting the frontend, and Eyrika and Jyotiraditya continue on the local stack.

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

[15] Adobe, "Share PDF files for review," Adobe Acrobat, checked 6 Nov. 2026. https://www.adobe.com/acrobat/features/share-and-review-pdfs.html

[16] Hypothesis, "The #1 Social Annotation Tool for Higher Education," checked 6 Nov. 2026. https://web.hypothes.is/
