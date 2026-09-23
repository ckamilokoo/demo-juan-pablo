# Demo — Modelo IA Bombas

Demo interactiva de una plataforma de **monitoreo predictivo industrial** para bombas de agua de alimentación en una central generadora. Muestra sensores en tiempo real, detección de anomalías con ML, alertas y eficiencia operacional, todo funcionando con **datos simulados** (sin backend).

> Basada en el proyecto productivo `GM-generadora`. Esta versión existe para presentaciones comerciales y técnicas.

## Qué muestra

- **Login** con diseño 3D (turbina animada).
- **Visión general**: panel de alertas (críticas / alertas / avisos), gráficos de eficiencia vs. potencia del sistema y por bomba, bitácoras operacionales.
- **Señales**: 25 sensores por bomba (Bomba A y Bomba B), agrupados en Temperatura, Vibración y Otros, con puntos clasificados como normales o anómalos.
- **Tiempo real**: los gráficos se actualizan cada pocos segundos.
- **Arranque en vacío**: la app parte sin datos. El botón **Iniciar transmisión** conecta la planta: las señales empiezan a llegar y los gráficos se llenan en vivo.
- **Evento guiado**: ~10 s después un sensor empieza a desviarse en escalones y escala **aviso → alerta → crítica**. Cada sensor tiene su propio contador de alertas (1.ª = aviso, 2.ª = alerta, 3.ª+ = crítica); cada clic en **Simular evento** escala el siguiente sensor principal (corriente → vibración axial → temp. descanso bomba). En cada evento, dos sensores relacionados se desvían a la vez (p. ej. corriente + excentricidad + vibración X interna), con su propia alerta. Un indicador muestra *Recibiendo datos → Modelo IA analizando → ¡Anomalía detectada!* y las alertas saltan como notificaciones con acceso directo al análisis. Cada clic posterior en **Simular evento** genera un evento nuevo.
- **Panel oculto** (`Shift+D`): disparar anomalías en cualquier sensor/bomba/nivel, cambiar la bomba en operación y reiniciar la demo a vacío. `Shift+X` dispara una anomalía directa.
- **Análisis de anomalías** por bomba: detalle del sensor anómalo, contexto temporal y comparación con otros sensores.
- **Atlas, agente de voz** (OpenAI Realtime + LangGraph): se le habla y controla la interfaz: cambia de vista, muestra u oculta gráficos, abre anomalías en modo individual/combinado/conjunto, simula eventos, reinicia, cambia tema; y responde preguntas sobre la planta consultando a un analista LangGraph.
- Modo claro / oscuro y diseño responsive.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Nuxt 3 (SPA, `ssr: false`) + Vue 3 + TypeScript |
| Estilos | Tailwind CSS 3 |
| Gráficos | Chart.js 4 (sensores) + ECharts (eficiencia) |
| Estado servidor | TanStack Vue Query (refetch periódico) |
| Datos | Simulador en el navegador (`mock/`) |

## Requisitos

- Node.js 20+ (LTS)
- npm

## Inicio rápido

```bash
npm install
cp .env.example .env   # y pega tu OPENAI_API_KEY (solo para el agente de voz)
npm run dev
```

Abrir http://localhost:3000 e ingresar con **cualquier usuario y contraseña**.

Sin `OPENAI_API_KEY` todo funciona salvo el agente de voz. Si la variable existe en el entorno del sistema, tiene prioridad sobre `.env`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualizar el build |
| `npm run generate` | Sitio estático (**sin** agente de voz: necesita las rutas de servidor) |

## Cómo funciona la simulación

En la aplicación real, todas las peticiones al backend pasan por `utils/authFetch.ts`. En esta demo ese archivo se reemplaza por un **simulador** que intercepta la URL y responde JSON con el mismo formato del backend real:

```
Componente → composable (Vue Query) → authFetch(url) → mock/simulador.ts → JSON dummy
```

- `mock/simulador.ts` — genera series temporales (seno + ruido + deriva) deterministas por timestamp, con rangos realistas por unidad (°C, barg, kg/h, A, ms, MW).
- `mock/escenario.ts` — estado de la demo: inicio de la transmisión, anomalías, alertas derivadas y bomba activa. Antes de iniciar la transmisión todos los endpoints responden vacío.
- `composables/useEventoDemo.ts` — secuencia guiada del botón (fases, episodio correlacionado, refrescos).

Como la capa de UI y datos es idéntica a la del sistema real, lo que se ve en la demo es exactamente lo que ve el operador en producción.

## Agente de voz "Atlas"

