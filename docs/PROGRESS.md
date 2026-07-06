# Branders AI — Progreso

Estado y pendientes por sesión. Actualizar al cierre de cada sesión (es el contexto de
arranque de la siguiente).

## Estado actual
**Fase:** andamiaje listo. Sesión 0 ejecutable en cuanto haya claves fal.ai + Anthropic.

### Hecho
- Tooling de Claude Code configurado:
  - Agentes (`.claude/agents/`): pipeline-engineer, payments-engineer, supabase-architect,
    frontend-craftsman, qa-auditor.
  - Skills (`.claude/skills/`): fal-ai-pipeline, stripe-one-time, sharp-image-processing
    (+ global nextjs-supabase).
  - CLAUDE.md creado (Basic $19).
  - Specs copiados a `docs/spec.md` y `docs/plan.md` (spec corregido a $19).
- Repo git inicializado y pusheado a github.com/kayaosv/BrandersAI.
- `.env.example` documentado; `.env.local` con claves Stripe test (NO en repo).
- Plugin oficial de Stripe instalado (skills + MCP para Sesión 4).
- **Andamiaje Sprint 0 listo** (Sesión 0):
  - `package.json` con SDKs (@anthropic-ai/sdk, @fal-ai/client) instalados.
  - `scripts/pipeline.js` (brief + Ideogram + Recraft + retry/backoff + coste).
  - `scripts/test-cases.js` (10 empresas ficticias, 5 marcadas para SVG).
  - `scripts/validate-pipeline.js` — corre con `npm run validate`.
  - `docs/sprint0-results.md` — plantilla del veredicto §7.3.

### Pendiente para arrancar la Sesión 0
- [ ] Cuenta fal.ai + $10 de créditos → `FAL_KEY` en `.env.local`
- [ ] API key de Anthropic → `ANTHROPIC_API_KEY` en `.env.local`
- [ ] Luego: `npm run validate` y evaluar `sprint0-output/`

### Pendiente más adelante
- [ ] Proyecto Supabase + MCP (aplazado a próxima sesión)
- [ ] Verificar/comprar dominio branders.ai
- [ ] Confirmar slugs reales de fal.ai (Ideogram/Recraft) durante la corrida Sprint 0

### Decisiones tomadas
- Basic = **$19** (no $29; spec desactualizado). Complete = $49.
- SVG (Recraft) solo post-pago, nunca en preview.
- Ensamblaje post-pago en Vercel con `maxDuration: 300` (plan Pro).

### Decisiones pendientes (a resolver con datos en Sesión 0)
- Slugs/params reales de fal.ai (Ideogram / Recraft) — confirmar contra docs en vivo.
- SVG como "réplica" vs "vector edition" (§7.3 del spec) — decidir tras Sprint 0.

## Log por sesión
_(rellenar al cierre de cada sesión: qué se hizo, qué quedó pendiente, qué verificar)_

### Sesión 0 — Validación técnica
- Estado: no iniciada.
