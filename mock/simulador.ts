// Simulador de la API del backend. Recibe la URL que pediría el frontend y
// devuelve { status, body } con el mismo formato que la API real.
//
// Las series son deterministas por timestamp (misma señal + mismo instante =
// mismo valor), así cada refetch extiende la curva sin que el pasado "salte".
import { PASO_VIVO_S } from '~/config/demo';
import { normalizarSlug, perfilDe } from './perfiles';
import {
  escenario,
  alertasVisibles,
  anomaliaPorId,
  type Anomalia,
  type Bomba,
} from './escenario';

const MIN = 60_000;
const DIA = 24 * 60 * MIN;

// --- Utilidades numéricas ---

const hashTexto = (texto: string): number => {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
};

// Ruido pseudoaleatorio en [-1, 1], estable para (semilla, n).
const ruido = (semilla: number, n: number): number => {
  const x = Math.sin(semilla * 9973.13 + n * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

const redondear = (v: number, decimales: number) => {
  const f = 10 ** decimales;
  return Math.round(v * f) / f;
};

// Envolvente trapezoidal de una anomalía: sube en el primer 20 %, se mantiene
// y baja en el último 20 % de su duración.
const envolvente = (a: Anomalia, t: number): number => {
  if (t < a.inicio || t > a.fin) return 0;
  const x = (t - a.inicio) / (a.fin - a.inicio);
  if (x < 0.2) return x / 0.2;
  if (x > 0.8) return (1 - x) / 0.2;
  return 1;
};

// --- Señales ---

interface Lectura {
  valor: number;
  // 1 = normal, -1 = anómalo, 0 = sin clasificar (convención del backend real)
  clasificacion: 1 | -1 | 0;
}

const anomaliasDe = (bomba: Bomba, slug: string) => {
  const s = normalizarSlug(slug);
  return escenario.anomalias.filter((a) => a.bomba === bomba && normalizarSlug(a.sensor) === s);
};

export const leerSenal = (bomba: Bomba, slug: string, t: number): Lectura => {
  const p = perfilDe(slug);
  const semilla = hashTexto(`${bomba}:${normalizarSlug(slug)}`);
  const s = t / 1000;
  const escalaBomba = bomba === 'B' ? 1.015 : 1;

  let valor =
    p.base * escalaBomba +
    p.amplitud *
      (0.55 * Math.sin((2 * Math.PI * s) / 86400 + semilla * 6.28) +
        0.3 * Math.sin((2 * Math.PI * s) / 1700 + semilla * 12.1) +
        0.15 * Math.sin((2 * Math.PI * s) / 97 + semilla * 3.7)) +
    p.ruido * ruido(semilla, Math.round(s));

  let factor = 0;
  for (const a of anomaliasDe(bomba, slug)) {
    const e = envolvente(a, t) * a.intensidad;
    if (e > factor) factor = e;
  }
  valor += p.deltaAnomalia * factor;

  let clasificacion: Lectura['clasificacion'] = 1;
  if (factor > 0.25) clasificacion = -1;
  else if (ruido(semilla + 1, Math.round(s)) > 0.96) clasificacion = 0;

  return { valor: redondear(valor, p.decimales), clasificacion };
};

const horaTexto = (t: number) =>
  new Date(t).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

// Primer instante con datos: el inicio de la transmisión (null = sin datos).
const inicioDatos = () => escenario.transmisionInicio;

// Últimos `limite` puntos en vivo (paso PASO_VIVO_S), orden ascendente.
// Solo desde el inicio de la transmisión: el gráfico se llena de a poco.
const serieVivo = (bomba: Bomba, slug: string, limite: number) => {
  const inicio = inicioDatos();
  if (inicio === null) return [];
  const paso = PASO_VIVO_S * 1000;
  const ultimo = Math.floor(Date.now() / paso) * paso;
  const filas = [];
  for (let i = limite - 1; i >= 0; i--) {
    const t = ultimo - i * paso;
    if (t < inicio) continue;
    const { valor, clasificacion } = leerSenal(bomba, slug, t);
    filas.push({
      id: Math.floor(t / paso),
      tiempo_sensor: horaTexto(t),
      valor_sensor: valor,
      clasificacion,
      tiempo_ejecucion: new Date(t).toISOString(),
    });
  }
  return filas;
};

// Serie en un rango [desde, hasta] con como máximo `maxPuntos` puntos.
// Nunca pasa de "ahora": el futuro todavía no existe.
const serieRango = (bomba: Bomba, slug: string, desdePedido: number, hasta: number, maxPuntos = 600) => {
  const inicio = inicioDatos();
  if (inicio === null) return [];
  const desde = Math.max(desdePedido, inicio);
  const fin = Math.min(hasta, Date.now());
  if (fin <= desde) return [];
  const paso = Math.max(PASO_VIVO_S * 1000, Math.ceil((fin - desde) / maxPuntos / 1000) * 1000);
  const filas = [];
  for (let t = Math.ceil(desde / paso) * paso; t <= fin; t += paso) {
    const { valor, clasificacion } = leerSenal(bomba, slug, t);
    filas.push({
      tiempo_ejecucion: new Date(t).toISOString(),
      valor_sensor: valor,
      es_anomalia: clasificacion === -1,
    });
  }
  return filas;
};

const estadisticas = (datos: Array<{ es_anomalia: boolean }>) => {
  const anomalos = datos.filter((d) => d.es_anomalia).length;
  return {
    total_registros: datos.length,
    registros_anomalos: anomalos,
    registros_normales: datos.length - anomalos,
    porcentaje_anomalias: datos.length ? (anomalos / datos.length) * 100 : 0,
    puntos_devueltos: datos.length,
    submuestreado: false,
  };
};

// --- Eficiencia y potencia (ventana de días, submuestreada) ---

const gridDias = (dias: number, maxPuntos: number) => {
  const inicio = inicioDatos();
  if (inicio === null) return [];
  const ahora = Date.now();
  // Eficiencia y potencia son registros agregados de planta: al conectarse
  // se descarga también el histórico reciente, para que los gráficos tengan
  // líneas completas que dibujar (las señales de sensores parten de cero).
  const desde = Math.max(ahora - dias * DIA, inicio - HISTORICO_EFICIENCIA_MS);
  const paso = Math.max(PASO_VIVO_S * 1000, Math.ceil((ahora - desde) / maxPuntos / 1000) * 1000);
  const tiempos: number[] = [];
  for (let t = Math.ceil(desde / paso) * paso; t <= ahora; t += paso) tiempos.push(t);
  // Último punto pegado a "ahora" para que el borde derecho avance en vivo.
  const vivo = Math.floor(ahora / (PASO_VIVO_S * 1000)) * PASO_VIVO_S * 1000;
  if (tiempos[tiempos.length - 1] !== vivo) tiempos.push(vivo);
  return tiempos;
};

const HISTORICO_EFICIENCIA_MS = 6 * 60 * MIN;

const onda = (t: number, periodoS: number, fase: number) =>
  Math.sin((2 * Math.PI * (t / 1000)) / periodoS + fase);

const eficiencia = (bomba: Bomba, dias: number, maxPuntos: number) => {
  const semilla = hashTexto(`eficiencia:${bomba}`);
  return gridDias(dias, maxPuntos).map((t, i) => {
    const s = Math.round(t / 1000);
    const carga = 0.5 + 0.5 * onda(t, 86400, semilla * 6.28);
    return {
      id: i + 1,
      clasificacion: 1,
      tiempo_sensor: horaTexto(t),
      // B algo más baja que A para que ambas líneas se distingan en "Sistema".
      valor_sensor: redondear((bomba === 'B' ? 69 : 76) + 5 * carga + 1.1 * onda(t, 5400, semilla) + 0.4 * ruido(semilla, s), 2),
      potencia_kw: redondear(2600 + 700 * carga + 30 * ruido(semilla + 2, s), 1),
      presion_bar: redondear(158 + 9 * carga + 0.6 * ruido(semilla + 3, s), 2),
      flujo_kg_h: Math.round(150000 + 45000 * carga + 1500 * ruido(semilla + 4, s)),
      tiempo_ejecucion: new Date(t).toISOString(),
    };
  });
};

const potencias = (dias: number, maxPuntos: number) => {
  const semilla = hashTexto('potencias');
  return gridDias(dias, maxPuntos).map((t, i) => {
    const s = Math.round(t / 1000);
    const neta = redondear(
      232 + 26 * onda(t, 86400, semilla * 6.28) + 4 * onda(t, 3600, semilla) + 1.2 * ruido(semilla, s),
      2
    );
    return {
      id: i + 1,
      clasificacion: 1,
      tiempo_sensor: horaTexto(t),
      valor_sensor: neta,
      valor_neto: neta,
      valor_bruto: redondear(neta * 1.045, 2),
      contador_anomalias: null,
      tiempo_ejecucion: new Date(t).toISOString(),
    };
  });
};

// --- Bitácoras (estáticas, relativas al arranque) ---

const T0 = Date.now();
const BITACORAS_BASE: Array<[number, 'ALERTA' | 'AVISO' | null, string]> = [
  [0.2, 'ALERTA', 'Se detecta aumento de vibración en descanso lado acoplamiento. Se aumenta frecuencia de ronda a cada 2 horas y se informa a mantenimiento mecánico.'],
  [0.9, 'AVISO', 'Temperatura de descanso motor 3 °C sobre la tendencia semanal. Se revisa nivel de aceite: normal. Se deja en observación.'],
  [1.6, null, 'Cambio de turno sin novedades. Bomba en servicio con carga nominal.'],
  [2.3, 'AVISO', 'Presión de succión oscila levemente durante rampa de carga. Se verifica filtro de succión: diferencial dentro de rango.'],
  [3.1, 'ALERTA', 'Alarma de excentricidad durante arranque. Se detiene la bomba, se inspecciona alineamiento y se vuelve a poner en servicio sin recurrencia.'],
  [4.5, null, 'Prueba de transferencia A/B realizada con éxito. Tiempo de conmutación 4 s.'],
  [5.2, 'AVISO', 'Corriente del motor 2 % sobre lo esperado para la carga actual. Se programa termografía del tablero.'],
  [6.8, 'ALERTA', 'Fuga menor en sello mecánico detectada en ronda. Se programa cambio de sello en próxima detención.'],
  [8.4, null, 'Mantenimiento preventivo mensual completado: lubricación y revisión de acoplamiento.'],
  [10.1, 'AVISO', 'Flujo de descarga bajo el setpoint por 15 min durante ajuste de válvula de recirculación.'],
  [12.7, 'ALERTA', 'Temperatura de estator alcanza 96 °C en jornada de alta temperatura ambiente. Se refuerza ventilación de sala.'],
  [15.3, 'AVISO', 'Se reemplaza transmisor de presión de agua de economizador por deriva de calibración.'],
];

const bitacoras = (bomba: Bomba, soloFallas: boolean) =>
  inicioDatos() === null ? [] : BITACORAS_BASE.map(([haceDias, nivel, texto], i) => ({
    id: (bomba === 'A' ? 1 : 501) + i,
    alerta_aviso: nivel,
    bitacora: bomba === 'A' ? texto : texto.replace('lado acoplamiento', 'lado libre'),
    tiempo_ejecucion: new Date(T0 - (haceDias + (bomba === 'B' ? 0.35 : 0)) * DIA).toISOString(),
  })).filter((b) => !soloFallas || b.alerta_aviso !== null);

// --- Enrutador ---

export interface RespuestaSimulada {
  status: number;
  body: unknown;
}

const ok = (body: unknown): RespuestaSimulada => ({ status: 200, body });
const noEncontrado = (ruta: string): RespuestaSimulada => ({
  status: 404,
  body: { detail: `Ruta no simulada: ${ruta}` },
});

const num = (q: URLSearchParams, clave: string, defecto: number) => {
  const v = Number(q.get(clave));
  return Number.isFinite(v) && v > 0 ? v : defecto;
};

export const responder = (url: string): RespuestaSimulada => {
  const u = new URL(url, 'http://demo.local');
  // Quita el prefijo de apiUrl ("/api") si viene.
  const ruta = u.pathname.replace(/^\/api(?=\/)/, '');
  const q = u.searchParams;
  let m: RegExpMatchArray | null;

  if (ruta === '/bomba_activa/actual') return ok({ bomba_activa: escenario.bombaActiva });

  if (ruta === '/estado-datos/ultima-carga') {
    const ahora = new Date();
    if (inicioDatos() === null) {
      const vacio = { ultima_carga: null, texto: null, hace_minutos: null };
      return ok({ ahora: ahora.toISOString(), zona_horaria: 'America/Santiago', senales: vacio, bitacoras: vacio });
    }
    const hace = (min: number) => new Date(ahora.getTime() - min * MIN).toISOString();
    return ok({
      ahora: ahora.toISOString(),
      zona_horaria: 'America/Santiago',
      senales: { ultima_carga: ahora.toISOString(), texto: ahora.toLocaleString('es-CL'), hace_minutos: 0, bomba_a: hace(0), bomba_b: hace(0) },
      bitacoras: { ultima_carga: hace(0), texto: ahora.toLocaleString('es-CL'), hace_minutos: 0 },
    });
  }

  if (ruta === '/alertas_umbral/todas_alertas') {
    const dias = num(q, 'dias', 2);
    const data = alertasVisibles(dias);
    return ok({ data, total_alertas: data.length, filtro_dias: dias });
  }

  if ((m = ruta.match(/^\/alertas_umbral\/(\d+)\/datos_anomalia(_contexto)?$/))) {
    const a = anomaliaPorId(Number(m[1]));
    if (!a) return noEncontrado(ruta);
    const bomba = (q.get('bomba') as Bomba) || a.bomba;
    const antes = num(q, 'minutos_antes', 30) * MIN;
    const despues = num(q, 'minutos_despues', 30) * MIN;
    const datos = serieRango(bomba, a.sensor, a.inicio - (m[2] ? antes : 0), a.fin + (m[2] ? despues : 0), 400);
    return ok({
      alerta_id: a.id,
      tipo_sensor: a.sensor,
      timestamp: new Date(a.deteccion).toISOString(),
      periodo_anomalo: {
        timestamp_inicio: new Date(a.inicio).toISOString(),
        timestamp_fin: new Date(a.fin).toISOString(),
        duracion_minutos: Math.round((a.fin - a.inicio) / MIN),
      },
      estadisticas: estadisticas(datos),
      datos,
    });
  }

  if ((m = ruta.match(/^\/alertas_umbral\/sensor\/([AB])\/([^/]+)\/datos$/))) {
    const desde = Date.parse(q.get('fecha_inicio') || '');
    const hasta = Date.parse(q.get('fecha_fin') || '');
    if (Number.isNaN(desde) || Number.isNaN(hasta)) return { status: 422, body: { detail: 'Rango inválido' } };
    const datos = serieRango(m[1] as Bomba, decodeURIComponent(m[2]), desde, hasta, num(q, 'max_puntos', 600));
    return ok({ datos, estadisticas: estadisticas(datos) });
  }

  if (ruta === '/sensores/potencias') return ok(potencias(num(q, 'dias', 1), num(q, 'max_puntos', 2000)));

  if ((m = ruta.match(/^\/sensores(_b)?\/eficiencia$/))) {
    return ok(eficiencia(m[1] ? 'B' : 'A', num(q, 'dias', 1), num(q, 'max_puntos', 2000)));
  }

  if ((m = ruta.match(/^\/sensores(_b)?\/predicciones-bomba-[ab]$/))) return ok([]);

  if ((m = ruta.match(/^\/sensores(_b)?\/([^/]+)$/))) {
    const limite = Math.min(num(q, 'limite', 40), 2000);
    return ok(serieVivo(m[1] ? 'B' : 'A', m[2], limite));
  }

  if ((m = ruta.match(/^\/gm-bitacoras(\/b)?\/(todas|todas_fallas)$/))) {
    return ok(bitacoras(m[1] ? 'B' : 'A', m[2] === 'todas_fallas'));
  }

  return noEncontrado(ruta);
};

// --- Resumen para el agente de voz ---

/** Bitácoras de ambas bombas (vacías antes de iniciar la transmisión). */
export const bitacorasActuales = () => [...bitacoras('A', false).map((b) => ({ ...b, bomba: 'A' as const })), ...bitacoras('B', false).map((b) => ({ ...b, bomba: 'B' as const }))];

/** Última lectura de eficiencia por bomba y potencia del sistema (o null sin datos). */
export const ultimaEficiencia = () => {
  const ultimo = <T>(filas: T[]) => (filas.length ? filas[filas.length - 1] : null);
  return {
    A: ultimo(eficiencia('A', 1, 50)),
    B: ultimo(eficiencia('B', 1, 50)),
    potencia: ultimo(potencias(1, 50)),
  };
};
