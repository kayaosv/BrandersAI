# Branders AI — Plan de Ejecución en Claude Code
## División en sesiones, agentes, skills y MCPs

Este documento complementa `branders-ai-spec-final.md`. Define cómo ejecutar el desarrollo en Claude Code: qué se hace en cada sesión, qué contexto necesita cada una, y qué tooling (agentes, skills, MCPs) configurar antes de empezar.

---

## 1. Principios de división en sesiones

- **Una sesión = un objetivo verificable.** Cada sesión termina con algo que se puede probar (un script que corre, una página que renderiza, un pago que se procesa). Nunca terminar una sesión "a medias" de una feature.
- **Contexto mínimo por sesión.** No cargar el spec completo en cada sesión — cada sesión recibe solo las secciones del spec que le tocan. El CLAUDE.md del proyecto lleva lo transversal.
- **Sesiones de 2-4 horas de trabajo efectivo.** Más allá de eso el contexto se degrada y conviene abrir sesión nueva.
- **Commit al final de cada sesión.** Estado limpio, mensaje descriptivo, para que la siguiente sesión pueda arrancar con `git log` + archivos como contexto.

---

## 2. CLAUDE.md del proyecto (crear antes de la Sesión 1)

Contenido que debe llevar el `CLAUDE.md` en la raíz del repo:

```markdown
# Branders AI

AI-powered Startup Launch Kit Generator. Pago único $29/$49.

## Stack
- Next.js App Router, JSX (NO TypeScript salvo tipos generados de Supabase)
- Tailwind CSS
- Supabase (DB + Storage, RLS habilitado, acceso vía service role solo en Route Handlers)
- Stripe Checkout (payment mode, no subscriptions)
- fal.ai SDK: Ideogram 3.0 (previews) + Recraft V4 (SVG post-pago)
- Claude API (Haiku) para creative briefs
- Sharp para procesamiento de imagen, @react-pdf/renderer para PDF
- Resend para emails

## Convenciones
- Route Handlers en /app/api/*/route.js
- Lógica de negocio en /lib (nunca en componentes ni en route handlers directamente)
- Componentes en /components, un archivo por componente
- Variables de entorno documentadas en .env.example
- Errores de APIs externas: siempre try/catch con retry (1 reintento) y logging

## Pipeline core (no modificar sin consultar)
questionnaire → LLM brief → 3x Ideogram (preview watermarked) → selección
→ Stripe → webhook → Recraft SVG + ensamblaje → ZIP + Brand Hub

## Reglas de negocio críticas
- Regeneración: máximo 1 por sesión
- Rate limit: 3 sesiones por IP por hora
- SVG solo se genera post-pago (nunca en preview)
- Brand Hub solo para plan Complete
- Signed URLs de descarga: 30 días
```

---

## 3. División en sesiones

### SESIÓN 0 — Validación técnica (Sprint 0 del spec)
**Objetivo:** validar el pipeline de IA antes de escribir la app. Es la sesión más importante — puede matar o redirigir el proyecto.

**Tareas:**
1. Setup mínimo: repo, `npm init`, fal.ai SDK, Claude SDK, `.env`
2. Script `scripts/validate-pipeline.js`:
   - 10 casos de prueba (empresas ficticias variadas: SaaS, restaurante, luxury, playful...)
   - Por caso: LLM brief → 1 prompt Ideogram → generar → guardar PNG
   - Por 5 casos: además Recraft SVG → guardar SVG
3. Evaluación manual de resultados:
   - ¿Texto correcto en Ideogram en >85% de los casos?
   - ¿SVG de Recraft visualmente coherente con el concepto?
4. Documentar veredicto en `docs/sprint0-results.md` con la decisión: SVG como "réplica" vs "vector edition"

**Output verificable:** carpeta con 10 PNGs + 5 SVGs reales + documento de decisión.
**Contexto necesario:** spec §3 (pipeline) y §7 (prompts).

---

### SESIÓN 1 — Fundación
**Objetivo:** proyecto Next.js funcionando con DB y storage listos.

