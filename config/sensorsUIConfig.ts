// Configuracion de UI para los sensores
// Este archivo contiene labels, colores y configuracion visual

import type { BombaId } from './bombasConfig';

export interface SensorUIConfig {
  titulo: string;
  unidad: string;
  color: string;
}

export interface SensorButtonColors {
  active: string;
  hover: string;
  border: string;
}

// Configuracion de graficos para sensores - compartida entre ambas bombas
export const SENSORES_GRAFICOS_CONFIG: Record<string, SensorUIConfig> = {
  // Sensores Bomba (10 por bomba)
  corriente: { titulo: 'Corriente', unidad: 'A', color: 'blue' },
  excentricidadBomba: { titulo: 'Excentricidad Bomba', unidad: 'um', color: 'cyan' },
  // Bomba A
  temperaturaDescansoBomba: { titulo: 'Temp. Descanso Bomba', unidad: 'C', color: 'orange' },
  temperaturaDescansoMotor: { titulo: 'Temp. Descanso Motor', unidad: 'C', color: 'pink' },
  temperaturaInternaEmpuje: { titulo: 'Temp. Descanso Empuje', unidad: 'C', color: 'teal' },
  vibracionAxial: { titulo: 'Vibracion Axial Empuje', unidad: 'um', color: 'slate' },
  vibracionXInterno: { titulo: 'Vibracion X Interno', unidad: 'um', color: 'violet' },
  vibracionYInterno: { titulo: 'Vibracion Y Interno', unidad: 'um', color: 'fuchsia' },
  vibracionXExterno: { titulo: 'Vibracion X Externo', unidad: 'um', color: 'indigo' },
  vibracionYExterno: { titulo: 'Vibracion Y Externo', unidad: 'um', color: 'rose' },
  // Bomba B
  tempDescansoBomba: { titulo: 'Temp. Descanso Bomba', unidad: 'C', color: 'orange' },
  tempDescansoMotor: { titulo: 'Temp. Descanso Motor', unidad: 'C', color: 'pink' },
  tempDescansoEmpuje: { titulo: 'Temp. Descanso Empuje', unidad: 'C', color: 'teal' },
  vibracionAxialEmpuje: { titulo: 'Vibracion Axial Empuje', unidad: 'um', color: 'slate' },
  vibracionXDescanso: { titulo: 'Vibracion X Descanso', unidad: 'um', color: 'violet' },
  vibracionYDescanso: { titulo: 'Vibracion Y Descanso', unidad: 'um', color: 'fuchsia' },
  vibracionXDescansoExterno: { titulo: 'Vibracion X Desc. Externo', unidad: 'um', color: 'indigo' },
  vibracionYDescansoExterno: { titulo: 'Vibracion Y Desc. Externo', unidad: 'um', color: 'rose' },
  // Sensores Generales (compartidos)
  presionSuccionBAA: { titulo: 'Presion Succion BAA', unidad: 'barg', color: 'sky' },
  flujoDescarga: { titulo: 'Flujo Descarga', unidad: 'kg/h', color: 'green' },
  temperaturaEstator: { titulo: 'Temp. Estator', unidad: 'C', color: 'amber' },
  posicionValvulaRecirc: { titulo: 'Posicion Valvula Recirc', unidad: '%', color: 'rose' },
  voltajeBarra: { titulo: 'Voltaje Barra 6.6KV', unidad: 'V', color: 'orange' },
  presionAguaMP: { titulo: 'Presion Agua Econ. MP', unidad: 'barg', color: 'purple' },
  presionAgua: { titulo: 'Presion Agua', unidad: 'barg', color: 'purple' },
  flujoAguaDomoAP: { titulo: 'Flujo Agua Domo AP', unidad: 'kg/h', color: 'emerald' },
  flujoAguaRecalentador: { titulo: 'Flujo Agua Recalentador', unidad: 'kg/h', color: 'lime' },
  flujoAguaDomoMP: { titulo: 'Flujo Agua Domo MP', unidad: 'kg/h', color: 'teal' },
  temperaturaAguaAlim: { titulo: 'Temp. Agua Alim. Domo MP', unidad: 'C', color: 'red' },
  flujoDomoAPCompensated: { titulo: 'Flujo Domo AP Compensado', unidad: 'kg/h', color: 'cyan' },
  temperaturaAmbiental: { titulo: 'Temperatura Ambiental', unidad: 'C', color: 'yellow' },
  mwBrutosGeneracionGas: { titulo: 'Potencia Bruta (MW)', unidad: 'MW', color: 'red' },
  flujoAguaVaporAlta: { titulo: 'Flujo Agua Vapor Alta', unidad: 'kg/h', color: 'fuchsia' },
  presionAguaEconAP: { titulo: 'Presion Agua Econ. AP', unidad: 'barg', color: 'indigo' },
};

