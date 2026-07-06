# Branders AI — Spec Final (v3)
## AI-Powered Startup Launch Kit Generator

> **Posicionamiento:** "Launch your brand in 2 minutes. Not just a logo — everything you need to launch."

---

## 1. Producto y Posicionamiento

### Qué es
Branders AI genera **launch kits completos** para founders: logo único generado por IA (SVG editable incluido), sistema de color, tipografía, brand strategy, mockups, brand guidelines PDF y un **Brand Hub interactivo hosteado** — todo en menos de 2 minutos, pago único.

### Cliente objetivo (en orden de prioridad)
1. **Startup founders / indie hackers** — lanzan en Product Hunt, necesitan identidad ya
2. **SaaS builders** — side projects que necesitan verse profesionales
3. **Freelancers y pequeños negocios** — mercado secundario, mismo producto

### Por qué "Launch Kit" y no "Brand Kit" ni "Logo Generator"
- "Logo generator" → categoría saturada (Looka 2.6M visitas/mes, Design.com 4.6M)
- "Brand kit" → mejor, pero sigue compitiendo por features
- "Launch kit" → define al **cliente** (founder que lanza), no al producto. Abre keywords long-tail sin competencia ("startup launch kit", "brand kit for product hunt launch", "indie hacker branding")

### Diferenciadores (verificados contra competencia en research)
| Diferenciador | Looka | Brandmark | Tailor Brands | **Branders** |
|---|---|---|---|---|
| Logos únicos IA generativa (no templates compartidos) | ✗ | Parcial | ✗ | ✓ |
| SVG nativo generado por IA | ✗ | ✗ | ✗ | ✓ |
| Brand strategy escrita (LLM) | ✗ | ✗ | ✗ | ✓ |
| Brand Hub hosteado compartible | ✗ | ✗ | ✗ | ✓ |
| Pago único transparente | Parcial | ✓ | ✗ (subs) | ✓ |

### Pricing
- **Basic — $19:** logo (SVG + PNGs + variaciones) + paleta + tipografía + favicon + ZIP
- **Complete — $49:** todo lo anterior + brand strategy + 6 mockups + brand guidelines PDF + **Brand Hub interactivo**

El Brand Hub está solo en Complete deliberadamente: es el driver de upgrade y el motor de marketing viral.

---

## 2. Stack Técnico

- **Framework:** Next.js (App Router), JSX — no TypeScript (excepto tipos Supabase generados)
- **Styling:** Tailwind CSS
- **DB + Storage:** Supabase (PostgreSQL + Storage)
- **Pagos:** Stripe Checkout + Webhooks (modo payment, no subscription)
- **LLM (creative brief + brand strategy):** Claude API (Haiku para coste, Sonnet si calidad lo requiere)
- **Generación imagen (preview):** Ideogram 3.0 vía fal.ai — 90-95% precisión tipográfica
- **Generación SVG (post-pago):** Recraft V4 vía fal.ai — SVG vectorial nativo
- **Procesamiento imagen:** Sharp (variaciones, watermark, mockups, favicon)
- **PDF:** @react-pdf/renderer (server-side)
- **Email:** Resend (download link + recibo)
- **Hosting:** Vercel
- **Analytics:** Plausible o Vercel Analytics

---

## 3. Pipeline de IA — El Core del Producto

```
Input usuario (questionnaire)
    ↓
[Paso 1] LLM → Creative Brief
    - Brand personality (3-4 adjetivos desarrollados)
    - Visual direction (composición, iconografía, referencias)
    - Color rationale (qué colores y por qué)
    - 3 prompts optimizados para Ideogram (uno por variante)
    - Brand strategy summary (deliverable para plan Complete)
    Coste: ~$0.01 | Tiempo: ~3s
    ↓
[Paso 2] Ideogram 3.0 x3 → Conceptos en PNG
    - Variante A: tipográfica
    - Variante B: icónica
    - Variante C: combinada
    Coste: ~$0.09 | Tiempo: ~15-20s (paralelo)
    ↓
[Paso 3] Preview watermarked → usuario selecciona → Checkout
    ↓
[Paso 4 — post-pago] Recraft V4 → SVG del concepto elegido
    Coste: ~$0.08 | Tiempo: ~10s
    ↓
[Paso 5 — post-pago] Ensamblaje del paquete
    - Variaciones PNG (Sharp)
    - Paleta (extracción + brief del LLM)
    - Mockups (Sharp composite)
    - PDF guidelines
    - Brand Hub (registro en DB, página dinámica)
    - ZIP + signed URL
```

