// Configuracion centralizada de sensores por bomba
// Elimina duplicacion entre Sensors.vue y SensorsB.vue

type SensorDef = { titulo: string; unidad: string; color: string; label: string; buttonColor: { active: string; hover: string; border: string }; tagClass: string; tag?: string };

const btn = (c: string) => ({
  active: `bg-${c}-600 ring-${c}-400`,
  hover: `hover:bg-${c}-100 hover:border-${c}-400`,
  border: `border-l-${c}-500`,
});

const tag = (c: string) => `bg-${c}-100 text-${c}-800`;

// --- Sensores propios de Bomba A (14) ---
const sensoresBombaA: Record<string, SensorDef> = {
  corriente: { titulo: 'Corriente', unidad: 'A', color: 'blue', label: 'Corriente', buttonColor: btn('blue'), tagClass: tag('blue'), tag: '12ES.ESIT0107A.PNT' },
  excentricidadBomba: { titulo: 'Excentricidad Bomba', unidad: 'ms', color: 'cyan', label: 'Excentricidad', buttonColor: btn('cyan'), tagClass: tag('cyan'), tag: '12FPV.AEVT017.PNT' },
  temperaturaDescansoBomba: { titulo: 'Temp. Descanso Bomba', unidad: '°C', color: 'orange', label: 'Temp. Desc. Bomba', buttonColor: btn('orange'), tagClass: tag('orange'), tag: '14FPBT.AETE006G.PNT' },
  temperaturaDescansoMotor: { titulo: 'Temp. Descanso Motor', unidad: '°C', color: 'pink', label: 'Temp. Desc. Motor', buttonColor: btn('pink'), tagClass: tag('pink'), tag: '14FPBT.AETE010.PNT' },
  temperaturaInternaEmpuje: { titulo: 'Temp. Descanso Empuje', unidad: '°C', color: 'teal', label: 'Temp. Empuje', buttonColor: btn('teal'), tagClass: tag('teal'), tag: '14FPBT.AETE014A.PNT' },
  vibracionAxial: { titulo: 'Vibracion Axial Empuje', unidad: 'ms', color: 'slate', label: 'Vib. Axial', buttonColor: btn('slate'), tagClass: 'bg-slate-200 text-slate-800', tag: '12FPV.AEVT018.PNT' },
  vibracionXInterno: { titulo: 'Vibracion X Interno', unidad: 'ms', color: 'violet', label: 'Vib. X Interno', buttonColor: btn('violet'), tagClass: tag('violet'), tag: '12FPV.AEVT015A.PNT' },
  vibracionYInterno: { titulo: 'Vibracion Y Interno', unidad: 'ms', color: 'fuchsia', label: 'Vib. Y Interno', buttonColor: btn('fuchsia'), tagClass: tag('fuchsia'), tag: '12FPV.AEVT015B.PNT' },
  vibracionXExterno: { titulo: 'Vibracion X Externo', unidad: 'ms', color: 'indigo', label: 'Vib. X Externo', buttonColor: btn('indigo'), tagClass: tag('indigo'), tag: '12FPV.AEVT016A.PNT' },
  vibracionYExterno: { titulo: 'Vibracion Y Externo', unidad: 'ms', color: 'rose', label: 'Vib. Y Externo', buttonColor: btn('rose'), tagClass: tag('rose'), tag: '12FPV.AEVT016B.PNT' },
  presionSuccionBAA: { titulo: 'Presion Succion BAA', unidad: 'barg', color: 'sky', label: 'Presion Succion', buttonColor: btn('sky'), tagClass: tag('sky'), tag: '12FPMFC.AEPT004.PNT' },
  flujoDescarga: { titulo: 'Flujo Descarga', unidad: 'kg/h', color: 'green', label: 'Flujo Descarga', buttonColor: btn('green'), tagClass: tag('green'), tag: '12FPMFC.AEFT001.PNT' },
  temperaturaEstator: { titulo: 'Temp. Estator', unidad: '°C', color: 'amber', label: 'Temp. Estator', buttonColor: btn('amber'), tagClass: tag('amber'), tag: '14FPBT.AETE006A.PNT' },
  posicionValvulaRecirc: { titulo: 'Posicion Valvula Recirc', unidad: 'kg/h', color: 'rose', label: 'Valvula Recirc', buttonColor: btn('lime'), tagClass: tag('rose'), tag: '12FPMFC.AEZT001.PNT' },
};

