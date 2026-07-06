// Núcleo del pipeline de validación (Sprint 0 / Sesión 0).
// Aislado en scripts/ a propósito: es código de validación desechable. La versión de
// producción vive en /lib (Sesiones 2 y 4). Params EXACTOS según docs/spec.md §7 y la
// skill fal-ai-pipeline. Los slugs de fal.ai se confirman aquí, con datos reales.

import Anthropic from '@anthropic-ai/sdk'
import { fal } from '@fal-ai/client'

// --- Config / claves ---------------------------------------------------------
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
fal.config({ credentials: process.env.FAL_KEY })

// Modelos (verificar en vivo; el Sprint 0 existe justo para esto):
export const MODELS = {
  brief: 'claude-haiku-4-5-20251001',   // Haiku por coste (spec §2)
  ideogram: 'fal-ai/ideogram/v3',       // preview PNG — CONFIRMAR slug real
  recraft: 'fal-ai/recraft-v3',         // SVG vectorial — CONFIRMAR slug real
}

// Coste estimado por operación (spec §10) — para logging, no facturación exacta.
export const COST = { brief: 0.01, ideogramPerImage: 0.03, recraft: 0.08 }

// --- Retry con backoff exponencial + jitter ----------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function isRetryable(err) {
  const s = err?.status ?? err?.response?.status
  if (s === 429 || (s >= 500 && s <= 599)) return true
  // errores de red (sin status): timeouts, ECONNRESET, fetch failed
  if (s === undefined) return true
  return false // 4xx de validación: no reintentar
}

export async function withRetry(fn, { label = 'op', max = 3, base = 800 } = {}) {
  let attempt = 0
  for (;;) {
    try {
      return await fn()
    } catch (err) {
      attempt++
      if (attempt >= max || !isRetryable(err)) {
        console.error(`  ✗ ${label} falló (intento ${attempt}/${max}): ${err?.message ?? err}`)
        throw err
      }
      const delay = base * 2 ** (attempt - 1) + Math.floor(Math.random() * 300)
      console.warn(`  ↻ ${label} reintento ${attempt}/${max} en ${delay}ms — ${err?.message ?? err}`)
      await sleep(delay)
    }
  }
}

// --- Paso 1: Creative brief (Claude Haiku) -----------------------------------
const BRIEF_SYSTEM = `You are a senior brand strategist. Given a company's details, produce a JSON
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
- Respect color preference if given; otherwise propose based on rationale`

function parseBriefJson(text) {
  // El modelo debería responder JSON puro; por si acaso, quitar fences.
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  return JSON.parse(cleaned)
}

// Validación del JSON del LLM ANTES de usarlo (regla innegociable).
export function validateBrief(brief) {
  const errs = []
  const strFields = ['personality', 'visual_direction', 'color_rationale', 'brand_story']
  for (const f of strFields) {
    if (typeof brief?.[f] !== 'string' || !brief[f].trim()) errs.push(`falta/invalid: ${f}`)
  }
  for (const v of ['typographic', 'iconic', 'combined']) {
    if (typeof brief?.prompts?.[v] !== 'string' || !brief.prompts[v].trim())
      errs.push(`falta/invalid: prompts.${v}`)
  }
  if (errs.length) throw new Error(`Brief inválido: ${errs.join(' | ')}`)
  return brief
}

export async function generateBrief(input) {
  const msg = await withRetry(
    () =>
      anthropic.messages.create({
        model: MODELS.brief,
        max_tokens: 1200,
        system: BRIEF_SYSTEM,
        messages: [{ role: 'user', content: JSON.stringify(input) }],
      }),
    { label: 'brief' },
  )
  const text = msg.content.find((b) => b.type === 'text')?.text ?? ''
  const brief = validateBrief(parseBriefJson(text))
  return brief
}

// --- Paso 2: Ideogram (preview PNG) ------------------------------------------
export async function runIdeogram(prompt) {
  const result = await withRetry(
    () =>
      fal.subscribe(MODELS.ideogram, {
        input: {
          prompt,
          style_type: 'DESIGN',
          magic_prompt_option: 'OFF',
          aspect_ratio: 'ASPECT_1_1',
        },
      }),
    { label: 'ideogram' },
  )
  const url = result?.data?.images?.[0]?.url
  if (!url) throw new Error('Ideogram no devolvió image url')
  return url
}

// --- Paso 4: Recraft (SVG vectorial, normalmente post-pago) -------------------
// En Sprint 0 lo probamos sin paleta extraída todavía (eso llega en Sesión 4).
export async function runRecraft(condensedPrompt, colors = []) {
  const input = {
    prompt: condensedPrompt,
    style: 'vector_illustration', // CRÍTICO: da SVG nativo
    image_size: { width: 1024, height: 1024 },
  }
  if (colors.length) input.colors = colors
  const result = await withRetry(() => fal.subscribe(MODELS.recraft, { input }), {
    label: 'recraft',
  })
  const url = result?.data?.images?.[0]?.url
  if (!url) throw new Error('Recraft no devolvió image url')
  return url
}