// Labels cortos para etiquetas
export const SENSOR_LABELS: Record<string, string> = {
  corriente: 'Corriente',
  excentricidadBomba: 'Excentricidad',
  // Bomba A
  temperaturaDescansoBomba: 'Temp. Desc. Bomba',
  temperaturaDescansoMotor: 'Temp. Desc. Motor',
  temperaturaInternaEmpuje: 'Temp. Empuje',
  vibracionAxial: 'Vib. Axial',
  vibracionXInterno: 'Vib. X Interno',
  vibracionYInterno: 'Vib. Y Interno',
  vibracionXExterno: 'Vib. X Externo',
  vibracionYExterno: 'Vib. Y Externo',
  // Bomba B
  tempDescansoBomba: 'Temp. Desc. Bomba',
  tempDescansoMotor: 'Temp. Desc. Motor',
  tempDescansoEmpuje: 'Temp. Empuje',
  vibracionAxialEmpuje: 'Vib. Axial Empuje',
  vibracionXDescanso: 'Vib. X Descanso',
  vibracionYDescanso: 'Vib. Y Descanso',
  vibracionXDescansoExterno: 'Vib. X Desc. Ext.',
  vibracionYDescansoExterno: 'Vib. Y Desc. Ext.',
  // Generales
  presionSuccionBAA: 'Presion Succion',
  flujoDescarga: 'Flujo Descarga',
  temperaturaEstator: 'Temp. Estator',
  posicionValvulaRecirc: 'Valvula Recirc',
  voltajeBarra: 'Voltaje Barra',
  presionAguaMP: 'Presion Agua MP',
  presionAgua: 'Presion Agua',
  flujoAguaDomoAP: 'Flujo Domo AP',
  flujoAguaRecalentador: 'Flujo Recalent.',
  flujoAguaDomoMP: 'Flujo Domo MP',
  temperaturaAguaAlim: 'Temp. Agua Alim',
  flujoDomoAPCompensated: 'Flujo AP Comp.',
  temperaturaAmbiental: 'Temp. Ambiente',
  mwBrutosGeneracionGas: 'Generacion MW',
  flujoAguaVaporAlta: 'Flujo Vapor Alta',
  presionAguaEconAP: 'Presion Econ AP',
};

// Colores de botones para sensores de bomba
export const SENSOR_BUTTON_COLORS: Record<string, SensorButtonColors> = {
  corriente: { active: 'bg-blue-600 ring-blue-400', hover: 'hover:bg-blue-100 hover:border-blue-400', border: 'border-l-blue-500' },
  excentricidadBomba: { active: 'bg-cyan-600 ring-cyan-400', hover: 'hover:bg-cyan-100 hover:border-cyan-400', border: 'border-l-cyan-500' },
  temperaturaDescansoBomba: { active: 'bg-orange-600 ring-orange-400', hover: 'hover:bg-orange-100 hover:border-orange-400', border: 'border-l-orange-500' },
  temperaturaDescansoMotor: { active: 'bg-pink-600 ring-pink-400', hover: 'hover:bg-pink-100 hover:border-pink-400', border: 'border-l-pink-500' },
  temperaturaInternaEmpuje: { active: 'bg-teal-600 ring-teal-400', hover: 'hover:bg-teal-100 hover:border-teal-400', border: 'border-l-teal-500' },
  vibracionAxial: { active: 'bg-slate-600 ring-slate-400', hover: 'hover:bg-slate-100 hover:border-slate-400', border: 'border-l-slate-500' },
  vibracionXInterno: { active: 'bg-violet-600 ring-violet-400', hover: 'hover:bg-violet-100 hover:border-violet-400', border: 'border-l-violet-500' },
  vibracionYInterno: { active: 'bg-fuchsia-600 ring-fuchsia-400', hover: 'hover:bg-fuchsia-100 hover:border-fuchsia-400', border: 'border-l-fuchsia-500' },
  vibracionXExterno: { active: 'bg-indigo-600 ring-indigo-400', hover: 'hover:bg-indigo-100 hover:border-indigo-400', border: 'border-l-indigo-500' },
  vibracionYExterno: { active: 'bg-rose-600 ring-rose-400', hover: 'hover:bg-rose-100 hover:border-rose-400', border: 'border-l-rose-500' },
  // Bomba B - mismos colores con nombres diferentes
  tempDescansoBomba: { active: 'bg-orange-600 ring-orange-400', hover: 'hover:bg-orange-100 hover:border-orange-400', border: 'border-l-orange-500' },
  tempDescansoMotor: { active: 'bg-pink-600 ring-pink-400', hover: 'hover:bg-pink-100 hover:border-pink-400', border: 'border-l-pink-500' },
  tempDescansoEmpuje: { active: 'bg-teal-600 ring-teal-400', hover: 'hover:bg-teal-100 hover:border-teal-400', border: 'border-l-teal-500' },
  vibracionAxialEmpuje: { active: 'bg-slate-600 ring-slate-400', hover: 'hover:bg-slate-100 hover:border-slate-400', border: 'border-l-slate-500' },
  vibracionXDescanso: { active: 'bg-violet-600 ring-violet-400', hover: 'hover:bg-violet-100 hover:border-violet-400', border: 'border-l-violet-500' },
  vibracionYDescanso: { active: 'bg-fuchsia-600 ring-fuchsia-400', hover: 'hover:bg-fuchsia-100 hover:border-fuchsia-400', border: 'border-l-fuchsia-500' },
  vibracionXDescansoExterno: { active: 'bg-indigo-600 ring-indigo-400', hover: 'hover:bg-indigo-100 hover:border-indigo-400', border: 'border-l-indigo-500' },
  vibracionYDescansoExterno: { active: 'bg-rose-600 ring-rose-400', hover: 'hover:bg-rose-100 hover:border-rose-400', border: 'border-l-rose-500' },
  // Sensores movidos a Bomba
  presionSuccionBAA: { active: 'bg-sky-600 ring-sky-400', hover: 'hover:bg-sky-100 hover:border-sky-400', border: 'border-l-sky-500' },
  flujoDescarga: { active: 'bg-green-600 ring-green-400', hover: 'hover:bg-green-100 hover:border-green-400', border: 'border-l-green-500' },
  temperaturaEstator: { active: 'bg-amber-600 ring-amber-400', hover: 'hover:bg-amber-100 hover:border-amber-400', border: 'border-l-amber-500' },
  posicionValvulaRecirc: { active: 'bg-lime-600 ring-lime-400', hover: 'hover:bg-lime-100 hover:border-lime-400', border: 'border-l-lime-500' },
};

