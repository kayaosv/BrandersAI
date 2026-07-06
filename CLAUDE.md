# Branders AI

AI-powered Startup Launch Kit Generator. Pago único **Basic $19 / Complete $49**.
"Launch your brand in 2 minutes. Not just a logo — everything you need to launch."

## Documentos de referencia (cargar solo la sección que toque la sesión)
- `docs/spec.md` — spec funcional completo (producto, pipeline, DB, prompts, API).
- `docs/plan.md` — plan de ejecución por sesiones (objetivos, agentes, skills, MCPs).
- `docs/PROGRESS.md` — estado y pendientes; primera cosa a leer al arrancar una sesión.
No cargues los specs enteros: referencia `docs/spec.md §X`.

## Stack
- Next.js App Router, JSX (NO TypeScript salvo tipos generados de Supabase)
- Tailwind CSS
- Supabase (DB + Storage, RLS habilitado, acceso vía service role solo en Route Handlers)
- Stripe Checkout (payment mode, no subscriptions)
- fal.ai SDK: Ideogram (previews PNG) + Recraft (SVG post-pago) — slugs a confirmar en Sesión 0
- Claude API (Haiku) para creative briefs
- Sharp para procesamiento de imagen, @react-pdf/renderer para PDF
- Resend para emails · Vercel hosting

## Convenciones
- Route Handlers en `/app/api/*/route.js`
- Lógica de negocio en `/lib` (nunca en componentes ni en route handlers directamente)
- Componentes en `/components`, un archivo por componente
- Variables de entorno documentadas en `.env.example`; secretos nunca al cliente ni al repo
- Errores de APIs externas: siempre try/catch con retry (backoff) y logging de coste

## Pipeline core (no modificar sin consultar)
questionnaire → LLM brief → 3× Ideogram (preview watermarked) → selección
→ Stripe → webhook → Recraft SVG + ensamblaje → ZIP + Brand Hub

## Reglas de negocio críticas (innegociables)
- **SVG solo se genera post-pago** (nunca en preview)
- Regeneración: máximo 1 por sesión
- Rate limit: 3 sesiones por IP por hora
- Desbloqueo del entregable SOLO por webhook de Stripe verificado (no por redirect de éxito)
- Webhook idempotente: verificar status en DB antes de procesar (puede llegar duplicado)
- Brand Hub solo para plan Complete
- Signed URLs de descarga: 30 días
- Precio Basic = **$19** (1900). El spec dice $29 — está desactualizado, usar $19.

## Params exactos del pipeline
- Ideogram: `style_type: "DESIGN"`, `magic_prompt_option: "OFF"`, `aspect_ratio: "ASPECT_1_1"`
- Recraft: `style: "vector_illustration"` (esto da el SVG nativo)

## Tooling del proyecto
- Skills: `fal-ai-pipeline`, `stripe-one-time`, `sharp-image-processing` (+ global `nextjs-supabase`)
- Agentes: `pipeline-engineer`, `payments-engineer`, `supabase-architect`, `frontend-craftsman`, `qa-auditor`
- Máximo 2 agentes por sesión (orquestar más consume contexto sin beneficio marginal)
- MCPs de prioridad alta: Supabase, Stripe. Media: Playwright. Docs: Context7.

## Rutina de sesión
1. Leer `docs/PROGRESS.md` + `git log` para retomar contexto.
2. Plan primero: pedir plan de implementación, validarlo, luego código.
3. Verificación continua tras cada bloque (curl / browser / Stripe CLI).
4. Cierre: commit descriptivo + actualizar `docs/PROGRESS.md`.