**Tareas:**
1. `create-next-app` (App Router, JSX, Tailwind)
2. Supabase: proyecto, schema completo (4 tablas del spec §8), RLS, 4 buckets
3. Clientes en /lib: `supabase.js` (browser + service role), `fal.js`, `claude.js`
4. `.env.example` completo
5. Layout base + estructura de carpetas

**Output verificable:** `npm run dev` levanta, conexión a Supabase confirmada con un query de prueba.
**Contexto:** spec §2 (stack) y §8 (DB).

---

### SESIÓN 2 — Pipeline de generación (backend)
**Objetivo:** el core del producto funcionando end-to-end por API.

**Tareas:**
1. `lib/brief.js` — llamada a Claude Haiku con el system prompt del spec §7.1, parsing del JSON, manejo de errores
2. `lib/ideogram.js` — 3 llamadas paralelas vía fal.ai, config del spec §7.2
3. `lib/watermark.js` — Sharp composite del watermark diagonal
4. `POST /api/generate` — orquesta: sesión en DB → brief → 3x Ideogram → watermark → upload a bucket previews → registros generations
5. `POST /api/regenerate` — con límite de 1
6. `POST /api/select`
7. Rate limiting (3/IP/hora) — tabla o Upstash si prefieres

**Output verificable:** `curl` a /api/generate devuelve 3 URLs de previews watermarked reales.
**Contexto:** spec §3, §7, §9 + resultados de Sesión 0.

---

### SESIÓN 3 — Frontend del funnel
**Objetivo:** questionnaire → preview funcionando en el browser.

**Tareas:**
1. `/create` — questionnaire multi-step (3 pasos, progress bar, validación)
2. `/create/[sessionId]` — loading states reales (brief → generating → done), 3 cards con previews, mini-preview en tarjeta (canvas), botón regenerar, selección → pricing modal
3. Landing page provisional (hero + CTA + pricing) — la definitiva va en Sesión 7

**Output verificable:** flujo completo en browser desde formulario hasta selección de concepto.
**Contexto:** spec §4, §5.1-5.3.
**Nota:** aquí aplica tu skill de frontend/GSAP si quieres micro-interacciones — pero disciplina: el funnel primero funcional, el polish en Sesión 7.

---

### SESIÓN 4 — Stripe + pipeline post-pago
**Objetivo:** cobrar dinero real y generar el paquete Basic completo.

**Tareas:**
1. `POST /api/checkout` — Stripe Checkout Session + order pending
2. `POST /api/webhooks/stripe` — verificación de firma, checkout.session.completed → processing → lanza ensamblaje
3. `lib/recraft.js` — SVG post-pago
4. `lib/variations.js` — Sharp: transparente, mono negro/blanco, favicon 32/64, app icon 512
5. `lib/palette.js` — extracción de colores + merge con rationale del brief
6. `lib/package.js` — ZIP (archiver) + upload + signed URL
7. `GET /api/status/[sessionId]` + `GET /api/download/[sessionId]`
8. `/success/[sessionId]` con polling + `/download/[sessionId]`
9. Configurar `maxDuration: 300` en el route handler del ensamblaje (Vercel Pro)

**Output verificable:** compra de prueba con tarjeta test de Stripe → ZIP descargable con todos los assets Basic.
**Contexto:** spec §5.4-5.5, §6, §9 (incluida la nota de timeouts).
**Nota:** usar Stripe CLI (`stripe listen`) para testear webhooks en local.

---

### SESIÓN 5 — Complete tier: mockups + PDF
**Objetivo:** los deliverables que justifican los $20 extra.

**Tareas:**
1. Preparar 6 templates de mockup (PNG con coordenadas de inserción documentadas en un JSON de config)
2. `lib/mockups.js` — Sharp composite por template
3. `lib/pdf.js` — Brand Guidelines PDF con @react-pdf/renderer (6 páginas del spec §5.6... portada, variaciones, colores, tipografía, do's/don'ts, mockups)
4. Integrar brand strategy del brief en PDF y en el paquete
5. Extender el ensamblaje del webhook para plan complete

**Output verificable:** compra test del plan Complete → ZIP con mockups + PDF profesional.
**Contexto:** spec §5.6 (deliverables), §6.
**Nota:** los templates de mockup los puedes crear tú en Figma/Photoshop antes de la sesión — Claude Code no puede diseñarlos, solo integrarlos.