// Colores de botones para sensores generales
export const SENSOR_GENERAL_BUTTON_COLORS: Record<string, SensorButtonColors> = {
  voltajeBarra: { active: 'bg-orange-600 ring-orange-400', hover: 'hover:bg-orange-100 hover:border-orange-400', border: 'border-l-orange-500' },
  presionAguaMP: { active: 'bg-purple-600 ring-purple-400', hover: 'hover:bg-purple-100 hover:border-purple-400', border: 'border-l-purple-500' },
  presionAgua: { active: 'bg-purple-600 ring-purple-400', hover: 'hover:bg-purple-100 hover:border-purple-400', border: 'border-l-purple-500' },
  flujoAguaDomoAP: { active: 'bg-emerald-600 ring-emerald-400', hover: 'hover:bg-emerald-100 hover:border-emerald-400', border: 'border-l-emerald-500' },
  flujoAguaRecalentador: { active: 'bg-lime-600 ring-lime-400', hover: 'hover:bg-lime-100 hover:border-lime-400', border: 'border-l-lime-500' },
  flujoAguaDomoMP: { active: 'bg-teal-600 ring-teal-400', hover: 'hover:bg-teal-100 hover:border-teal-400', border: 'border-l-teal-500' },
  temperaturaAguaAlim: { active: 'bg-red-600 ring-red-400', hover: 'hover:bg-red-100 hover:border-red-400', border: 'border-l-red-500' },
  flujoDomoAPCompensated: { active: 'bg-cyan-600 ring-cyan-400', hover: 'hover:bg-cyan-100 hover:border-cyan-400', border: 'border-l-cyan-500' },
  temperaturaAmbiental: { active: 'bg-yellow-600 ring-yellow-400', hover: 'hover:bg-yellow-100 hover:border-yellow-400', border: 'border-l-yellow-500' },
  mwBrutosGeneracionGas: { active: 'bg-red-600 ring-red-400', hover: 'hover:bg-red-100 hover:border-red-400', border: 'border-l-red-500' },
  flujoAguaVaporAlta: { active: 'bg-fuchsia-600 ring-fuchsia-400', hover: 'hover:bg-fuchsia-100 hover:border-fuchsia-400', border: 'border-l-fuchsia-500' },
  presionAguaEconAP: { active: 'bg-indigo-600 ring-indigo-400', hover: 'hover:bg-indigo-100 hover:border-indigo-400', border: 'border-l-indigo-500' },
};

