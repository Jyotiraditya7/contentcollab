# ContentCollab: project proposal

ECE1779 Introduction to Cloud Computing, Fall 2026. Due Saturday 7 November 2026, 11:59pm. One Markdown file, at most 2,000 words. Drafted in the shared Google Doc; each section's owner moves the settled text here.

Team: Nabeegh Khan (1001388152), Milton Wang (1009114192), Jyotiraditya Kale (1013397370), Yiqing Liu (1008052580).

## 1. Motivation

Owner: Eyrika. Problem, intended users, why it is worth addressing, limitations of existing approaches.

## 2. Objectives, architecture and key features

Owner: Nabeegh. From `ARCHITECTURE.md`: objectives and core functionality, the architecture, how each required technology is used, the advanced features, scope and feasibility.

## 3. Project plan and team responsibilities

For this project, we will divide it into multiple parts, with each person owning a slice showing their own commits, Issues, and pull requests on Github. Eyrika will work on the API, tags, and email notifications. Jyotiraditya will work on the live updates and with Eyrika on the API. Milton will work on the front end, backups, and API documentation. Nabeegh will work on the cloud orchestration and CI/CD pipeline. 

We will integrate the components through weekly milestones, where we first work on the schema and API contract before building features against them. 

To avoid leaving things to the last minute, we will regularly develop and test the application when we have time. We will also coordinate, check in, and ask for help through the WhatsApp group chat and during weekly group meetings (Saturday, 3:30 p.m). We will use the Issues on the Github repository and assign reviewers for each other’s work to verify functionality. Code changes require one review while reports and documentation will be reviewed by all four of us, requiring one approval to merge. We will first work on the skeleton until November 1, then the core features and cloud in parallel until November 14, the real-time and additional features on November 9-20, with checkpoints on November 14 and 20. We will end work on features on the demonstration path on November 21 and do load tests and two rehearsals before the presentation, on November 21-24.   

We are also aware that unexpected issues may arise. These include a feature or stage slipping, a late feature, pod or volume losses, or issues with deployment. If the cluster is down during the presentation, the demonstration will run from the local Compose stack with the same data. We will exclude additional features that do not work from the demonstration, have those who are ahead take up work on open issues, and use the pg_dump backup to prevent volume loss.

## 4. Initial team reasoning and AI-assisted exploration

Owner: Jyotiraditya. Initial understanding (10 October notes), technical hypotheses, open questions, how the thinking changed, one AI interaction with its evaluation, how the final proposal differs from the initial thinking.
