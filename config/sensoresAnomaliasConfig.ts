// Configuración de sensores para la vista de Análisis de Anomalías.
// Compartida por AnalisisAnomaliasA.vue y AnalisisAnomaliasB.vue.
//
// Las claves usan kebab-case. La función buscarConfigSensor normaliza
// guion/underscore antes de buscar, así que el mismo mapa sirve tanto para
// Bomba A (kebab-case desde el backend) como para Bomba B (snake_case).
//
// Unidades verificadas con CLAUDE.md y docs/señales de bombas.

export interface SensorAnomaliaConfig {
  label: string;
  icon: string;
  unit: string;
}

export const SENSORES_CONFIG: Record<string, SensorAnomaliaConfig> = {
  // Corriente
  "corriente": { label: "Corriente", icon: "⚡", unit: "A" },

  // Excentricidad
  "excentricidad-bomba": { label: "Excentricidad Bomba", icon: "⚙️", unit: "ms" },

  // Temperaturas (todas en °C)
  "temperatura-descanso-bomba": { label: "Temp. Descanso Bomba", icon: "🌡️", unit: "°C" },
  "temperatura-descanso-motor": { label: "Temp. Descanso Motor", icon: "🌡️", unit: "°C" },
  "temperatura-interna-empuje": { label: "Temp. Interna Empuje", icon: "🌡️", unit: "°C" },
  "temp-descanso-bomba": { label: "Temp. Descanso Bomba", icon: "🌡️", unit: "°C" },
  "temp-descanso-motor": { label: "Temp. Descanso Motor", icon: "🌡️", unit: "°C" },
  "temp-descanso-empuje": { label: "Temp. Descanso Empuje", icon: "🌡️", unit: "°C" },
  "temperatura-estator": { label: "Temp. Estator", icon: "🌡️", unit: "°C" },
  "temperatura-ambiental": { label: "Temp. Ambiental", icon: "🌡️", unit: "°C" },
  "temperatura-agua-alim": { label: "Temp. Agua Alim", icon: "🌡️", unit: "°C" },

  // Vibraciones (todas en ms)
  "vibracion-axial": { label: "Vibración Axial", icon: "📳", unit: "ms" },
  "vibracion-axial-empuje": { label: "Vibración Axial Empuje", icon: "📳", unit: "ms" },
  "vibracion-x-interno": { label: "Vibración X Interno", icon: "📳", unit: "ms" },
  "vibracion-y-interno": { label: "Vibración Y Interno", icon: "📳", unit: "ms" },
  "vibracion-x-externo": { label: "Vibración X Externo", icon: "📳", unit: "ms" },
  "vibracion-y-externo": { label: "Vibración Y Externo", icon: "📳", unit: "ms" },
  "vibracion-x-descanso": { label: "Vibración X Descanso", icon: "📳", unit: "ms" },
  "vibracion-y-descanso": { label: "Vibración Y Descanso", icon: "📳", unit: "ms" },
  "vibracion-x-descanso-externo": { label: "Vibración X Descanso Externo", icon: "📳", unit: "ms" },
  "vibracion-y-descanso-externo": { label: "Vibración Y Descanso Externo", icon: "📳", unit: "ms" },

  // Voltaje
  "voltaje-barra": { label: "Voltaje Barra", icon: "⚡", unit: "V" },

  // Presiones (todas en barg)
  "presion-succion-baa": { label: "Presión Succión BAA", icon: "📊", unit: "barg" },
  "presion-agua-mp": { label: "Presión Agua MP", icon: "📊", unit: "barg" },
  "presion-agua": { label: "Presión Agua", icon: "📊", unit: "barg" },
  "presion-agua-econ-ap": { label: "Presión Agua Econ AP", icon: "📊", unit: "barg" },

  // Flujos (todos en kg/h)
  "flujo-descarga": { label: "Flujo Descarga", icon: "💧", unit: "kg/h" },
  "flujo-salida-12fpmfc": { label: "Flujo Descarga", icon: "💧", unit: "kg/h" },
  "flujo-agua-domo-ap": { label: "Flujo Agua Domo AP", icon: "💧", unit: "kg/h" },
  "flujo-agua-domo-mp": { label: "Flujo Agua Domo MP", icon: "💧", unit: "kg/h" },
  "flujo-agua-recalentador": { label: "Flujo Agua Recalentador", icon: "💧", unit: "kg/h" },
  "flujo-agua-vapor-alta": { label: "Flujo Agua Vapor Alta", icon: "💧", unit: "kg/h" },
  "flujo-domo-ap-compensated": { label: "Flujo Domo AP Compensado", icon: "💧", unit: "kg/h" },

  // Posición Válvula Recirc
  "posicion-valvula-recirc": { label: "Posición Válvula Recirc", icon: "🔧", unit: "kg/h" },

  // Potencia
  "mw-brutos-generacion-gas": { label: "Potencia Bruta", icon: "🔥", unit: "MW" },

  // Predicciones
  "PREDICCION_CORRIENTE": { label: "Predicción Corriente", icon: "🔮", unit: "A" },
  "prediccion_mw-brutos": { label: "Predicción MW Brutos", icon: "🔮", unit: "MW" },
  "prediccion_presion-gas": { label: "Predicción Presión Gas", icon: "🔮", unit: "barg" },
};