// Colores de etiquetas (tags)
export const SENSOR_TAG_COLORS: Record<string, string> = {
  corriente: 'bg-blue-100 text-blue-800',
  excentricidadBomba: 'bg-cyan-100 text-cyan-800',
  temperaturaDescansoBomba: 'bg-orange-100 text-orange-800',
  temperaturaDescansoMotor: 'bg-pink-100 text-pink-800',
  temperaturaInternaEmpuje: 'bg-teal-100 text-teal-800',
  vibracionAxial: 'bg-slate-200 text-slate-800',
  vibracionXInterno: 'bg-violet-100 text-violet-800',
  vibracionYInterno: 'bg-fuchsia-100 text-fuchsia-800',
  vibracionXExterno: 'bg-indigo-100 text-indigo-800',
  vibracionYExterno: 'bg-rose-100 text-rose-800',
  tempDescansoBomba: 'bg-orange-100 text-orange-800',
  tempDescansoMotor: 'bg-pink-100 text-pink-800',
  tempDescansoEmpuje: 'bg-teal-100 text-teal-800',
  vibracionAxialEmpuje: 'bg-slate-200 text-slate-800',
  vibracionXDescanso: 'bg-violet-100 text-violet-800',
  vibracionYDescanso: 'bg-fuchsia-100 text-fuchsia-800',
  vibracionXDescansoExterno: 'bg-indigo-100 text-indigo-800',
  vibracionYDescansoExterno: 'bg-rose-100 text-rose-800',
  presionSuccionBAA: 'bg-sky-100 text-sky-800',
  flujoDescarga: 'bg-green-100 text-green-800',
  temperaturaEstator: 'bg-amber-100 text-amber-800',
  posicionValvulaRecirc: 'bg-rose-100 text-rose-800',
  voltajeBarra: 'bg-orange-100 text-orange-800',
  presionAguaMP: 'bg-purple-100 text-purple-800',
  presionAgua: 'bg-purple-100 text-purple-800',
  flujoAguaDomoAP: 'bg-emerald-100 text-emerald-800',
  flujoAguaRecalentador: 'bg-lime-100 text-lime-800',
  flujoAguaDomoMP: 'bg-teal-100 text-teal-800',
  temperaturaAguaAlim: 'bg-red-100 text-red-800',
  flujoDomoAPCompensated: 'bg-cyan-100 text-cyan-800',
  temperaturaAmbiental: 'bg-yellow-100 text-yellow-800',
  mwBrutosGeneracionGas: 'bg-red-100 text-red-800',
  flujoAguaVaporAlta: 'bg-fuchsia-100 text-fuchsia-800',
  presionAguaEconAP: 'bg-indigo-100 text-indigo-800',
};

// URLs de PowerBI para cada bomba
export const POWERBI_URLS: Record<BombaId, string> = {
  A: '',
  B: '',
};

// Configuracion de colores por bomba
export const BOMBA_SECTION_COLORS: Record<BombaId, { dot: string; text: string; textDark: string; line: string; lineDark: string }> = {
  A: {
    dot: 'bg-blue-500',
    text: 'text-blue-700',
    textDark: 'text-blue-400',
    line: 'bg-blue-200',
    lineDark: 'bg-blue-800',
  },
  B: {
    dot: 'bg-purple-500',
    text: 'text-purple-700',
    textDark: 'text-purple-400',
    line: 'bg-purple-200',
    lineDark: 'bg-purple-800',
  },
};

// Opciones de limite de registros
export const OPCIONES_LIMITE = [
  { valor: 40, texto: '40 registros' },
  { valor: 100, texto: '100 registros' },
  { valor: 200, texto: '200 registros' },
  { valor: 500, texto: '500 registros' },
];

// Sensores generales (compartidos entre ambas bombas)
export const SENSORES_GENERALES_KEYS = [
  'voltajeBarra',
  'flujoAguaDomoAP',
  'flujoAguaRecalentador',
  'flujoAguaDomoMP',
  'temperaturaAguaAlim',
  'flujoDomoAPCompensated',
  'temperaturaAmbiental',
  'mwBrutosGeneracionGas',
  'flujoAguaVaporAlta',
  'presionAguaEconAP',
];

// Helper para obtener el label de un sensor
export const getSensorLabel = (key: string): string => {
  return SENSOR_LABELS[key] || key;
};

// Helper para obtener la configuracion de grafico de un sensor
export const getSensorConfig = (key: string): SensorUIConfig => {
  return SENSORES_GRAFICOS_CONFIG[key] || { titulo: key, unidad: '', color: 'gray' };
};

// Helper para obtener el color de etiqueta de un sensor
export const getTagColor = (key: string): string => {
  return SENSOR_TAG_COLORS[key] || 'bg-gray-100 text-gray-800';
};
