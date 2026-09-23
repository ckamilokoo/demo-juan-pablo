# Plan de construcción — Demo GM-generadora

Demo navegable del sistema de monitoreo predictivo de bombas (proyecto origen: `../GM-generadora`), funcionando con datos dummy y gráficos que se actualizan en tiempo real. Objetivo: presentar lo que el equipo es capaz de construir.

## Alcance

| Incluido | Excluido |
|---|---|
| Login simple con diseño 3D (turbina animada) | SSO Entra ID real |
| Visión general (alertas, eficiencia/potencia, bitácoras) | ChatBot (SSE) |
| Alertas con escenario de anomalías | Feedback |
| Señales/sensores Bomba A y Bomba B | Vistas de bitácoras detalladas (Logs/LogsB) |
| Gráficos en tiempo real | Backend, Docker, CI/CD (por ahora) |
| *(Opcional)* Análisis de anomalías A/B | |

## Estrategia

En el proyecto origen **todo el acceso a datos pasa por `utils/authFetch.ts`**. Se copia la UI tal cual y solo se reemplaza ese archivo por un **simulador en el navegador**:

- El simulador intercepta la URL y responde un `Response` con JSON dummy en el mismo formato del backend real.
- Composables, Vue Query y componentes quedan intactos → demo fiel al sistema real con mínimo esfuerzo.
- **Tiempo real**: Vue Query refetch global cada 2–3 s; el simulador genera una ventana de tiempo deslizante basada en `Date.now()`, así cada consulta trae puntos nuevos.
- `SensoresUnificado` ya actualiza in-place (`chart.update('none')`) y ECharts usa `setOption`, así que no hay parpadeo.
- Sin backend ni variables de entorno: `npm run dev` y listo.

## Qué copiar desde `GM-generadora`

### ✅ Copiar tal cual

| Archivo | Propósito |
|---|---|
| `nuxt.config.ts`, `tailwind.config.js`, `tsconfig.json`, `app.vue`, `assets/main.css` | Base del proyecto |
| `package.json` | Sin dependencias muertas (`@auth/core`, `openid-client`, `@sidebase/nuxt-auth`, `dotenv`, `apexcharts`, `vue3-apexcharts`, `class-variance-authority`, `tslib`) |
| `config/bombasConfig.ts`, `sensoresConfig.ts`, `sensoresAnomaliasConfig.ts`, `sensorsUIConfig.ts` | Sensores, unidades, colores |
| `components/Overview.vue` + `components/overview/*` (4 archivos) | Visión general |
| `components/SensoresUnificado.vue` | Señales |
| `components/BombaActivaBadge.vue`, `UltimaCargaBadge.vue` | Header |
| `composables/useAlertas`, `useBombaActiva`, `useEficiencia`, `usePotencias`, `useSensores`, `useBitacoras`, `useUltimaCarga`, `useTheme`, `useResponsive`, `factories/*` | Capa de datos (sin cambios) |
| `utils/chartUtils.js`, `alinearSeries.ts`, `toleranciaDataset.js` | Gráficos |
| `plugins/chartjs.js` | Registro Chart.js |

### ✏️ Copiar y adaptar

| Archivo | Cambio |
|---|---|
| `pages/login.vue` | Mantener diseño 3D; `$auth.login()` → login fake (cualquier usuario/clave, guarda flag en `localStorage`, redirige a `/`) |
| `pages/index.vue` | Solo vistas `overview`, `sensors`, `sensorsB` (+ `anomaliasA/B` si aplica). Quitar ChatBot, Feedback, Logs, botón docs API |
| `components/Sidebar.vue` | Menú reducido; logout limpia flag demo |
| `middleware/auth.global.ts` | Chequear flag demo en vez de JWT |
| `plugins/vue-query.ts` | `staleTime: 0`, `refetchInterval: 3000` globales |
| `composables/useTracking.ts` | `push`/`flush` como no-op |

### 🆕 Crear

