# Branders AI — Progreso

Estado y pendientes por sesión. Actualizar al cierre de cada sesión (es el contexto de
arranque de la siguiente).

## Estado actual
**Fase:** preparación (pre-Sesión 0).

### Hecho
- Tooling de Claude Code configurado:
  - Agentes (`.claude/agents/`): pipeline-engineer, payments-engineer, supabase-architect,
    frontend-craftsman, qa-auditor.
  - Skills (`.claude/skills/`): fal-ai-pipeline, stripe-one-time, sharp-image-processing
    (+ global nextjs-supabase).
  - CLAUDE.md creado (Basic $19).
  - Specs copiados a `docs/spec.md` y `docs/plan.md`.

### Pendiente para arrancar la Sesión 0 (ver plan §8)
- [ ] Cuenta fal.ai + $10 de créditos
- [ ] API key de Anthropic (Claude API)
- [ ] Cuenta Stripe (modo test)
- [ ] Proyecto Supabase creado
- [ ] Verificar/comprar dominio branders.ai
- [ ] `git init` + primer commit (el repo aún no está inicializado)
- [ ] Configurar MCPs de prioridad alta: Supabase, Stripe

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
