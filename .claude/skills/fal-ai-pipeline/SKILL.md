---
name: fal-ai-pipeline
description: >
  Pipeline de generacion de imagen de Branders AI via fal.ai: SDK setup, modelos y
  parametros EXACTOS de Ideogram (preview PNG) y Recraft (SVG post-pago), validacion del
  creative brief del LLM, retry/backoff, logging de coste, y jobs largos por queue.
  Cargar en Sesiones 0, 2 y 4, o al tocar cualquier llamada a fal.ai / Claude brief.
---

# fal.ai pipeline (Branders AI)

Server-side SIEMPRE. `FAL_KEY` nunca al cliente. JS/JSX.
> Los slugs y params cambian; VERIFICA con Context7/docs de fal.ai antes de fijar. Los de
> abajo son los del spec — el Sprint 0 confirma cuales funcionan de verdad.

## 0. Setup
    import { fal } from '@fal-ai/client'
    fal.config({ credentials: process.env.FAL_KEY })   // solo en /lib o route handlers

## 1. Regla de oro del pipeline
questionnaire -> LLM brief -> 3x Ideogram (preview watermarked) -> seleccion
  -> Stripe -> webhook -> Recraft SVG + ensamblaje.
- **SVG (Recraft) SOLO post-pago. NUNCA en preview.** El preview es raster barato.
- Regeneracion max 1/sesion. Rate limit 3 sesiones/IP/hora.

## 2. Paso LLM — Creative Brief (Claude Haiku)
System prompt: "senior brand strategist, responde SOLO JSON valido". Schema:
    { personality, visual_direction, color_rationale, brand_story,
      prompts: { typographic, iconic, combined } }
Reglas de los prompts de imagen (las inyecta el system prompt):
- nombre exacto entre comillas + "correctly spelled, clearly legible"
- "white background, flat vector logo design, no gradients, no 3D, no photorealism"
- traducir personality/audience/feeling a lenguaje visual concreto
**Validar el JSON antes de usarlo** (schema + campos requeridos). Si invalido -> reintentar
la llamada al LLM (bounded), no romper el flujo. Nunca pasar output crudo del LLM a fal.ai.

## 3. Ideogram — preview PNG (params EXACTOS)
    const result = await fal.subscribe("fal-ai/ideogram/v3", {
      input: {
        prompt: brief.prompts[variant],   // 'typographic' | 'iconic' | 'combined'
        style_type: "DESIGN",
        magic_prompt_option: "OFF",        // control total, NO reescribir el prompt
        aspect_ratio: "ASPECT_1_1",
      },
    })
    const url = result.data.images[0].url
Las 3 variantes en **paralelo** (Promise.all). Coste ~$0.09 los 3. Tiempo ~15-20s.

## 4. Recraft — SVG post-pago (params EXACTOS)
    const result = await fal.subscribe("fal-ai/recraft-v3", {
      input: {
        prompt: condensedPrompt,           // version condensada del prompt ganador
        style: "vector_illustration",      // CRITICO: esto da SVG nativo
        colors: extractedPalette,          // paleta extraida del PNG elegido
        image_size: { width: 1024, height: 1024 },
      },
    })
Coste ~$0.08. Tiempo ~10s. Solo tras webhook de pago verificado.

## 5. Retry / error handling
- Backoff exponencial + jitter, intentos acotados. Retryable: 429/5xx/timeout.
  No retryable: 4xx de validacion. Nunca retry infinito.
- Propagar estado a la capa de polling: queued | processing | done | failed.
- Idempotencia: no re-disparar generaciones ya completadas.

## 6. Jobs largos (queue) — si subscribe da timeout
Usar `fal.queue.submit` + `fal.queue.status` / webhook de fal, o encadenar pasos via
Supabase status. En Vercel el ensamblaje va con `maxDuration: 300` (plan Pro).

## 7. Logging de coste (obligatorio)
Cada operacion loggea { modelo, n_imagenes, coste_estimado }. Referencia (spec §10):
LLM brief ~$0.01 | Ideogram x3 ~$0.09 | Recraft ~$0.08 | regeneracion ~$0.10.

## 8. Resultados Sprint 0 (rellenar tras validar — §7.3 del spec)
- % texto correcto en Ideogram (>85% requerido): __
- SVG Recraft consistente con concepto Ideogram (si/no): __
- Decision: SVG como "replica" o como "vector edition": __
- Prompts/params que funcionaron mejor: __