```
Micrófono ──WebRTC──▶ OpenAI Realtime (gpt-realtime) ──▶ voz de respuesta
                          │ llamadas a herramientas (canal oai-events)
                          ▼
            agente/herramientasVoz.ts (en el navegador)
             ├─ UI: navegar, mostrar/ocultar señales, ver anomalías, eficiencia,
             │      simular/reiniciar, bomba en operación, tema  ──▶ bus useControlUI
             └─ consultar_analista ──▶ POST /api/agente/analista
                                         LangGraph (StateGraph ReAct: analista ⇄ tools)
                                         tools: resumen_planta, listar_alertas,
                                         lecturas_sensores, detalle_sensor, eficiencia_planta
```

- `server/api/voz/sesion.post.ts` emite una **clave temporal** (10 min); la API key nunca llega al navegador.
- El navegador arma una foto del estado (`agente/estadoPlanta.ts`: alertas, lecturas de los 50 sensores, eficiencia, vista actual) y la manda al analista en cada consulta, porque los datos simulados viven en el cliente.
- Botón flotante abajo a la derecha (orbe animado según escucha / piensa / habla). El panel muestra la transcripción, las acciones ejecutadas y un campo para escribir si hay ruido en la sala.
- Frases de ejemplo: "inicia la transmisión", "muéstrame solo la corriente y la vibración axial de la bomba A", "¿qué está fallando?", "abre las anomalías de la bomba A en modo combinado", "pon los gráficos de eficiencia apilados", "cambia a tema claro", "reinicia la demo".
- **Enfoque automático**: cuando Atlas habla de una sección (alertas, bitácoras, eficiencia, gráficos de anomalías) la lleva a la vista con scroll y la resalta; al abrir gráficos los centra.
- **Correos con gráfico**: "mándale a mantenimiento el gráfico de corriente de la bomba A con la falla". Atlas captura el gráfico (canvas, no pantallazo), el analista redacta el cuerpo con los datos reales y aparece un **borrador editable** en el panel. Se envía solo al decir "sí, envíalo" o presionar *Enviar correo* (el envío por voz se bloquea si no hubo un turno del usuario después del borrador). Solo fallas, alertas o gráficos; máx. 5 destinatarios y 15 correos por hora. Requiere `SMTP_*` y opcionalmente `CONTACTOS_CORREO` en `.env`.
- Variables opcionales en `.env.example`: modelo del analista (`OPENAI_MODEL`), modelo de voz (`OPENAI_REALTIME_MODEL`) y voz (`OPENAI_VOICE`).

## Estructura

```
assets/         Estilos globales
components/     Overview, SensoresUnificado, Sidebar, badges
  overview/     AlertasPanel, BitacorasPanel, GraficosEficiencia, GraficoEficiencia
composables/    Queries de Vue Query (alertas, sensores, eficiencia, bomba activa…)
  factories/    Factories por bomba
config/         Configuración de bombas, sensores, unidades y colores
middleware/     Guardia de sesión demo
agente/         Herramientas de voz y foto del estado de planta
mock/           Simulador y escenario
server/         API de voz (clave temporal) y analista LangGraph
pages/          login, index (dashboard)
plugins/        Chart.js, Vue Query, auth demo
utils/          authFetch (mock), utilidades de gráficos
```

## Guía para presentar

1. Iniciar sesión → mostrar el login 3D.
2. **Visión general** vacía: sin alertas, sin gráficos, ninguna bomba activa.
3. Presionar **Iniciar transmisión** (la app se queda en la vista actual) → los gráficos de eficiencia muestran *Cargando datos…* y las líneas aparecen una a una; las señales empiezan a llegar en vivo.
4. A los ~10 s la corriente se desvía; el indicador pasa a *Modelo IA analizando* y sus alertas escalan: aviso, luego alerta y al final crítica. **Simular evento** repite la escalada en el siguiente sensor.
5. **Ver análisis →** en la notificación → *Análisis de Anomalías A*: sensores con fallas simultáneas, modos Individual / Combinado / Conjunto.
6. Volver a **Visión general**: alertas, bitácoras y eficiencia ya poblados.
7. Para repetir desde cero: botón **Reiniciar** del header (o `Shift+D` → *Reiniciar escenario*). La app vuelve a quedar vacía y se puede volver a presionar **Iniciar transmisión**.

En *Análisis de Anomalías*, cada evento deja 3 sensores con anomalías: **Combinado** los superpone con ejes por unidad y **Conjunto** precarga los sensores simultáneos (±15 min) en vista normalizada.

## Estado

Funcional (fases 1–5). Ver [`PLAN.md`](PLAN.md) para alcance y decisiones.
