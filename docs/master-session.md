# Sesión Master — generadora de prompts

Objetivo de esta sesión (futura, aparte): producir un **prompt de arranque autocontenido
por cada sesión de desarrollo (0–8)**, para que cada sesión cargue solo su propio contexto.
No se ejecuta desarrollo aquí; solo se generan los prompts.

## Por qué existe
CLAUDE.md se carga siempre (guardarraíles). El spec/plan son demasiado grandes para cargar
enteros cada vez. La sesión master destila, del plan y el spec, un prompt mínimo por sesión
que dice exactamente: qué hacer, qué secciones leer, qué agente/skill usar, y qué verificar.

## Prompt de arranque (copiar/pegar para iniciar la sesión master)

```
Eres la sesión master de Branders AI. NO escribas código de producto.
Lee: CLAUDE.md, docs/plan.md (§3 división en sesiones) y docs/PROGRESS.md.

Genera un prompt de arranque autocontenido para cada sesión de desarrollo (0 a 8).
Escribe cada uno en su propio archivo: docs/session-prompts/SESSION-0.md ... SESSION-8.md.

Cada prompt debe incluir, en este orden y en español, listo para pegar en una sesión nueva:
1. Objetivo (1 frase, verificable) — tomado del plan.
2. Contexto a cargar: qué secciones del spec leer (p.ej. "docs/spec.md §3, §7") y
   "leer docs/PROGRESS.md primero". Nunca "cargar el spec entero".
3. Tareas concretas (la lista del plan para esa sesión).
4. Agente(s) a usar — MÁXIMO 2 (respetar la regla de CLAUDE.md) — y con qué instrucción
   (p.ej. Sesión 3: frontend-craftsman en modo contención).
5. Skill(s) a cargar para esa sesión.
6. Reglas de negocio innegociables que aplican a esa sesión (de CLAUDE.md).
7. Output verificable + cómo probarlo (curl / browser / Stripe CLI).
8. Cierre: commit + actualizar docs/PROGRESS.md.

Respeta las decisiones ya tomadas: Basic $19, SVG solo post-pago, slugs de fal.ai a
confirmar en Sesión 0, maxDuration:300 en Vercel. Mantén cada prompt corto y operativo.
Al terminar, deja un índice en docs/session-prompts/README.md.
```

## Resultado esperado
```
docs/session-prompts/
  README.md         índice
  SESSION-0.md      validación pipeline
  SESSION-1.md      fundación
  ...
  SESSION-8.md      hardening + launch
```

## Flujo de trabajo después
Para cada sesión de desarrollo: abrir Claude Code en el repo → pegar el contenido de
`docs/session-prompts/SESSION-X.md` → trabajar → cerrar con commit + PROGRESS.md.
Si algo cambia estructuralmente, re-correr la sesión master para regenerar los prompts.