**Por qué el paso LLM es crítico:** convierte inputs pobres ("TechFlow, SaaS, modern") en prompts ricos y coherentes. Es la diferencia entre logos genéricos y logos que parecen tener intención de diseño. Además genera el brand strategy summary — un deliverable único en el mercado — como subproducto gratuito de la misma llamada.

**Decisión de scope:** 3 conceptos por sesión (no 2 direcciones × 3 = 6). Duplicar generaciones duplica coste de preview sin evidencia de mejor conversión. Si los datos post-launch muestran que los usuarios quieren más opciones, se añade "generate 3 more" como feature.

---

## 4. Questionnaire (input del usuario)

Diseñado para alimentar al LLM con señal, no ruido. Máximo 60 segundos en completarlo.

**Requeridos:**
- Company name (text)
- Industry (dropdown — 12 opciones + Other)
- Short description (text, 1-2 frases: "What does your company do?")

**Personality (selección visual, elegir hasta 2):**
Modern · Luxury · Friendly · Bold · Technical · Playful · Elegant · Minimal

**Audience (elegir 1):**
Consumers · Developers · Enterprise · Creators · Local business

**Desired feeling (elegir hasta 2):**
Trust · Innovation · Speed · Fun · Simplicity · Premium

**Opcionales:**
- Tagline
- Color preference (Let AI decide · Warm · Cool · Monochrome · Earth · Bold)

> Nota: personality + audience + feeling reemplazan el campo "visual style" del spec anterior. El LLM traduce estas señales a dirección visual — más natural para el usuario que elegir entre términos de diseño.

---

## 5. Flujo de Usuario y Páginas

```
/ (landing) → /create (questionnaire) → /create/[sessionId] (preview)
    → /checkout/[sessionId] → Stripe → /success/[sessionId] (polling)
    → /download/[sessionId] + /b/[slug] (Brand Hub, plan Complete)
```

### 5.1 Landing (`/`)
- Hero: "Launch your brand in 2 minutes" + CTA
- Subhead: "Not just a logo. A complete launch-ready brand identity — unique AI-generated logo, editable SVG, colors, typography, strategy, and a shareable Brand Hub."
- Social proof section: grid de 6-8 Brand Hubs de ejemplo (creados por ti pre-launch)
- Diferenciador: "Every logo is unique. Never a shared template." + badge "SVG included"
- Cómo funciona: 3 pasos
- Pricing: Basic $19 / Complete $49 — tabla comparativa
- FAQ (SEO content: "Is the logo really unique?", "Can I edit the SVG?", "Do I own the rights?")
- Footer legal

### 5.2 Questionnaire (`/create`)
- Multi-step form (3 pasos, progress bar): Basics → Personality → Colors
- Validación client-side, submit → POST /api/generate → redirect a preview

### 5.3 Preview (`/create/[sessionId]`)
- Loading state con progreso real (brief → generating → done), ~20-25s total
- 3 cards con conceptos watermarked
- Cada card: mini-preview en tarjeta de visita (canvas client-side) + badge "SVG included"
- 1 regeneración gratuita (regenera los 3 conceptos con brief ajustado)
- Select → pricing modal → checkout

### 5.4 Success + Polling (`/success/[sessionId]`)
- Post-Stripe redirect. Muestra "Building your brand kit..." con estados
- Polling a /api/status cada 3s
- Al completar → redirect a /download/[sessionId]

### 5.5 Download (`/download/[sessionId]`)
- Preview visual del kit completo
- Botón ZIP download
- Si Complete: link prominente al Brand Hub
- Captura de email (para reenvío del link — Resend)