// --- Sensores propios de Bomba B (14) ---
const sensoresBombaB: Record<string, SensorDef> = {
  corriente: { titulo: 'Corriente', unidad: 'A', color: 'blue', label: 'Corriente', buttonColor: btn('blue'), tagClass: tag('blue'), tag: '12ES.ESIT0107B.PNT' },
  excentricidadBomba: { titulo: 'Excentricidad Bomba', unidad: 'ms', color: 'cyan', label: 'Excentricidad', buttonColor: btn('cyan'), tagClass: tag('cyan'), tag: '12FPV.AEVT037.PNT' },
  tempDescansoBomba: { titulo: 'Temp. Descanso Bomba', unidad: '°C', color: 'orange', label: 'Temp. Desc. Bomba', buttonColor: btn('orange'), tagClass: tag('orange'), tag: '14FPBT.AETE030.PNT' },
  tempDescansoMotor: { titulo: 'Temp. Descanso Motor', unidad: '°C', color: 'pink', label: 'Temp. Desc. Motor', buttonColor: btn('pink'), tagClass: tag('pink'), tag: '14FPBT.AETE026G.PNT' },
  tempDescansoEmpuje: { titulo: 'Temp. Descanso Empuje', unidad: '°C', color: 'teal', label: 'Temp. Desc. Empuje', buttonColor: btn('teal'), tagClass: tag('teal'), tag: '14FPBT.AETE033B.PNT' },
  vibracionAxialEmpuje: { titulo: 'Vibracion Axial Empuje', unidad: 'ms', color: 'slate', label: 'Vib. Axial Empuje', buttonColor: btn('slate'), tagClass: 'bg-gray-200 text-gray-800', tag: '12FPV.AEVT038.PNT' },
  vibracionXDescanso: { titulo: 'Vibracion X Descanso', unidad: 'ms', color: 'violet', label: 'Vib. X Descanso', buttonColor: btn('violet'), tagClass: tag('violet'), tag: '12FPV.AEVT035A.PNT' },
  vibracionYDescanso: { titulo: 'Vibracion Y Descanso', unidad: 'ms', color: 'fuchsia', label: 'Vib. Y Descanso', buttonColor: btn('fuchsia'), tagClass: tag('fuchsia'), tag: '12FPV.AEVT035B.PNT' },
  vibracionXDescansoExterno: { titulo: 'Vibracion X Externo', unidad: 'ms', color: 'indigo', label: 'Vib. X Externo', buttonColor: btn('indigo'), tagClass: tag('indigo'), tag: '12FPV.AEVT036A.PNT' },
  vibracionYDescansoExterno: { titulo: 'Vibracion Y Externo', unidad: 'ms', color: 'rose', label: 'Vib. Y Externo', buttonColor: btn('rose'), tagClass: tag('rose'), tag: '12FPV.AEVT036B.PNT' },
  presionSuccionBAA: { titulo: 'Presion Succion BAA', unidad: 'barg', color: 'sky', label: 'Presion Succion', buttonColor: btn('sky'), tagClass: tag('sky'), tag: '12FPMFC.AEPT024.PNT' },
  flujoDescarga: { titulo: 'Flujo Descarga', unidad: 'kg/h', color: 'green', label: 'Flujo Descarga', buttonColor: btn('green'), tagClass: tag('green'), tag: '12FPMFC.AEFT021.PNT' },
  temperaturaEstator: { titulo: 'Temp. Estator', unidad: '°C', color: 'amber', label: 'Temp. Estator', buttonColor: btn('amber'), tagClass: tag('amber'), tag: '14FPBT.AETE026B.PNT' },
  posicionValvulaRecirc: { titulo: 'Posicion Valvula Recirc', unidad: 'kg/h', color: 'rose', label: 'Valvula Recirc', buttonColor: btn('lime'), tagClass: tag('rose'), tag: '12FPMFC.AEZT021.PNT' },
};

