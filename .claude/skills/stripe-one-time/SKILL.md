---
name: stripe-one-time
description: >
  Pago unico con Stripe + Next.js App Router: Checkout Session en payment mode, webhook
  con verificacion de firma sobre RAW body en route handler, idempotencia (un webhook
  puede llegar duplicado), y testing con Stripe CLI. Cargar en la Sesion 4 o al tocar
  /api/checkout o /api/webhooks/stripe. Reutilizable en futuros SaaS.
---

# Stripe pago unico (App Router)

`mode: "payment"` (NO subscription). Secret key y webhook secret solo en servidor.
El precio/producto se deciden en SERVIDOR; nunca confiar en importes del cliente.

## 1. Checkout Session — POST /app/api/checkout/route.js
    import Stripe from 'stripe'
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    export async function POST(req) {
      const { sessionId, plan } = await req.json()
      const amount = plan === 'complete' ? 4900 : 1900   // $49 / $19 (server-side)
      // crea order 'pending' en DB con sessionId + plan + amount ANTES de redirigir
      const checkout = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price_data: {
          currency: 'usd',
          product_data: { name: plan === 'complete' ? 'Complete Launch Kit' : 'Basic Launch Kit' },
          unit_amount: amount,
        }, quantity: 1 }],
        success_url: `${process.env.APP_URL}/success/${sessionId}`,
        cancel_url:  `${process.env.APP_URL}/create/${sessionId}`,
        metadata: { sessionId, plan },
      })
      // guarda checkout.id en order.stripe_session_id (UNIQUE)
      return Response.json({ url: checkout.url })
    }

## 2. Webhook — POST /app/api/webhooks/stripe/route.js
**Necesita el RAW body.** En App Router usa `await req.text()` (NO req.json()) y pasa el
string tal cual a constructEvent. No hay bodyParser que desactivar aqui.
    export async function POST(req) {
      const body = await req.text()                       // raw, sin parsear
      const sig  = req.headers.get('stripe-signature')
      let event
      try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
      } catch (err) {
        return new Response(`Webhook signature failed: ${err.message}`, { status: 400 })
      }
      if (event.type === 'checkout.session.completed') {
        const s = event.data.object
        // IDEMPOTENCIA: leer el order por stripe_session_id
        // si status ya es 'paid'/'processing'/'ready' -> return 200 SIN re-procesar
        // si no -> marcar 'paid'/'processing', lanzar ensamblaje (Recraft + Sharp + ZIP)
      }
      return Response.json({ received: true })             // 2xx rapido
    }

## 3. Idempotencia (innegociable)
- Un evento puede llegar duplicado o fuera de orden. Comprobar estado en DB antes de
  ejecutar efectos secundarios. Opcional: guardar `event.id` procesados para deduplicar.
- **Desbloquear el entregable SOLO por webhook verificado**, nunca por el redirect de
  success (el usuario puede no volver o falsear la vuelta).
- Fallo real -> devolver no-2xx para que Stripe reintente. Duplicado ya manejado -> 200.

## 4. Testing con Stripe CLI (local)
    stripe login
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
    # copia el whsec_... que imprime -> STRIPE_WEBHOOK_SECRET en .env.local
    stripe trigger checkout.session.completed
Probar tambien entregas duplicadas (disparar el mismo evento 2x) para validar idempotencia.

## Notas
- STRIPE_SECRET_KEY (sk_test_ / sk_live_) y STRIPE_WEBHOOK_SECRET (whsec_) solo servidor.
- Modo test hasta el launch; a live solo en la sesion de hardening con compra real.
- Con Context7 MCP verifica la version de la API de Stripe antes de fijar params.
