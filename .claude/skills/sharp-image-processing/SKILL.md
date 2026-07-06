---
name: sharp-image-processing
description: >
  Recetas Sharp para Branders AI: watermark diagonal sobre previews, quitar fondo blanco
  (threshold + alpha), tint monocromatico negro/blanco, resize a favicon/app icon/PNG 4000px,
  y composite de mockups por template con coordenadas. Cargar en Sesiones 2, 4 y 5, o al
  procesar cualquier imagen del pipeline.
---

# Sharp — procesamiento de imagen (Branders AI)

Server-side. `import sharp from 'sharp'`. Todo trabaja sobre Buffers (input desde fal.ai
URL o bucket). Snippets base — ajustar valores tras probar con outputs reales.

## 1. Watermark diagonal (preview, Sesion 2)
Tile de texto "PREVIEW" repetido en diagonal sobre el PNG de Ideogram.
    const wm = Buffer.from(
      `<svg width="800" height="800">
        <text x="400" y="400" font-size="48" fill="rgba(0,0,0,0.18)"
          text-anchor="middle" transform="rotate(-30 400 400)">PREVIEW</text>
       </svg>`)
    const out = await sharp(previewBuf)
      .resize(800, 800, { fit: 'cover' })
      .composite([{ input: wm, tile: true, blend: 'over' }])
      .png().toBuffer()

## 2. Quitar fondo blanco -> PNG transparente (Sesion 4)
Ideogram entrega fondo blanco. Convertir blanco (~>240) en alpha.
    const { data, info } = await sharp(logoBuf).ensureAlpha().raw()
      .toBuffer({ resolveWithObject: true })
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) data[i+3] = 0  // alpha=0
    }
    const transparent = await sharp(data, { raw: info }).png().toBuffer()
> Umbral 240 es punto de partida; subir/bajar segun cuanto blanco real tenga el logo.

## 3. Versiones monocromaticas (negra / blanca, Sesion 4)
Sobre el PNG transparente del paso 2, teñir la silueta.
    const mono = (rgb) => sharp(transparentBuf)
      .flatten({ background: '#ffffff' })         // fondo temporal para umbralizar
      .threshold(128).negate({ alpha: false })
      .tint(rgb).png().toBuffer()
    // negra: '#000000' | blanca: '#ffffff' (para fondos oscuros)
> Alternativa mas simple si el logo ya es silueta limpia: `.grayscale().threshold()` +
> recomponer alpha. Validar visualmente ambos caminos con el output real.

## 4. Resizes de entrega (Sesion 4)
    const png4000  = sharp(logoBuf).resize(4000, 4000, { fit: 'contain', background: '#fff' })
    const fav32    = sharp(transparentBuf).resize(32, 32)
    const fav64    = sharp(transparentBuf).resize(64, 64)
    const appIcon  = sharp(transparentBuf).resize(512, 512)
    // .png().toBuffer() cada uno; favicon/app icon sobre el transparente.

## 5. Mockups por template (Complete, Sesion 5)
6 templates PNG (business card, letterhead, IG profile, web header, t-shirt, storefront).
Coordenadas de insercion en un JSON de config por template.
    // config: { file, x, y, w, h, rotate? }
    const logoResized = await sharp(logoBuf).resize(cfg.w, cfg.h, { fit: 'contain' })
      .png().toBuffer()
    const mockup = await sharp(templateBuf)
      .composite([{ input: logoResized, left: cfg.x, top: cfg.y }])
      .png().toBuffer()
> Los templates los diseñas tu (Figma/Photoshop) antes de la sesion; Sharp solo integra.

## Notas
- Trabaja siempre en memoria (Buffer) y sube resultados al bucket correspondiente.
- Paleta de color: extraer del PNG elegido para pasarla a Recraft (`colors`) y al brief.
  Considera libreria de extraccion (p.ej. node-vibrant) + merge con color_rationale del LLM.