---

### SESIÓN 6 — Brand Hub
**Objetivo:** el diferenciador viral.

**Tareas:**
1. `/b/[slug]` — página pública dinámica con todas las secciones (spec §5.6)
2. Generación de slug + owner_token en el ensamblaje post-pago
3. Downloads protegidos por owner_token
4. Copy-to-clipboard en códigos de color
5. Footer "Made with Branders AI" + OG image dinámica para shares
6. View counter

**Output verificable:** Brand Hub público navegable de una compra test, compartible con OG preview correcto.
**Contexto:** spec §5.6, §8 (tabla brand_hubs).

---

### SESIÓN 7 — Landing definitiva + SEO
**Objetivo:** la página que convierte tráfico frío.

**Tareas:**
1. Landing completa (spec §5.1): hero, diferenciadores, cómo funciona, grid de ejemplos, pricing, FAQ
2. Aquí SÍ aplicar tu estándar de calidad KAYAO: animaciones GSAP, micro-interacciones — la landing es tu portfolio también
3. Meta tags, OG images, sitemap.xml, robots.txt
4. Páginas programáticas: `/industries/[x]` y `/styles/[x]` con contenido generado + ejemplos
5. Analytics + eventos de funnel (visitor→preview→purchase)

**Output verificable:** Lighthouse >90, landing desplegada en Vercel, eventos trackeando.
**Contexto:** spec §5.1, §11 (distribución).

---

### SESIÓN 8 — Hardening + launch prep
**Objetivo:** que no se rompa con usuarios reales.

**Tareas:**
1. Test E2E completo: happy path + edge cases (pago fallido, webhook duplicado — idempotencia, timeout de fal.ai, regeneración agotada)
2. Email delivery (Resend): download link + recibo
3. Error boundaries + páginas de error decentes
4. Rate limiting verificado bajo carga
5. Generar los 8-10 Brand Hubs de ejemplo para la landing
6. Stripe en modo live + compra real de verificación
7. Checklist Product Hunt (assets, copy, hunter)

**Output verificable:** compra real con tu propia tarjeta procesada sin errores, de landing a Brand Hub.

---

## 4. Agentes recomendados

Tienes ya un bundle de agentes orientado a trabajo creativo/Awwwards. Para Branders, esta es la configuración recomendada (reutiliza los tuyos donde coincidan, crea los que falten):

### `pipeline-engineer` (crear — el más importante)
Especialista en el pipeline de IA. Conoce fal.ai SDK, los parámetros exactos de Ideogram (`style_type: DESIGN`, `magic_prompt_option: OFF`) y Recraft (`style: vector_illustration`), el formato del creative brief, y las reglas de retry/error handling. Se usa en Sesiones 0, 2 y 4.

**Prompt base del agente:** experto en integración de APIs de generación de imagen vía fal.ai; siempre valida JSON del LLM antes de usarlo; siempre implementa retry con backoff; nunca genera SVG en fase de preview; loggea coste estimado por operación.

### `payments-engineer` (crear)
Especialista Stripe. Checkout Sessions en payment mode, verificación de firma de webhooks, idempotencia (un webhook puede llegar duplicado — verificar status antes de procesar), testing con Stripe CLI. Se usa en Sesión 4.

### `supabase-architect` (adaptar si ya tienes uno de backend)
Schema, RLS policies, buckets, signed URLs, service role vs anon key. Se usa en Sesiones 1, 4, 6.

### `frontend-craftsman` (ya lo tienes — reutilizar)
Tu agente de frontend Awwwards-level. Se usa en Sesiones 3 y 7. Para la Sesión 3 con instrucción de contención (funnel funcional > polish); para la Sesión 7 a máxima potencia.

### `qa-auditor` (crear o adaptar)
Revisa flujos completos buscando edge cases: pagos duplicados, race conditions en el polling, URLs expiradas, inputs maliciosos en el questionnaire, abuso del rate limit. Se usa en Sesión 8 y como revisor al final de las Sesiones 4 y 6.

