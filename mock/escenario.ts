// Guion de la demo: transmisión de datos, anomalías disparadas en vivo, las
// alertas que generan y bomba activa. Estado en memoria del navegador; se reinicia al
// recargar la página.
import { buscarConfigSensor } from '~/config/sensoresAnomaliasConfig';
import { perfilDe, normalizarSlug } from './perfiles';
import { conocimientoDe } from '~/config/conocimientoSensores';

export type Bomba = 'A' | 'B';
export type NivelAlerta = 'CRÍTICA' | 'ALERTA' | 'AVISO';
export type EstadoBomba = 'A' | 'B' | 'A/B' | 'O';

export interface Anomalia {
  id: number;
  bomba: Bomba;
  // Slug tal como lo usa el backend para esa bomba (A con guiones, B con _).
  sensor: string;
  inicio: number; // ms epoch
  fin: number; // ms epoch
  nivel: NivelAlerta;
  // Fracción del deltaAnomalia del perfil que alcanza el desvío (0-1].
  intensidad: number;
  // Momento en que el "modelo" la detecta y aparece la alerta.
  deteccion: number;
  // N.º de anomalía de este sensor (contador propio por bomba + sensor).
  ocurrencia: number;
}

const HORA = 60 * 60_000;

// Continúa la numeración aunque el módulo se recargue (ids de alerta únicos).
let siguienteId = Math.max(1000, ...((globalThis as any).__escenarioDemo?.anomalias ?? []).map((a: Anomalia) => a.id + 1));

// La demo arranca vacía: no hay datos hasta que se inicia la transmisión.
// Desde ese instante las señales "llegan" en vivo; nada existe antes.
// En globalThis: si la recarga en caliente carga dos copias de este módulo,
// ambas comparten el mismo estado. Antes "Reiniciar" podía limpiar una copia
// mientras el simulador seguía leyendo la otra (p. ej. bitácoras que no se
// borraban).
export const escenario: { anomalias: Anomalia[]; bombaActiva: EstadoBomba; transmisionInicio: number | null } =
  ((globalThis as any).__escenarioDemo ??= {
    anomalias: [] as Anomalia[],
    bombaActiva: 'O' as EstadoBomba,
    transmisionInicio: null as number | null,
  });

export const iniciarTransmision = () => {
  escenario.transmisionInicio = Date.now();
  escenario.bombaActiva = 'A';
};

// Cada sensor escala según su propio contador de anomalías:
// 1.ª = AVISO, 2.ª = ALERTA, 3.ª en adelante = CRÍTICA.
export const nivelPorOcurrencia = (n: number): NivelAlerta =>
  n <= 1 ? 'AVISO' : n === 2 ? 'ALERTA' : 'CRÍTICA';

const ocurrenciasPrevias = (bomba: Bomba, sensor: string) => {
  const s = normalizarSlug(sensor);
  return escenario.anomalias.filter((a) => a.bomba === bomba && normalizarSlug(a.sensor) === s).length;
};

/**
 * Dispara una anomalía que empieza dentro de `retrasoMs` (0 = ahora).
 * El nivel sale del contador del sensor salvo que se fuerce con `nivel`.
 * El "modelo" la detecta 9 s después de que empieza el desvío.
 */
export const dispararAnomalia = (
  bomba: Bomba,
  sensor: string,
  nivelForzado?: NivelAlerta,
  { duracionS = 75, retrasoMs = 0 } = {}
): Anomalia => {
  const inicio = Date.now() + retrasoMs;
  const ocurrencia = ocurrenciasPrevias(bomba, sensor) + 1;
  const nivel = nivelForzado ?? nivelPorOcurrencia(ocurrencia);
  const anomalia: Anomalia = {
    id: siguienteId++,
    bomba,
    sensor,
    inicio,
    fin: inicio + duracionS * 1000,
    nivel,
    intensidad: nivel === 'AVISO' ? 0.6 : nivel === 'ALERTA' ? 0.8 : 1,
    deteccion: inicio + 9000,
    ocurrencia,
  };
  escenario.anomalias.push(anomalia);
  return anomalia;
};

export const cambiarBombaActiva = (estado: EstadoBomba) => {
  escenario.bombaActiva = estado;
};

export const reiniciarEscenario = () => {
  escenario.anomalias = [];
  escenario.bombaActiva = 'O';
  escenario.transmisionInicio = null;
};

// --- Alertas derivadas de las anomalías ---

export const ACCIONES: Record<NivelAlerta, string> = {
  'CRÍTICA': 'Detener la bomba y activar la de respaldo; inspeccionar descansos y alineamiento.',
  'ALERTA': 'Programar inspección en el turno y aumentar la frecuencia de monitoreo.',
  'AVISO': 'Seguir la tendencia; sin acción inmediata.',
};

/** Acción recomendada específica del sensor y nivel; genérica por nivel si no hay. */
export const accionRecomendada = (sensor: string, nivel: NivelAlerta) =>
  conocimientoDe(sensor)?.acciones[nivel] ?? ACCIONES[nivel];

const descripcion = (a: Anomalia): string => {
  const cfg = buscarConfigSensor(a.sensor);
  const p = perfilDe(a.sensor);
  const pico = p.base + p.deltaAnomalia * a.intensidad;
  const sentido = p.deltaAnomalia > 0 ? 'sobre' : 'bajo';
  const prefijo = a.nivel === 'AVISO' ? 'AVISO' : a.nivel === 'ALERTA' ? 'ALERTA' : 'ALERTA CRÍTICA';
  return (
    `${prefijo} - BOMBA ${a.bomba}: ${cfg.label} ${sentido} el umbral ` +
    `(pico ${pico.toFixed(p.decimales)} ${cfg.unit}, umbral ${p.umbral} ${cfg.unit}). ` +
    `Patrón anómalo detectado por el modelo (${a.ocurrencia}.ª detección en este sensor). ` +
    `Acción recomendada: ${accionRecomendada(a.sensor, a.nivel)}`
  );
};

export const alertaDe = (a: Anomalia) => ({
  id: a.id,
  timestamp: new Date(a.deteccion).toISOString(),
  tipo_sensor: a.sensor,
  descripcion: descripcion(a),
  nivel: a.nivel,
  origen: `Bomba ${a.bomba}`,
  tabla_origen: a.bomba,
  bomba_datos: a.bomba,
  tiene_datos_anomalia: true,
  datos_disponibles: true,
});

/** Alertas visibles (ya detectadas) dentro de los últimos `dias`, más nuevas primero. */
export const alertasVisibles = (dias: number) => {
  const ahora = Date.now();
  const desde = ahora - dias * 24 * HORA;
  return escenario.anomalias
    .filter((a) => a.deteccion <= ahora && a.deteccion >= desde)
    .sort((x, y) => y.deteccion - x.deteccion)
    .map(alertaDe);
};

export const anomaliaPorId = (id: number) => escenario.anomalias.find((a) => a.id === id);