// --- Sensores Generales (11) - compartidos, pero con keys distintas entre A y B ---
const sensoresGeneralesA: Record<string, SensorDef> = {
  voltajeBarra: { titulo: 'Voltaje Barra 6.6KV', unidad: 'V', color: 'orange', label: 'Voltaje Barra', buttonColor: btn('orange'), tagClass: tag('orange'), tag: '12ES.ESET0101A.PNT' },
  presionAguaMP: { titulo: 'Presion Agua Econ. MP', unidad: 'barg', color: 'purple', label: 'Presion Agua MP', buttonColor: btn('purple'), tagClass: tag('purple'), tag: '12AE.AEPT055.PNT' },
  flujoAguaDomoAP: { titulo: 'Flujo Agua Domo AP', unidad: 'kg/h', color: 'emerald', label: 'Flujo Domo AP', buttonColor: btn('emerald'), tagClass: tag('emerald') },
  flujoAguaRecalentador: { titulo: 'Flujo Agua Recalentador', unidad: 'kg/h', color: 'lime', label: 'Flujo Recalent.', buttonColor: btn('lime'), tagClass: tag('lime'), tag: '12LPDLC.AEFT050.PNT' },
  flujoAguaDomoMP: { titulo: 'Flujo Agua Domo MP', unidad: 'kg/h', color: 'teal', label: 'Flujo Domo MP', buttonColor: btn('teal'), tagClass: tag('teal'), tag: '12LPDLC.16B.OUT' },
  temperaturaAguaAlim: { titulo: 'Temp. Agua Alim. Domo MP', unidad: '°C', color: 'red', label: 'Temp. Agua Alim', buttonColor: btn('red'), tagClass: tag('red'), tag: '14LPDLC.AETE057.PNT' },
  flujoDomoAPCompensated: { titulo: 'Flujo Domo AP Compensado', unidad: 'kg/h', color: 'cyan', label: 'Flujo AP Comp.', buttonColor: btn('cyan'), tagClass: tag('cyan'), tag: '12LPDLC.18B.OUT' },
  temperaturaAmbiental: { titulo: 'Temperatura Ambiental', unidad: '°C', color: 'yellow', label: 'Temp. Ambiente', buttonColor: btn('yellow'), tagClass: tag('yellow'), tag: 'WEATHER.13JMTT001A.PNT' },
  mwBrutosGeneracionGas: { titulo: 'Potencia Bruta', unidad: 'MW', color: 'red', label: 'Generacion MW', buttonColor: btn('red'), tagClass: tag('red'), tag: '12PEM.1B.RO01' },
  flujoAguaVaporAlta: { titulo: 'Flujo Agua Vapor Alta', unidad: 'kg/h', color: 'fuchsia', label: 'Flujo Vapor Alta', buttonColor: btn('fuchsia'), tagClass: tag('fuchsia'), tag: '12LPDLC.AEFT043.PNT' },
  presionAguaEconAP: { titulo: 'Presion Agua Econ. AP', unidad: 'barg', color: 'indigo', label: 'Presion Econ AP', buttonColor: btn('indigo'), tagClass: tag('indigo'), tag: '12AE.AEPT040.PNT' },
};

