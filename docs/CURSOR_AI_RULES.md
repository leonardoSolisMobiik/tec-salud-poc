# Mobiik Unified Engineering Rules – TecSalud Project
## Angular + Bamboo + FastAPI + Azure OpenAI

**Version:** 2.0  
**Project:** TecSalud Medical Assistant  
**Last Updated:** 2025-01-07  
**Applied to:** Angular 19 + Bamboo Design System + FastAPI + Azure OpenAI

---

# 1 Global Principles
1. **Repository reconnaissance** – inspect project tree before creating or modifying files; prefer refactor over rewrite.  
2. **No code duplication** – search for existing implementations before adding new ones.  
3. **Ephemeral test artifacts** – write to `/tmp` or suffix `.tmp`; delete prior to commit.  
4. **Clarify ambiguity** – when business or technical context is missing, pause and ask.  
5. **Atomic commits** – one logical change per commit; descriptive message with ticket reference.  
6. **Security & compliance first** – default-deny CORS, enforce linting, pin dependencies, scan for secrets.  
7. **Follow Cursor agent etiquette** – explain risky actions (_"⚠️ About to rename 15 files"_); never auto-commit large codemods without user confirmation.

# 2 Backend (FastAPI)
- Async endpoints by default; off-load CPU-bound tasks with background workers or `async_to_sync`.  
- Project layout: `app/<domain>/{routers,models,schemas,services}`.  
- Pydantic models: full type hints, field aliasing, `Config` with `orm_mode=True`.  
- Linters & formatters: **ruff**, **black**; CI fails on warning.  
- Production: `uvicorn --workers=$((CPU*2+1)) --http-keep-alive-timeout 5`.  
- Security: JWT or Entra ID auth, role-based routers, sanitise user input.  
- Documentation: `summary`, `description`, `tags`, `response_model` with examples.

# 3 Frontend (Angular + Bamboo)
- Bundle ≤ 250 kB initial; vendor chunk separated via `angular.json` optimization settings.  
- Code-splitting: **Lazy loading** with `loadChildren`, route-level dynamic imports via `import()`.  
- Pre-fetch critical modules with **Angular Router** preloading strategies.  
- UI stack: **Bamboo Design System** (`@ti-tecnologico-de-monterrey-oficial/ds-ng`) + **Angular Material** fallbacks.  
- Each component exports typed interfaces, has **Jasmine/Karma** unit tests and **Cypress** E2E tests.  
- Accessibility: **WCAG 2.1 AA**, proper ARIA roles, Angular CDK a11y; i18n via **Angular i18n**.  
- Security: sanitise HTML with **DOMSanitizer**; CSP headers recommended.  
- **Bamboo compliance**: Use Bamboo tokens for colors, spacing, typography; extend only when necessary.  
- **Responsive design**: Follow Bamboo breakpoints (sm: 768px, md: 1024px, lg: 1280px, xl: 1536px).  
- **State management**: Angular Services + RxJS; avoid NgRx unless complex state required.

# 4 AI Agents (LLM / RAG)
- Architecture: ReAct w/ tool invocations; maintain reasoning trace in logs.  
- Prompt hygiene: prefix user content with delimiters, strip secrets.  
- Retry & guardrails: exponential back-off, token budget < 16 k, JSON schema validation.  
- Maintain embeddings index in **ChromaDB**; use **Azure OpenAI** text-embedding-3-large.  
- **Medical context**: Maintain patient context across chat sessions; implement streaming with SSE.

# 5 Benchmarks & Quality Gates
| Layer / Component | Metric | Target |
|-------------------|--------|--------|
| **FastAPI** | P95 latency @ 1 k RPS | < 200 ms |
| | Error rate | < 0.1 % |
| **Angular + Bamboo** | Lighthouse Performance | ≥ 90 |
| | First Contentful Paint (3 G) | < 1.5 s |
| | Bundle size (initial) | ≤ 250 kB |
| **AI Agents** | CLASSic* score | ≥ 0.8 |
| | τ-Bench success rate | ≥ 75 % |
| **Medical Features** | Chat response time | < 3 s |
| | Document processing | < 5 s per file |

\*Cost, Latency, Accuracy, Security, Stability.

**Tooling**
- API load: **Locust** (`locustfile.py`, headless).  
- Web: **Lighthouse CI** (`.lighthouserc.json`).  
- Angular: **ng build --stats-json** + **webpack-bundle-analyzer**.  
- LLM: **lc_bench** or equivalent harness.

**Pipeline**
1. Deploy branch to isolated **staging**.  
2. Run suites; generate report in `/reports/perf/YYYY-MM-DD.md`.  
3. Fail CI if any target unmet.

# 6 Safeguards & Agent Prompts
- Before deleting/renaming > 5 files, request explicit approval.  
- If introducing new dependencies or breaking changes, emit **BREAKING CHANGE** note in commit.  
- Never commit `.env` or credentials; use Azure Key Vault or GitHub Secrets.  
- **Medical compliance**: Ensure HIPAA compliance for all patient data handling.  
- On ambiguity, reply in chat:  
  > _"Need clarification on X to proceed safely. Please advise."_

# 7 Cursor-Specific Directives
- Keep rule file < 500 lines; split if larger.  
- Use **globs** in future rule fragments to auto-attach by path (`backend/**`, `frontend-angular/**`).  
- Mark optional rule blocks with HTML comments `<!-- @optional:benchmarks -->` so the agent can exclude when context window is tight.

# 8 Change Management
- Review rules after each major feature; update sections instead of adding duplicates.  
- Version rules with the code; tag releases when benchmarks thresholds change.  
- Run **retro sessions** to refine principles and capture new best practices.

---

## 🏥 TecSalud-Specific Rules

# 9 Medical Domain Rules
- **Patient data security**: All patient information must be encrypted at rest and in transit.  
- **Audit logging**: Log all medical consultations and document access for compliance.  
- **Error handling**: Medical features must have graceful degradation; never expose raw errors to users.  
- **Context management**: Maintain patient context across sessions; clear context on patient switch.

# 10 Angular + Bamboo Best Practices
- **Component structure**: Follow Angular style guide; use OnPush change detection where possible.  
- **Bamboo integration**: Import only required Bamboo components to minimize bundle size.  
- **Medical icons**: Use custom medical icons from `shared/components/icons/MedicalIcons.jsx` (migrate to Angular).  
- **Responsive behavior**: Test on tablet (768px+) as primary medical device form factor.  
- **Lazy loading**: Implement lazy loading for all feature modules (dashboard, chat, admin, etc.).

# 11 FastAPI + Medical AI Rules
- **Streaming responses**: Use SSE for real-time AI chat responses.  
- **Context injection**: Include patient context and relevant documents in AI prompts.  
- **Rate limiting**: Implement per-user rate limiting for AI endpoints.  
- **Fallback handling**: Implement fallbacks when Azure OpenAI is unavailable.  
- **Token management**: Monitor and optimize token usage for cost efficiency.

---

**Note**: These rules are specifically adapted for the TecSalud medical assistant project using Angular 19 + Bamboo Design System architecture. 