| Archivo | Rol |
|---|---|
| `utils/authFetch.ts` | Misma firma que el original; retorna `new Response(JSON.stringify(mock(url)))` |
| `mock/simulador.ts` | Generador de series: seno + ruido + deriva, determinista por timestamp (sin saltos entre refetch) |
| `mock/escenario.ts` | Guion de la demo: botón oculto dispara anomalía (vibración sube → `clasificacion=1` → alerta crítica); rota bomba activa A → A/B → B |
| `mock/fixtures/` | JSON reales capturados de producción como plantilla de formato |
| `plugins/auth.js` | `$auth` fake con `userInfo` de usuario demo |

### ❌ No copiar

`server/` (Entra ID), `utils/sesion.ts` (se reemplaza), `ChatBot`, `Feedback*`, `Logs*`, `Sensors.vue` / `SensorsB.vue` (legacy), páginas `test_*` y `demo-charts`, `Dockerfile`, workflow de deploy.

## Endpoints que debe responder el simulador

| URL | Respuesta |
|---|---|
| `/sensores/{tipo}`, `/sensores_b/{tipo}` (25 × 2) | `[{ tiempo_sensor, valor_sensor, clasificacion }]` con rangos realistas por unidad (°C, barg, kg/h, A, ms, MW) |
| `/sensores/eficiencia`, `/sensores_b/eficiencia`, `/sensores/potencias` | Series temporales según `dias` / `max_puntos` |
| `/alertas_umbral/todas_alertas?dias=` | Lista que crece según el escenario |
| `/bomba_activa/actual` | `"A"` \| `"B"` \| `"A/B"` \| `"O"` según guion |
| `/estado-datos/ultima-carga` | `now()` |
| `/gm-bitacoras/.../todas`, `/todas_fallas` | Fixtures estáticos |

**Paso previo recomendado:** capturar una vez el JSON real de cada endpoint (DevTools → Network) y guardarlo en `mock/fixtures/` para que los formatos sean exactos.

## Fases

| # | Fase | Estimado | Entregable |
|---|---|---|---|
| 1 | Base | ~1 h | Nuxt scaffold, archivos ✅ copiados, `npm install` OK |
| 2 | Simulador | ~3 h | `authFetch` mock, fixtures, series, escenario |
| 3 | Login + shell | ~1 h | Login 3D fake, middleware, sidebar, index reducido |
| 4 | Tiempo real | ~1 h | Refetch activo, sin flicker ni reset de zoom, guion de anomalía probado de punta a punta |
| 5 | *(Opcional)* Anomalías A/B | ~2 h | `AnalisisAnomaliasA/B` + `GraficoAnomalia` + `GraficoConjunto` con mocks |

**Total:** ~6 h (8 h con fase 5).

## Criterios de aceptación

- [ ] `npm run dev` levanta sin backend ni `.env`.
- [ ] Login con cualquier credencial entra al dashboard; logout vuelve al login.
- [ ] Visión general muestra alertas, gráficos de eficiencia/potencia y bitácoras con datos.
- [ ] Señales A y B muestran los 25 sensores agrupados (Temperatura / Vibración / Otros).
- [ ] Gráficos avanzan en tiempo real sin parpadeo.
- [ ] Anomalía programada aparece: punto rojo en gráfico + alerta nueva en el panel.
- [ ] Badge de bomba activa cambia según el escenario.
- [ ] Modo claro/oscuro funciona.

## Decisiones (2026-09-23)

1. **Branding**: genericizar. Quitar "Generadora Metropolitana", logo GM y email corporativo (`pages/login.vue`, `components/Sidebar.vue`, `public/favicon.ico`). Las rutas internas `/gm-bitacoras` no se ven en UI y se mantienen.
2. **Fase 5**: incluida — vista de Anomalías A/B.
3. **Escenario**: botón oculto para disparar la anomalía en vivo durante la presentación (sin loop automático).

## Avance

- [x] **Fase 1 — Base**: archivos ✅ copiados, `package.json` limpio (solo deps usadas), `nuxt.config.ts` sin proxy ni Entra ID, `npm install` OK (0 vulnerabilidades). Imports pendientes: `utils/authFetch` (fase 2) y `composables/useTracking` (fase 3).
- [ ] Fase 2 — Simulador
- [ ] Fase 3 — Login + shell
- [ ] Fase 4 — Tiempo real
- [ ] Fase 5 — Anomalías A/B