// Normaliza una clave de sensor: quita prefijo prediccion_/prediccion- y
// unifica todos los separadores a guion (-).
const normalizar = (key: string): string =>
  key
    .toLowerCase()
    .replace(/^prediccion[_-]/i, "")
    .replace(/[_-]/g, "-");

// Convierte un nombre de sensor sin config en un label legible.
// Ej: "vibracion_y_interno" → "Vibracion Y Interno"
export const formatearNombreSensor = (nombre: string): string => {
  let limpio = nombre.replace(/^prediccion[_-]/i, "");
  limpio = limpio.replace(/[_-]/g, " ");
  return limpio
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Fallback por patrón: si la clave empieza por algún prefijo conocido,
// inferimos la unidad. Cubre sensores que el backend agrega sin avisar.
// El orden importa: el primer match gana.
const PATRONES_FALLBACK: Array<{
  test: (key: string) => boolean;
  config: Omit<SensorAnomaliaConfig, "label">;
}> = [
  { test: (k) => /^(temperatura|temp)[-_]/i.test(k), config: { icon: "🌡️", unit: "°C" } },
  { test: (k) => /^vibracion[-_]/i.test(k), config: { icon: "📳", unit: "ms" } },
  { test: (k) => /^flujo[-_]/i.test(k), config: { icon: "💧", unit: "kg/h" } },
  { test: (k) => /^presion[-_]/i.test(k), config: { icon: "📊", unit: "barg" } },
  { test: (k) => /^excentricidad[-_]/i.test(k), config: { icon: "⚙️", unit: "ms" } },
  { test: (k) => /corriente/i.test(k), config: { icon: "⚡", unit: "A" } },
  { test: (k) => /voltaje/i.test(k), config: { icon: "⚡", unit: "V" } },
  { test: (k) => /^mw[-_]|potencia/i.test(k), config: { icon: "🔥", unit: "MW" } },
  { test: (k) => /^posicion[-_].*valvula/i.test(k), config: { icon: "🔧", unit: "kg/h" } },
];

// Busca la config de un sensor por su clave (acepta kebab-case o snake_case).
// Estrategia:
// 1. Match exacto en SENSORES_CONFIG
// 2. Match normalizado (guion/underscore unificados)
// 3. Fallback por patrón (prefijo del sensor → unidad inferida)
// 4. Default genérico (label autoformateado, sin unidad)
export const buscarConfigSensor = (sensorKey: string): SensorAnomaliaConfig => {
  if (SENSORES_CONFIG[sensorKey]) return SENSORES_CONFIG[sensorKey];

  const keyNormalizada = normalizar(sensorKey);
  for (const [configKey, configValue] of Object.entries(SENSORES_CONFIG)) {
    if (normalizar(configKey) === keyNormalizada) return configValue;
  }

  // Fallback por patrón (cubre sensores nuevos sin entrada explícita)
  const label = formatearNombreSensor(sensorKey);
  for (const { test, config } of PATRONES_FALLBACK) {
    if (test(sensorKey) || test(keyNormalizada)) {
      return { label, ...config };
    }
  }

  return { label, icon: "📈", unit: "" };
};

// --- Tags (señal origen) por sensor ---
// Los sensores generales comparten tag entre ambas bombas.
// Los propios (corriente, vibraciones, etc.) son distintos por bomba.

const TAGS_GENERALES: Record<string, string> = {
  "voltaje-barra": "12ES.ESET0101A.PNT",
  "presion-agua-mp": "12AE.AEPT055.PNT",
  "presion-agua": "12AE.AEPT055.PNT",
  "presion-agua-alimentacion-econ-ap": "12AE.AEPT055.PNT",
  "flujo-agua-recalentador": "12LPDLC.AEFT050.PNT",
  "flujo-agua-domo-mp": "12LPDLC.16B.OUT",
  "temperatura-agua-alim": "14LPDLC.AETE057.PNT",
  "temperatura-agua-alim-ap": "14LPDLC.AETE057.PNT",
  "temperatura-agua-alim-domo-mp": "14LPDLC.AETE057.PNT",
  "flujo-domo-ap-compensated": "12LPDLC.18B.OUT",
  "flujo-agua-domo-ap-compensated": "12LPDLC.18B.OUT",
  "flujo-agua-domo-ap": "12LPDLC.18B.OUT",
  "temperatura-ambiental": "WEATHER.13JMTT001A.PNT",
  "mw-brutos-generacion-gas": "12PEM.1B.RO01",
  "potencia-bruta-planta": "12PEM.1B.RO01",
  "flujo-agua-vapor-alta": "12LPDLC.AEFT043.PNT",
  "flujo-de-agua-atemp-vapor-alta-ap": "12LPDLC.AEFT045.PNT",
  "presion-agua-econ-ap": "12AE.AEPT040.PNT",
};

const TAGS_BOMBA_A: Record<string, string> = {
  "corriente": "12ES.ESIT0107A.PNT",
  "sensores-corriente": "12ES.ESIT0107A.PNT",
  "excentricidad-bomba": "12FPV.AEVT017.PNT",
  "temperatura-descanso-bomba": "14FPBT.AETE006G.PNT",
  "temperatura-descanso-interno-bomba": "14FPBT.AETE006G.PNT",
  "temperatura-descanso-motor": "14FPBT.AETE010.PNT",
  "temperatura-descanso-interna-motor-bomba": "14FPBT.AETE010.PNT",
  "temperatura-interna-empuje": "14FPBT.AETE014A.PNT",
  "temperatura-descanso-empuje": "14FPBT.AETE014A.PNT",
  "temperatura-descanso-interna-empuje-bomba": "14FPBT.AETE014A.PNT",
  "vibracion-axial": "12FPV.AEVT018.PNT",
  "vibracion-axial-descanso": "12FPV.AEVT018.PNT",
  "vibracion-axial-descanso-empuje": "12FPV.AEVT018.PNT",
  "vibracion-x-interno": "12FPV.AEVT015A.PNT",
  "vibracion-x-descanso-interno": "12FPV.AEVT015A.PNT",
  "vibracion-x-descanso-interno-bomba": "12FPV.AEVT015A.PNT",
  "vibracion-y-interno": "12FPV.AEVT015B.PNT",
  "vibracion-y-descanso-interno": "12FPV.AEVT015B.PNT",
  "vibracion-y-descanso-interno-bomba": "12FPV.AEVT015B.PNT",
  "vibracion-x-externo": "12FPV.AEVT016A.PNT",
  "vibracion-x-descanso-externo": "12FPV.AEVT016A.PNT",
  "vibracion-y-externo": "12FPV.AEVT016B.PNT",
  "vibracion-y-descanso-externo": "12FPV.AEVT016B.PNT",
  "presion-succion-baa": "12FPMFC.AEPT004.PNT",
  "flujo-salida-12fpmfc": "12FPMFC.AEFT001.PNT",
  "flujo-descarga": "12FPMFC.AEFT001.PNT",
  "temperatura-estator": "14FPBT.AETE006A.PNT",
  "posicion-valvula-recirc": "12FPMFC.AEZT001.PNT",
};

const TAGS_BOMBA_B: Record<string, string> = {
  "corriente": "12ES.ESIT0107B.PNT",
  "sensores-corriente": "12ES.ESIT0107B.PNT",
  "excentricidad-bomba": "12FPV.AEVT037.PNT",
  "temp-descanso-bomba": "14FPBT.AETE030.PNT",
  "temperatura-descanso-bomba": "14FPBT.AETE030.PNT",
  "temperatura-descanso-interno-bomba": "14FPBT.AETE030.PNT",
  "temp-descanso-motor": "14FPBT.AETE026G.PNT",
  "temperatura-descanso-motor": "14FPBT.AETE026G.PNT",
  "temperatura-descanso-interna-motor-bomba": "14FPBT.AETE026G.PNT",
  "temp-descanso-empuje": "14FPBT.AETE033B.PNT",
  "temperatura-descanso-empuje": "14FPBT.AETE033B.PNT",
  "temperatura-descanso-interna-empuje-bomba": "14FPBT.AETE033B.PNT",
  "vibracion-axial-empuje": "12FPV.AEVT038.PNT",
  "vibracion-axial-descanso-empuje": "12FPV.AEVT038.PNT",
  "vibracion-x-descanso": "12FPV.AEVT035A.PNT",
  "vibracion-y-descanso": "12FPV.AEVT035B.PNT",
  "vibracion-x-descanso-externo": "12FPV.AEVT036A.PNT",
  "vibracion-y-descanso-externo": "12FPV.AEVT036B.PNT",
  "presion-succion-baa": "12FPMFC.AEPT024.PNT",
  "flujo-descarga": "12FPMFC.AEFT021.PNT",
  "temperatura-estator": "14FPBT.AETE026B.PNT",
  "posicion-valvula-recirc": "12FPMFC.AEZT021.PNT",
};

// Genera variantes alternativas del key (temp-/temperatura-, con/sin sufijo de bomba)
// para encontrar el tag aunque el backend agregue sufijos "-1a", "-1b", "-a", "-b"
// o use abreviaciones ("temp-" en vez de "temperatura-").
const generarVariantes = (key: string): string[] => {
  const set = new Set<string>();
  const agregar = (k: string) => {
    set.add(k);
    // Equivalencias temp- ↔ temperatura-
    if (k.startsWith("temp-") && !k.startsWith("temperatura-")) {
      set.add("temperatura-" + k.slice(5));
    }
    if (k.startsWith("temperatura-")) {
      set.add("temp-" + k.slice(12));
    }
  };
  agregar(key);
  // Quitar sufijos de bomba: -1a, -1b, -a, -b
  const conSufijo = key.match(/^(.+?)-(?:1a|1b|a|b)$/);
  if (conSufijo) agregar(conSufijo[1]);
  return Array.from(set);
};

// Retorna el tag (señal origen) para un sensor dado su endpoint/tipo_sensor.
// Para sensores propios, el tag depende de la bomba.
// Para sensores generales, el tag es el mismo sin importar la bomba.
export const buscarTagSensor = (sensorKey: string, bomba?: "A" | "B"): string | undefined => {
  const key = normalizar(sensorKey);
  const variantes = generarVariantes(key);

  for (const v of variantes) {
    if (TAGS_GENERALES[v]) return TAGS_GENERALES[v];
  }
  if (bomba === "A" || !bomba) {
    for (const v of variantes) {
      if (TAGS_BOMBA_A[v]) return TAGS_BOMBA_A[v];
    }
  }
  if (bomba === "B" || !bomba) {
    for (const v of variantes) {
      if (TAGS_BOMBA_B[v]) return TAGS_BOMBA_B[v];
    }
  }
  return undefined;
};