### 5.6 Brand Hub (`/b/[slug]`) — solo Complete
Página pública hosteada por cliente. Secciones:
- Hero con logo + nombre + tagline
- Downloads (SVG, PNGs — protegido: solo con token del owner)
- Color system (con códigos copiables HEX/RGB/CMYK)
- Typography (con ejemplos renderizados, links a Google Fonts)
- Brand story (el strategy summary del LLM)
- Mockups gallery
- Footer: "Made with Branders AI" → link a landing (motor viral + SEO)

**Triple función del Hub:** deliverable premium / marketing viral (el founder lo comparte con su equipo, en Twitter, con inversores) / SEO programático (cada hub es una página indexable con contenido único).

---

## 6. Deliverables por Plan

| Deliverable | Basic $19 | Complete $49 |
|---|---|---|
| Logo SVG vectorial editable | ✓ | ✓ |
| Logo PNG alta resolución (4000px) | ✓ | ✓ |
| PNG fondo transparente | ✓ | ✓ |
| Versión monocromática negra | ✓ | ✓ |
| Versión monocromática blanca | ✓ | ✓ |
| Favicon (32/64px) + App icon (512px) | ✓ | ✓ |
| Color palette (HEX, RGB, CMYK) | ✓ | ✓ |
| Typography pairing (Google Fonts) | ✓ | ✓ |
| ZIP download | ✓ | ✓ |
| Brand strategy summary (escrita por LLM) | ✗ | ✓ |
| 6 mockups (business card, letterhead, IG profile, web header, t-shirt, storefront) | ✗ | ✓ |
| Brand Guidelines PDF | ✗ | ✓ |
| **Interactive Brand Hub (hosted)** | ✗ | ✓ |

**Cortado del scope (era del spec optimizado, va a v2):** social media kit completo, email signature, website hero assets. Cada uno añade días de desarrollo y templates; el favicon + mockups ya cubren el 80% del valor percibido.

---

## 7. Prompt Engineering

### 7.1 LLM — Creative Brief (Claude Haiku)

**System prompt (esqueleto):**
```
You are a senior brand strategist. Given a company's details, produce a JSON
creative brief for logo generation. Respond ONLY with valid JSON.

Schema:
{
  "personality": "2-3 sentence brand personality",
  "visual_direction": "composition, iconography, visual references",
  "color_rationale": "which colors and why, considering industry + feeling",
  "brand_story": "4-6 sentence brand strategy summary, written for the founder",
  "prompts": {
    "typographic": "complete Ideogram prompt, typography-led",
    "iconic": "complete Ideogram prompt, icon-led",
    "combined": "complete Ideogram prompt, integrated mark"
  }
}

Prompt rules for the "prompts" fields:
- Always include: the exact company name in quotes, "correctly spelled, clearly legible"
- Always include: "white background, flat vector logo design, no gradients, no 3D, no photorealism"
- Translate personality/audience/feeling into concrete visual language
- Respect color preference if given; otherwise propose based on rationale
```

**User message:** JSON con los inputs del questionnaire.

### 7.2 Ideogram 3.0 (vía fal.ai)
```javascript
const result = await fal.subscribe("fal-ai/ideogram/v3", {
  input: {
    prompt: brief.prompts[variant],   // del LLM
    style_type: "DESIGN",
    magic_prompt_option: "OFF",       // control total
    aspect_ratio: "ASPECT_1_1",
  }
})
```

### 7.3 Recraft V4 SVG (vía fal.ai, post-pago)
```javascript
const result = await fal.subscribe("fal-ai/recraft-v3", {
  input: {
    prompt: condensedPrompt,           // versión condensada del prompt ganador
    style: "vector_illustration",      // CRÍTICO: esto da SVG nativo
    colors: extractedPalette,          // paleta extraída del PNG elegido
    image_size: { width: 1024, height: 1024 },
  }
})
```

> **Validación Sprint 0 (obligatoria antes de construir):** generar 10 logos de prueba con este pipeline y verificar: (a) el texto sale correcto en Ideogram >85% de las veces, (b) el SVG de Recraft es visualmente consistente con el concepto de Ideogram. Si (b) falla consistentemente, plan B: entregar el SVG de Recraft como "vector edition" (mismo brief, interpretación vectorial) en vez de prometer réplica exacta. Esto se decide con datos en el día 1, no en la semana 3.

---

