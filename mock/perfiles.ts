// Perfiles de comportamiento de cada señal simulada: valor base, amplitud de
// la variación lenta, ruido, decimales y desvío que produce una anomalía.
// Los rangos son realistas para bombas de alimentación de caldera HRSG.

export interface PerfilSenal {
  base: number;
  amplitud: number;
  ruido: number;
  decimales: number;
  // Desvío (en unidades de la señal) que suma una anomalía en su punto máximo.
  deltaAnomalia: number;
  // Umbral que se informa en la descripción de las alertas.
  umbral: number;
}

const perfil = (
  base: number,
  amplitud: number,
  ruido: number,
  decimales: number,
  deltaAnomalia: number
): PerfilSenal => ({
  base,
  amplitud,
  ruido,
  decimales,
  deltaAnomalia,
  umbral: +(base + Math.sign(deltaAnomalia) * (amplitud + Math.abs(deltaAnomalia) * 0.45)).toFixed(decimales),
});

// Normaliza el slug del endpoint: Bomba A usa guiones y Bomba B guion bajo.
export const normalizarSlug = (slug: string): string =>
  slug.replace(/^prediccion[_-]/, '').replace(/_/g, '-').toLowerCase();

// Reglas por palabra clave, de la más específica a la más general.
const REGLAS: Array<[RegExp, PerfilSenal]> = [
  [/^vibracion/, perfil(22, 2.5, 1.1, 2, 24)],
  [/^excentricidad/, perfil(38, 2, 0.9, 2, 22)],
  [/temperatura-ambiental/, perfil(17, 4, 0.3, 1, 9)],
  [/temperatura-agua-alim/, perfil(142, 3, 0.6, 1, 18)],
  [/temperatura-estator/, perfil(78, 3, 0.5, 1, 21)],
  [/^temp.*motor/, perfil(63, 2, 0.4, 1, 18)],
  [/^temp.*empuje/, perfil(52, 2, 0.4, 1, 17)],
  [/^temp.*bomba/, perfil(57, 2, 0.4, 1, 16)],
  [/^corriente/, perfil(182, 6, 1.8, 1, 46)],
  [/^voltaje/, perfil(6620, 25, 7, 0, -380)],
  [/presion-succion/, perfil(7.8, 0.3, 0.07, 2, -2.6)],
  [/presion-agua-econ/, perfil(128, 3, 0.8, 1, -26)],
  [/^presion-agua/, perfil(31, 1, 0.3, 1, -8)],
  [/^mw-brutos/, perfil(248, 18, 1.6, 1, -62)],
  [/posicion-valvula/, perfil(5200, 300, 70, 0, 3600)],
  [/flujo-(descarga|salida)/, perfil(182000, 6000, 1400, 0, -46000)],
  [/flujo-agua-domo-mp/, perfil(31000, 1500, 380, 0, -9000)],
  [/flujo-(agua-domo-ap|domo-ap)/, perfil(151000, 5000, 1200, 0, -38000)],
  [/flujo-agua-recalentador/, perfil(21000, 900, 240, 0, -6500)],
  [/flujo-agua-vapor-alta/, perfil(139000, 5000, 1200, 0, -36000)],
];

const PERFIL_DEFECTO = perfil(100, 5, 1, 1, 30);

export const perfilDe = (slug: string): PerfilSenal => {
  const s = normalizarSlug(slug);
  return REGLAS.find(([re]) => re.test(s))?.[1] ?? PERFIL_DEFECTO;
};
