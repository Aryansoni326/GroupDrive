# GroupDrive – Infrastructure & Deployment Strategy

**Document Version:** 1.0.0  
**Status:** Approved Infrastructure Baseline  
**Classification:** Confidential & Proprietary – GroupDrive Technologies  
**Target Topology:** Multi-Frontend Independent Deployments + Central Modular Monolith Backend  
**Hosting Architecture:** Cost-Conscious Hybrid Cloud (Containerized Docker / Cloudflare / Managed PostgreSQL)  
**Date:** November 2026  

---

## 1. Deployment Architecture Overview

GroupDrive enforces **independent deployability** across its three frontend client applications and the backend modular monolith. Updating one frontend application (e.g., DealerOS) does not trigger rebuilds or downtime for the Main Website or Admin Panel.

```mermaid
graph TD
    subgraph "Edge Network (Cloudflare)"
        DNS[Cloudflare DNS & SSL]
        WAF[Cloudflare WAF & DDoS Shield]
        EDGE_CACHE[Edge Media & Asset Cache]
    end

    subgraph "Application Hosting Tier"
        FE1[App 1: Main Website<br/>groupdrive.in<br/>Next.js Node/Standalone]
        FE2[App 2: DealerOS<br/>dealer.groupdrive.in<br/>Next.js Node/Standalone]
        FE3[App 3: Admin Panel<br/>admin.groupdrive.in<br/>Next.js Node/Standalone]
        BE[Core Backend API<br/>api.groupdrive.in<br/>FastAPI / Uvicorn (3 Replicas)]
        CEL[Celery Worker & Beat<br/>Background Processing]
    end

    subgraph "Data & Storage Tier"
        PG_PRI[(PostgreSQL 16 Primary)]
        REDIS[(Redis 7 Cluster / Standalone)]
        R2[("Cloudflare R2 / AWS S3<br/>Vehicle Media & KYC Docs")]
    end

    DNS --> WAF
    WAF --> EDGE_CACHE
    WAF --> FE1
    WAF --> FE2
    WAF --> FE3
    WAF --> BE

    FE1 --> BE
    FE2 --> BE
    FE3 --> BE

    BE --> PG_PRI
    BE --> REDIS
    BE --> R2
    CEL --> REDIS
    CEL --> PG_PRI
```

---

## 2. Cost-Conscious Initial Infrastructure Strategy

Rather than incurring heavy hyperscaler overhead ($> \$1,500/\text{mo}$) prematurely, GroupDrive employs a **Lean, Production-Grade Phase 1 Deployment Model** costing under $\$120/\text{mo}$ while maintaining high availability and enterprise security.

| Component | Initial Infrastructure (MVP - 0 to 50k MAU) | Scaled Infrastructure (> 100k MAU) |
|---|---|---|
| **Edge & CDN** | Cloudflare Free / Pro Tier ($20/mo) | Cloudflare Enterprise + Advanced WAF |
| **Frontend Apps** | Dockerized Next.js containers on Cloud VPS or Vercel Pro | AWS ECS Fargate / EKS behind ALB |
| **Backend API** | Dockerized FastAPI on dedicated VPS (8 vCPU, 16GB RAM - Hetzner / DigitalOcean: $40/mo) | AWS ECS Multi-AZ Autoscaling Cluster |
| **Database** | Managed PostgreSQL 16 (DigitalOcean / Aiven: $35/mo) | AWS Aurora PostgreSQL Multi-AZ with Read Replicas |
| **Caching / Queue** | Redis 7 Managed ($15/mo) | AWS ElastiCache Redis Cluster |
| **Object Storage** | Cloudflare R2 (Zero egress bandwidth fees, $5/mo) | Cloudflare R2 + Multi-region S3 replication |

---

## 3. Environment Strategy & Variable Configuration

GroupDrive maintains three completely isolated environments:
1. **Local Development (`local`):** Docker Compose local containers, hot reloading, mock SMS gateways.
2. **Staging / UAT (`staging`):** Dedicated staging domain (`staging.groupdrive.in`), automated CI/CD deployment, anonymized data fixtures.
3. **Production (`production`):** Multi-AZ deployment, strict secret rotation, live SMS/WhatsApp gateways, Google Gemini Production API.

### 3.1 Master Environment Variables Registry

#### Backend Configuration (`apps/backend/.env`)
```bash
# Environment & Server
ENVIRONMENT=production
DEBUG=false
API_V1_PREFIX=/api/v1
SECRET_KEY=generate-secure-64-character-hex-key
ALLOWED_HOSTS=["api.groupdrive.in"]
CORS_ORIGINS=["https://groupdrive.in","https://dealer.groupdrive.in","https://admin.groupdrive.in"]

# Database & Migrations
DATABASE_URL=postgresql+asyncpg://gd_admin:StrongPassword@postgres.internal:5432/groupdrive_prod
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis & Celery
REDIS_URL=redis://:StrongRedisPass@redis.internal:6379/0
CELERY_BROKER_URL=redis://:StrongRedisPass@redis.internal:6379/1
CELERY_RESULT_BACKEND=redis://:StrongRedisPass@redis.internal:6379/2

# AI Services
GEMINI_API_KEY=AIzaSy...your-production-google-gemini-key
GEMINI_MODEL_VERSION=gemini-1.5-flash

# Storage & CDN (Cloudflare R2 / S3)
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=r2-access-key
STORAGE_SECRET_ACCESS_KEY=r2-secret-key
STORAGE_PUBLIC_BUCKET_NAME=groupdrive-media-prod
STORAGE_PRIVATE_BUCKET_NAME=groupdrive-docs-prod
CDN_BASE_URL=https://cdn.groupdrive.in

# SMS & WhatsApp Gateway (DLT India Compliant)
SMS_GATEWAY_PROVIDER=gupshup
SMS_GATEWAY_API_KEY=gupshup-api-key
SMS_DLT_ENTITY_ID=1101234567890
SMS_DLT_SENDER_ID=GRPDRV
WHATSAPP_API_TOKEN=wa-cloud-api-token

# Email Gateway
POSTMARK_SERVER_TOKEN=postmark-server-token
DEFAULT_FROM_EMAIL=notifications@groupdrive.in
```