## 8. Base de Datos (Supabase)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  tagline TEXT,
  industry TEXT NOT NULL,
  description TEXT NOT NULL,
  personality TEXT[] NOT NULL,        -- hasta 2
  audience TEXT NOT NULL,
  feeling TEXT[] NOT NULL,            -- hasta 2
  color_preference TEXT DEFAULT 'ai_decide',
  brief JSONB,                        -- creative brief completo del LLM
  regenerations_used INT DEFAULT 0,   -- límite: 1
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,              -- 'typographic' | 'iconic' | 'combined'
  ideogram_url TEXT NOT NULL,
  recraft_svg_url TEXT,
  prompt_used TEXT NOT NULL,
  selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  generation_id UUID REFERENCES generations(id),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  plan TEXT NOT NULL,                 -- 'basic' | 'complete'
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',      -- pending | paid | processing | ready | failed
  download_url TEXT,
  download_expires_at TIMESTAMPTZ,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE brand_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  slug TEXT UNIQUE NOT NULL,          -- ej. 'techflow-x7k2'
  is_public BOOLEAN DEFAULT TRUE,
  owner_token TEXT NOT NULL,          -- para acceso a downloads
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Storage buckets:**
- `previews` (público) — PNGs watermarked
- `assets` (privado, signed URLs) — SVG, PNGs procesados, mockups, PDF
- `packages` (privado, signed URLs 30 días) — ZIPs
- `templates` (privado) — templates de mockup

**RLS:** habilitado en todas las tablas. Acceso vía service role solo desde Route Handlers.

---

## 9. API Routes

| Route | Método | Función |
|---|---|---|
| `/api/generate` | POST | Crea sesión → LLM brief → 3x Ideogram paralelo → watermark → upload → returns previews |
| `/api/regenerate` | POST | Verifica regenerations_used < 1 → ajusta brief → regenera 3 conceptos |
| `/api/select` | POST | Marca generation seleccionada |
| `/api/checkout` | POST | Crea Stripe Checkout Session + order (pending) |
| `/api/webhooks/stripe` | POST | checkout.session.completed → status processing → lanza ensamblaje |
| `/api/status/[sessionId]` | GET | Polling: processing / ready + downloadUrl |
| `/api/download/[sessionId]` | GET | Verifica ready → signed URL |
| `/api/hub/[slug]` | GET | Datos públicos del Brand Hub |

**Nota crítica — ensamblaje post-pago en Vercel:** el job completo (Recraft + Sharp + PDF + ZIP) puede tardar 60-120s. Vercel Functions tienen timeout (10s hobby / 60s pro / 300s con fluid compute). Soluciones en orden de preferencia:
1. **Vercel Functions con `maxDuration: 300`** (requiere plan Pro) — la más simple
2. Dividir el job en pasos encadenados vía Supabase (cada paso actualiza status, un cron/trigger lanza el siguiente)
3. Supabase Edge Functions para el job pesado

Empezar con la opción 1. Es una decisión de $20/mes, no de arquitectura.

---

## 10. Costes y Márgenes

| Concepto | Coste |
|---|---|
| LLM brief (Claude Haiku) | ~$0.01 |
| Ideogram x3 (preview) | ~$0.09 |
| Regeneración (si se usa): brief + 3x Ideogram | ~$0.10 |
| Recraft SVG (post-pago) | ~$0.08 |
| Sharp/PDF/ZIP compute | ~$0.01 |
| Storage + email | ~$0.02 |
| Stripe fee (2.9% + $0.30) | $1.14–$1.72 |
| **Total por venta** | **$1.35–$2.03** |
| **Margen Basic ($19)** | **~95%** |
| **Margen Complete ($49)** | **~96%** |

Coste por visitante que genera pero NO compra: ~$0.10 (~$0.20 si regenera).
→ Con 5% conversión: coste de API por venta ≈ $2.00-$4.00 adicionales. Margen sigue >85%. Sano.

**Protección anti-abuso:** rate limiting 3 sesiones/IP/hora + regeneración limitada a 1.

---

## 11. Distribución y Marketing (tan importante como el código)