> **No recomiendo** usar más de 2 agentes por sesión. La orquestación de muchos agentes consume contexto y el beneficio marginal es bajo en un proyecto de este tamaño.

---

## 5. Skills recomendadas

### `fal-ai-pipeline` (crear — prioridad alta)
Documentación destilada de fal.ai: SDK setup, modelos exactos (`fal-ai/ideogram/v3`, `fal-ai/recraft-v3`), parámetros críticos, formato de respuestas, precios, manejo de webhooks de fal para jobs largos. Incluir los resultados del Sprint 0 (qué prompts funcionaron) cuando existan.

### `stripe-one-time` (crear — prioridad alta)
Patrón completo de pago único con Next.js App Router: Checkout Session, webhook con verificación de firma en route handler (cuidado con el body parsing — necesita raw body), idempotencia, testing con CLI. Es reutilizable para todos tus futuros SaaS.

### `sharp-image-processing` (crear — prioridad media)
Recetas Sharp: composite para watermark y mockups, remove white background (threshold + alpha), tint para versiones monocromáticas, resize para favicons. Con snippets probados.

### `supabase-patterns` (si no la tienes ya)
RLS policies típicas, signed URLs, storage buckets, service role en route handlers.

### Tus skills existentes de GSAP/frontend
Se aplican directamente en Sesión 7 (landing). En Sesión 3, usar con moderación.

---

## 6. MCPs recomendados

### Supabase MCP (prioridad alta)
MCP oficial de Supabase. Permite a Claude Code inspeccionar el schema real, ejecutar queries, verificar RLS, y debuggear datos sin que copies/pegues del dashboard. Elimina el 80% de la fricción en Sesiones 1, 4 y 6.
```bash
claude mcp add supabase -- npx -y @supabase/mcp-server-supabase --access-token=<token>
```

### Stripe MCP (prioridad alta)
MCP oficial de Stripe. Consultar payment intents, sessions, eventos de webhook reales durante debugging de la Sesión 4.
```bash
claude mcp add stripe -- npx -y @stripe/mcp --api-key=<sk_test_...>
```

### Playwright MCP (prioridad media)
Para la Sesión 8: Claude Code puede navegar la app real, ejecutar el funnel completo y verificar visualmente. También útil en Sesión 7 para revisar la landing renderizada.

### Context7 o similar (docs actualizadas — opcional)
fal.ai y Recraft cambian sus APIs con frecuencia. Un MCP de documentación viva evita que Claude Code use parámetros obsoletos de su training data.

> **No añadir más MCPs que estos.** Cada MCP consume contexto en cada sesión. Vercel se maneja bien con CLI (`vercel`), y GitHub con `git` — no necesitan MCP.

---

## 7. Workflow por sesión (rutina)

1. **Inicio:** abrir Claude Code en el repo → contexto automático de CLAUDE.md → pegar el objetivo de la sesión + secciones relevantes del spec (o referenciar `docs/spec.md` §X)
2. **Plan primero:** pedir plan de implementación antes de código, validarlo, luego ejecutar
3. **Verificación continua:** después de cada bloque funcional, probar (curl, browser, Stripe CLI) antes de seguir
4. **Cierre:** commit descriptivo + actualizar un `docs/PROGRESS.md` con estado y pendientes → esa nota es el contexto de arranque de la siguiente sesión

---

## 8. Orden de preparación (antes de la Sesión 0)

1. Crear cuenta fal.ai + cargar $10 de créditos
2. API key de Anthropic (Claude API)
3. Cuenta Stripe (modo test es suficiente hasta Sesión 8)
4. Proyecto Supabase creado
5. Verificar/comprar dominio branders.ai
6. Crear repo + CLAUDE.md (sección 2 de este documento)
7. Configurar los 2 MCPs de prioridad alta
8. Crear las 2 skills de prioridad alta (`fal-ai-pipeline`, `stripe-one-time`)
9. Crear el agente `pipeline-engineer`

Con eso, la Sesión 0 puede arrancar. Los demás agentes/skills se crean cuando su sesión se acerque — no antes, porque los resultados del Sprint 0 van a informar su contenido.
