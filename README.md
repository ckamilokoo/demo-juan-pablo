# Demo — Modelo IA Bombas

Demo interactiva de una plataforma de **monitoreo predictivo industrial** para bombas de agua de alimentación en una central generadora. Muestra sensores en tiempo real, detección de anomalías con ML, alertas y eficiencia operacional, todo funcionando con **datos simulados** (sin backend).

> Basada en el proyecto productivo `GM-generadora`. Esta versión existe para presentaciones comerciales y técnicas.

## Qué muestra

- **Login** con diseño 3D (turbina animada).
- **Visión general**: panel de alertas (críticas / alertas / avisos), gráficos de eficiencia vs. potencia del sistema y por bomba, bitácoras operacionales.
- **Señales**: 25 sensores por bomba (Bomba A y Bomba B), agrupados en Temperatura, Vibración y Otros, con puntos clasificados como normales o anómalos.
- **Tiempo real**: los gráficos se actualizan cada pocos segundos.
- **Escenario guionado**: un botón oculto inyecta una anomalía en vivo (p. ej. subida de vibración) que aparece en el gráfico y genera una alerta nueva; la bomba activa rota entre A, A/B y B.
- **Análisis de anomalías** por bomba: detalle del sensor anómalo, contexto temporal y comparación con otros sensores.
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
npm run dev
```

Abrir http://localhost:3000 e ingresar con **cualquier usuario y contraseña**.

No requiere `.env` ni backend.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualizar el build |
| `npm run generate` | Sitio estático (desplegable en cualquier hosting estático) |

## Cómo funciona la simulación

En la aplicación real, todas las peticiones al backend pasan por `utils/authFetch.ts`. En esta demo ese archivo se reemplaza por un **simulador** que intercepta la URL y responde JSON con el mismo formato del backend real:

```
Componente → composable (Vue Query) → authFetch(url) → mock/simulador.ts → JSON dummy
```

- `mock/simulador.ts` — genera series temporales (seno + ruido + deriva) deterministas por timestamp, con rangos realistas por unidad (°C, barg, kg/h, A, ms, MW).
- `mock/escenario.ts` — guion de la demo: inyección de anomalías, generación de alertas y rotación de bomba activa.
- `mock/fixtures/` — plantillas de formato de respuesta.

Como la capa de UI y datos es idéntica a la del sistema real, lo que se ve en la demo es exactamente lo que ve el operador en producción.

## Estructura

```
assets/         Estilos globales
components/     Overview, SensoresUnificado, Sidebar, badges
  overview/     AlertasPanel, BitacorasPanel, GraficosEficiencia, GraficoEficiencia
composables/    Queries de Vue Query (alertas, sensores, eficiencia, bomba activa…)
  factories/    Factories por bomba
config/         Configuración de bombas, sensores, unidades y colores
middleware/     Guardia de sesión demo
mock/           Simulador, escenario y fixtures
pages/          login, index (dashboard)
plugins/        Chart.js, Vue Query, auth demo
utils/          authFetch (mock), utilidades de gráficos
```

## Guía para presentar

1. Iniciar sesión → mostrar el login 3D.
2. **Visión general** → explicar alertas y eficiencia vs. potencia.
3. **Señales Bomba A** → mostrar los gráficos avanzando en tiempo real.
4. Disparar la anomalía con el botón oculto → punto rojo en el gráfico + alerta nueva en el panel.
5. Cambiar a **Bomba B** y alternar modo oscuro.

## Estado

En construcción. Ver [`PLAN.md`](PLAN.md) para fases, alcance y decisiones pendientes.
