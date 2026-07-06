// Sprint 0 — Validación técnica del pipeline (spec §12, plan Sesión 0).
// Corre 10 casos: brief LLM → Ideogram (PNG). 5 de ellos además → Recraft (SVG).
// Guarda outputs en sprint0-output/ (gitignored) + un informe para evaluación manual.
//
// Ejecutar:  npm run validate        (usa --env-file=.env.local)
// Requiere en .env.local:  ANTHROPIC_API_KEY  y  FAL_KEY

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { testCases } from './test-cases.js'
import { generateBrief, runIdeogram, runRecraft, COST } from './pipeline.js'

const OUT = 'sprint0-output'

// --- Guardas de entorno ------------------------------------------------------
function requireKeys() {
  const missing = ['ANTHROPIC_API_KEY', 'FAL_KEY'].filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`\n❌ Faltan claves en .env.local: ${missing.join(', ')}\n`)
    console.error('Añádelas a .env.local y reintenta:')
    console.error('  ANTHROPIC_API_KEY=sk-ant-...')
    console.error('  FAL_KEY=...\n')
    process.exit(1)
  }
}

async function download(url, path) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(path, buf)
  return buf.length
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

async function main() {
  requireKeys()
  await mkdir(OUT, { recursive: true })

  const results = []
  let totalCost = 0
  const t0 = Date.now()

  for (const [i, tc] of testCases.entries()) {
    const n = String(i + 1).padStart(2, '0')
    const id = `${n}-${slug(tc.company_name) || 'case'}`
    const row = { id, company: tc.company_name, brief: false, ideogram: false, recraft: null, cost: 0, error: null }
    console.log(`\n[${n}/10] ${tc.company_name} (${tc.industry})`)

    try {
      // Paso 1 — brief
      const brief = await generateBrief(tc)
      row.brief = true
      row.cost += COST.brief
      await writeFile(join(OUT, `${id}.brief.json`), JSON.stringify(brief, null, 2))
      console.log(`  ✓ brief ok`)

      // Paso 2 — Ideogram (usamos la variante "combined" para el smoke test)
      const pngUrl = await runIdeogram(brief.prompts.combined)
      const bytes = await download(pngUrl, join(OUT, `${id}.png`))
      row.ideogram = true
      row.cost += COST.ideogramPerImage
      console.log(`  ✓ ideogram PNG (${(bytes / 1024).toFixed(0)} KB)`)

      // Paso 4 — Recraft SVG (solo casos marcados)
      if (tc.recraft) {
        row.recraft = false
        const svgUrl = await runRecraft(brief.prompts.combined)
        await download(svgUrl, join(OUT, `${id}.svg`))
        row.recraft = true
        row.cost += COST.recraft
        console.log(`  ✓ recraft SVG`)
      }
    } catch (err) {
      row.error = err?.message ?? String(err)
      console.error(`  ✗ caso abortado: ${row.error}`)
    }

    totalCost += row.cost
    results.push(row)
  }

  const secs = ((Date.now() - t0) / 1000).toFixed(0)
  await writeReport(results, totalCost, secs)

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Hecho en ${secs}s · coste estimado ~$${totalCost.toFixed(2)}`)
  console.log(`Outputs y informe en ./${OUT}/`)
  console.log(`Ahora EVALÚA a mano y rellena docs/sprint0-results.md (veredicto §7.3).`)
}

async function writeReport(results, totalCost, secs) {
  const ok = (b) => (b === true ? '✓' : b === false ? '✗' : '—')
  const lines = [
    '# Sprint 0 — resultados de la corrida (automático)',
    '',
    `Generado: ${new Date().toISOString()} · duración ${secs}s · coste estimado ~$${totalCost.toFixed(2)}`,
    '',
    '| # | Empresa | Brief | Ideogram | Recraft SVG | ¿Texto correcto? (manual) | Notas |',
    '|---|---|---|---|---|---|---|',
    ...results.map(
      (r) => `| ${r.id.slice(0, 2)} | ${r.company} | ${ok(r.brief)} | ${ok(r.ideogram)} | ${ok(r.recraft)} | ⬜ | ${r.error ? 'ERROR: ' + r.error : ''} |`,
    ),
    '',
    '## Evaluación manual (rellenar mirando los archivos en sprint0-output/)',
    '- [ ] ¿Texto del nombre correcto en Ideogram en >85% de los casos? (§7.3 requisito)',
    '- [ ] ¿SVG de Recraft visualmente consistente con el concepto de Ideogram?',
    '- [ ] Decisión SVG: **réplica** vs **vector edition** (§7.3)',
    '',
    'Traslada el veredicto final a docs/sprint0-results.md y actualiza la skill fal-ai-pipeline.',
  ]
  await writeFile(join(OUT, 'RESULTS.md'), lines.join('\n'))
}

main().catch((err) => {
  console.error('\n💥 Fallo no controlado:', err)
  process.exit(1)
})