const sensoresGeneralesB: Record<string, SensorDef> = {
  voltajeBarra: { titulo: 'Voltaje Barra 6.6KV', unidad: 'V', color: 'orange', label: 'Voltaje Barra', buttonColor: btn('orange'), tagClass: tag('orange'), tag: '12ES.ESET0101A.PNT' },
  presionAgua: { titulo: 'Presion Agua Econ. MP', unidad: 'barg', color: 'purple', label: 'Presion Agua MP', buttonColor: btn('purple'), tagClass: tag('purple'), tag: '12AE.AEPT055.PNT' },
  flujoAguaDomoAP: { titulo: 'Flujo Agua Domo AP', unidad: 'kg/h', color: 'emerald', label: 'Flujo Domo AP', buttonColor: btn('emerald'), tagClass: tag('emerald') },
  flujoAguaRecalentador: { titulo: 'Flujo Agua Recalentador', unidad: 'kg/h', color: 'lime', label: 'Flujo Recalent.', buttonColor: btn('rose'), tagClass: tag('lime'), tag: '12LPDLC.AEFT050.PNT' },
  flujoAguaDomoMP: { titulo: 'Flujo Agua Domo MP', unidad: 'kg/h', color: 'teal', label: 'Flujo Domo MP', buttonColor: btn('teal'), tagClass: tag('teal'), tag: '12LPDLC.16B.OUT' },
  temperaturaAguaAlim: { titulo: 'Temp. Agua Alim. Domo MP', unidad: '°C', color: 'red', label: 'Temp. Agua Alim', buttonColor: btn('red'), tagClass: tag('red'), tag: '14LPDLC.AETE057.PNT' },
  flujoDomoAPCompensated: { titulo: 'Flujo Domo AP Compensado', unidad: 'kg/h', color: 'cyan', label: 'Flujo AP Comp.', buttonColor: btn('cyan'), tagClass: tag('cyan'), tag: '12LPDLC.18B.OUT' },
  temperaturaAmbiental: { titulo: 'Temperatura Ambiental', unidad: '°C', color: 'yellow', label: 'Temp. Ambiente', buttonColor: btn('yellow'), tagClass: tag('yellow'), tag: 'WEATHER.13JMTT001A.PNT' },
  mwBrutosGeneracionGas: { titulo: 'Potencia Bruta', unidad: 'MW', color: 'red', label: 'Generacion MW', buttonColor: btn('red'), tagClass: tag('red'), tag: '12PEM.1B.RO01' },
  flujoAguaVaporAlta: { titulo: 'Flujo Agua Vapor Alta', unidad: 'kg/h', color: 'fuchsia', label: 'Flujo Vapor Alta', buttonColor: btn('fuchsia'), tagClass: tag('fuchsia'), tag: '12LPDLC.AEFT043.PNT' },
  presionAguaEconAP: { titulo: 'Presion Agua Econ. AP', unidad: 'barg', color: 'indigo', label: 'Presion Econ AP', buttonColor: btn('indigo'), tagClass: tag('indigo'), tag: '12AE.AEPT040.PNT' },
};

export type BombaId = 'A' | 'B';

export interface BombaConfig {
  bombaId: BombaId;
  sectionColor: string;      // Color de la seccion de bomba (blue/purple)
  sectionLabel: string;       // "Sensores Bomba A (14)"
  iframeUrl: string;
  sensoresBomba: Record<string, SensorDef>;
  sensoresGenerales: Record<string, SensorDef>;
}

const CONFIGS: Record<BombaId, BombaConfig> = {
  A: {
    bombaId: 'A',
    sectionColor: 'blue',
    sectionLabel: 'Sensores Bomba A (14)',
    iframeUrl: '',
    sensoresBomba: sensoresBombaA,
    sensoresGenerales: sensoresGeneralesA,
  },
  B: {
    bombaId: 'B',
    sectionColor: 'purple',
    sectionLabel: 'Sensores Bomba B (14)',
    iframeUrl: '',
    sensoresBomba: sensoresBombaB,
    sensoresGenerales: sensoresGeneralesB,
  },
};

export const getBombaConfig = (bomba: BombaId): BombaConfig => CONFIGS[bomba];

// Todos los sensores combinados (bomba + generales)
export const getAllSensores = (bomba: BombaId) => {
  const cfg = CONFIGS[bomba];
  return { ...cfg.sensoresBomba, ...cfg.sensoresGenerales };
};

export type { SensorDef };