### Pre-launch (durante desarrollo, semanas 1-4)
- **Build in public en Twitter/X:** documentar el desarrollo. La audiencia indie hacker ES el cliente objetivo. 2-3 posts/semana mostrando outputs reales.
- **Crear 8-10 Brand Hubs de ejemplo** para startups ficticias (o reales de amigos) — son el social proof de la landing Y contenido compartible.
- **Waitlist simple** en el dominio desde la semana 1 (una página, un email input).

### Launch (semana 5)
- **Product Hunt** — el producto está literalmente diseñado para founders que lanzan en PH. El pitch se escribe solo: "I built the tool I needed for this launch."
- **Twitter/X thread** del launch con ejemplos visuales
- **Reddit:** r/SideProject, r/indiehackers, r/startups (con tacto, mostrando el producto, no spam)
- **Indie Hackers post** con la historia del build

### Post-launch (continuo)
- **SEO programático:** `/industries/[x]` (12 páginas), `/styles/[x]` (8 páginas), `/examples`, blog. Target: long-tail "launch kit" + "brand kit" keywords donde la competencia es débil.
- **Motor viral del Brand Hub:** cada cliente Complete genera una página pública con backlink. 100 clientes = 100 páginas indexables + shares orgánicos.
- **Paid ads solo tras validar conversión orgánica** (si preview→purchase >3%, testear $200 en Google Ads sobre keywords long-tail).

### Métricas de éxito (instrumentar desde el día 1)
| Métrica | Target inicial |
|---|---|
| Visitor → Preview (genera) | >15% |
| Preview → Purchase | >3% |
| Tiempo de generación preview | <25s |
| Tiempo ensamblaje post-pago | <120s |
| Coste API / venta | <$4 |
| Brand Hub shares (Complete) | >30% |

**Señal de kill/pivot:** <2% preview→purchase tras 500 previews = problema de producto (calidad output o pricing). Buen ratio pero sin tráfico = problema de distribución, invertir ahí.

---

## 12. Roadmap de Desarrollo

### Sprint 0 — Validación técnica (1-2 días, ANTES de construir nada)
- [ ] Cuenta fal.ai + créditos
- [ ] Script de prueba: 10 briefs LLM → 10 logos Ideogram → evaluar % texto correcto
- [ ] 5 pruebas Recraft SVG → evaluar consistencia con concepto Ideogram
- [ ] Decisión: ¿SVG como "réplica" o como "vector edition"? (ver §7.3)
- [ ] Verificar dominio branders.ai disponible/comprable

### Sprint 1 — Core pipeline (semana 1)
- [ ] Setup Next.js + Supabase + Tailwind + fal.ai SDK
- [ ] Schema DB + RLS + buckets
- [ ] LLM creative brief (lib/brief.js)
- [ ] Integración Ideogram + watermark (Sharp)
- [ ] Questionnaire multi-step
- [ ] Preview page con loading states

### Sprint 2 — Monetización (semana 2)
- [ ] Stripe Checkout + webhook + orders
- [ ] Recraft SVG post-pago
- [ ] Variaciones PNG (Sharp): transparente, mono negro/blanco, favicon, app icon
- [ ] Paleta de colores (extracción + rationale del brief)
- [ ] ZIP + signed URLs + download page
- [ ] Polling de status + success page
- [ ] Email delivery (Resend)

### Sprint 3 — Complete tier (semana 3)
- [ ] 6 mockup templates + Sharp composite
- [ ] Brand Guidelines PDF (@react-pdf/renderer)
- [ ] Brand strategy en el paquete
- [ ] **Brand Hub** (/b/[slug]): página dinámica + registro DB + owner token
- [ ] Typography pairing renderizado

### Sprint 4 — Launch (semana 4)
- [ ] Landing page final con 8-10 ejemplos
- [ ] SEO: meta tags, OG images, sitemap
- [ ] Rate limiting + validaciones anti-abuso
- [ ] Analytics + funnel events (visitor→preview→purchase)
- [ ] Test E2E con pagos reales
- [ ] Product Hunt assets + copy

---

## 13. Futuro (v2 — NO construir ahora)
- AI naming assistant + domain availability check
- Social media kit completo / email signatures / website hero assets
- Regeneración de pago ($19)
- Slogan/copywriting generation
- Figma/Framer export
- Versión en español
- "Generate 3 more concepts" (si los datos lo piden)