#### Frontend Configurations (`apps/web/.env.production`, `apps/dealer/.env.production`, `apps/admin/.env.production`)
```bash
# apps/web (Main Website)
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_URL=https://api.groupdrive.in/api/v1
NEXT_PUBLIC_CDN_URL=https://cdn.groupdrive.in
NEXT_PUBLIC_ROOT_DOMAIN=groupdrive.in

# apps/dealer (DealerOS)
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_URL=https://api.groupdrive.in/api/v1
NEXT_PUBLIC_CDN_URL=https://cdn.groupdrive.in
NEXT_PUBLIC_ROOT_DOMAIN=groupdrive.in

# apps/admin (Admin Panel)
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_URL=https://api.groupdrive.in/api/v1
NEXT_PUBLIC_CDN_URL=https://cdn.groupdrive.in
NEXT_PUBLIC_ROOT_DOMAIN=groupdrive.in
```

---

## 4. Local Development Orchestration

A single command boots the entire development topology:

```bash
# 1. Clone repository & install dependencies
git clone https://github.com/groupdrive/groupdrive.git
cd groupdrive
pnpm install

# 2. Boot infrastructure containers (PostgreSQL, Redis, MinIO)
docker compose -f docker/docker-compose.dev.yml up -d

# 3. Run database migrations & seed test vehicle catalogue
cd apps/backend
poetry run alembic upgrade head
poetry run python -m scripts.seed_master_catalogue

# 4. Start all applications concurrently via Turborepo
cd ../..
pnpm dev
```

*Port Allocations:*
- `apps/web`: `http://localhost:3000`
- `apps/dealer`: `http://localhost:3001`
- `apps/admin`: `http://localhost:3002`
- `apps/backend`: `http://localhost:8000` (Swagger UI at `/docs`)
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO S3 Console: `http://localhost:9001`

---

## 5. Continuous Integration & Continuous Deployment (CI/CD)

The GitHub Actions workflow enforces automated quality gates and builds immutable Docker containers:

```mermaid
flowchart TD
    Push[Code Pushed to Main Branch] --> Lint[1. Lint & Format Check: ruff, eslint, tsc]
    Lint --> TestBE[2a. Pytest Backend Suite with Docker DB]
    Lint --> TestFE[2b. Vitest Frontend Suites]
    TestBE --> Build[3. Build Docker Images with Tag = Git SHA]
    TestFE --> Build
    Build --> DeployStg[4. Deploy to Staging Cluster]
    DeployStg --> E2E[5. Playwright E2E Regression on Staging]
    E2E --> Gate{Manual Prod Approval?}
    Gate -- Approved --> Migration[6. Run Alembic DB Migration on Prod]
    Migration --> Rollout[7. Zero-Downtime Rolling Update on Production]
    Rollout --> Smoke[8. Post-Deploy Automated Healthcheck]
```

---

## 6. Zero-Downtime Database Migration Protocol

To avoid table locks and application downtime during releases:
1. **Backward-Compatible DDL Only:** Never drop columns or rename tables in the same release as code changes.
2. **Migration Step in CI/CD:** Alembic migrations run from an ephemeral container *before* new application pods are scaled up.
3. **Connection Draining:** Old pods cleanly drain existing HTTP requests before terminating.

---

## 7. Backup, Disaster Recovery & Rollback Protocols

### 7.1 Backup Strategy
- **Continuous WAL Archiving:** PostgreSQL Write-Ahead Logs streamed continuously to Cloudflare R2 bucket with 30-day retention.
- **Daily Automated Full Snapshots:** Taken at 02:00 AM IST (low-traffic window) and replicated across independent cloud regions.
- **Disaster Recovery Targets:** Recovery Point Objective (RPO) $< 15\text{ minutes}$; Recovery Time Objective (RTO) $< 2\text{ hours}$.

### 7.2 Rollback Procedure
If a production deployment encounters critical failures during healthchecks:
1. **Frontend Rollback:** Instant DNS/Load-balancer traffic shift to the previous stable Docker image tag (execution time: $< 30\text{ seconds}$).
2. **Backend Rollback:** Revert deployment image to prior Git SHA.
3. **Database Rollback:** If a forward migration cannot be rolled back safely, restore from the pre-deployment snapshot using point-in-time recovery (PITR).

