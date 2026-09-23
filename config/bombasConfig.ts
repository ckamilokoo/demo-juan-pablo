// Configuracion centralizada para Bomba A y Bomba B
// Este archivo contiene toda la configuracion de endpoints, sensores y mapeos

export type BombaId = 'A' | 'B';

export interface SensorMapping {
  localName: string;
  endpoint: string;
  defaultEnabled?: boolean;
}

export interface BombaConfig {
  id: BombaId;
  nombre: string;
  sensoresEndpoint: string;
  bitacorasEndpoint: string;
  prediccionEndpoint: string;
  eficienciaEndpoint: string;
  queryKeyPrefix: string;
  colores: {
    primary: string;
    secondary: string;
    dot: string;
  };
  // Mapeo de sensores especificos de la bomba (10 sensores)
  sensoresBomba: SensorMapping[];
  // Mapeo de sensores generales (15 sensores) - compartidos pero con endpoints diferentes
  sensoresGenerales: SensorMapping[];
}

// Sensores generales compartidos entre ambas bombas
// Solo cambia el formato del endpoint (guiones vs guiones bajos)
const crearSensoresGenerales = (bombaId: BombaId): SensorMapping[] => {
  const usarGuionBajo = bombaId === 'B';
  const sep = usarGuionBajo ? '_' : '-';

  return [
    { localName: 'presionSuccionBAA', endpoint: `presion${sep}succion${sep}baa` },
    { localName: 'flujoDescarga', endpoint: bombaId === 'A' ? 'flujo-salida-12fpmfc' : 'flujo_descarga' },
    { localName: 'temperaturaEstator', endpoint: `temperatura${sep}estator` },
    { localName: 'posicionValvulaRecirc', endpoint: `posicion${sep}valvula${sep}recirc` },
    { localName: 'voltajeBarra', endpoint: `voltaje${sep}barra` },
    { localName: bombaId === 'A' ? 'presionAguaMP' : 'presionAgua', endpoint: bombaId === 'A' ? 'presion-agua-mp' : 'presion_agua' },
    { localName: 'flujoAguaDomoAP', endpoint: `flujo${sep}agua${sep}domo${sep}ap` },
    { localName: 'flujoAguaRecalentador', endpoint: `flujo${sep}agua${sep}recalentador` },
    { localName: 'flujoAguaDomoMP', endpoint: `flujo${sep}agua${sep}domo${sep}mp` },
    { localName: 'temperaturaAguaAlim', endpoint: `temperatura${sep}agua${sep}alim` },
    { localName: 'flujoDomoAPCompensated', endpoint: `flujo${sep}domo${sep}ap${sep}compensated` },
    { localName: 'temperaturaAmbiental', endpoint: `temperatura${sep}ambiental` },
    { localName: 'mwBrutosGeneracionGas', endpoint: `mw${sep}brutos${sep}generacion${sep}gas` },
    { localName: 'flujoAguaVaporAlta', endpoint: `flujo${sep}agua${sep}vapor${sep}alta` },
    { localName: 'presionAguaEconAP', endpoint: `presion${sep}agua${sep}econ${sep}ap` },
  ];
};

export const BOMBAS_CONFIG: Record<BombaId, BombaConfig> = {
  A: {
    id: 'A',
    nombre: 'Bomba A',
    sensoresEndpoint: '/sensores',
    bitacorasEndpoint: '/gm-bitacoras',
    prediccionEndpoint: '/sensores/predicciones-bomba-a',
    eficienciaEndpoint: '/sensores/eficiencia',
    queryKeyPrefix: 'sensores',
    colores: {
      primary: 'blue-500',
      secondary: 'blue-700',
      dot: '#3b82f6',
    },
    sensoresBomba: [
      { localName: 'corriente', endpoint: 'corriente', defaultEnabled: true },
      { localName: 'excentricidadBomba', endpoint: 'excentricidad-bomba' },
      { localName: 'temperaturaDescansoBomba', endpoint: 'temperatura-descanso-bomba' },
      { localName: 'temperaturaDescansoMotor', endpoint: 'temperatura-descanso-motor' },
      { localName: 'temperaturaInternaEmpuje', endpoint: 'temperatura-interna-empuje' },
      { localName: 'vibracionAxial', endpoint: 'vibracion-axial' },
      { localName: 'vibracionXInterno', endpoint: 'vibracion-x-interno' },
      { localName: 'vibracionYInterno', endpoint: 'vibracion-y-interno' },
      { localName: 'vibracionXExterno', endpoint: 'vibracion-x-externo' },
      { localName: 'vibracionYExterno', endpoint: 'vibracion-y-externo' },
    ],
    sensoresGenerales: crearSensoresGenerales('A'),
  },
  B: {
    id: 'B',
    nombre: 'Bomba B',
    sensoresEndpoint: '/sensores_b',
    bitacorasEndpoint: '/gm-bitacoras/b',
    prediccionEndpoint: '/sensores_b/predicciones-bomba-b',
    eficienciaEndpoint: '/sensores_b/eficiencia',
    queryKeyPrefix: 'sensoresB',
    colores: {
      primary: 'purple-500',
      secondary: 'purple-700',
      dot: '#a855f7',
    },
    sensoresBomba: [
      { localName: 'corriente', endpoint: 'corriente', defaultEnabled: true },
      { localName: 'excentricidadBomba', endpoint: 'excentricidad_bomba' },
      { localName: 'tempDescansoBomba', endpoint: 'temp_descanso_bomba' },
      { localName: 'tempDescansoMotor', endpoint: 'temp_descanso_motor' },
      { localName: 'tempDescansoEmpuje', endpoint: 'temp_descanso_empuje' },
      { localName: 'vibracionAxialEmpuje', endpoint: 'vibracion_axial_empuje' },
      { localName: 'vibracionXDescanso', endpoint: 'vibracion_x_descanso' },
      { localName: 'vibracionYDescanso', endpoint: 'vibracion_y_descanso' },
      { localName: 'vibracionXDescansoExterno', endpoint: 'vibracion_x_descanso_externo' },
      { localName: 'vibracionYDescansoExterno', endpoint: 'vibracion_y_descanso_externo' },
    ],
    sensoresGenerales: crearSensoresGenerales('B'),
  },
};

// Helper para obtener todos los sensores de una bomba
export const getAllSensores = (bombaId: BombaId): SensorMapping[] => {
  const config = BOMBAS_CONFIG[bombaId];
  return [...config.sensoresBomba, ...config.sensoresGenerales];
};

// Helper para obtener la configuracion de una bomba
export const getBombaConfig = (bombaId: BombaId): BombaConfig => {
  return BOMBAS_CONFIG[bombaId];
};

// Obtener todos los endpoints de sensores generales (usados como tipo_sensor en alertas)
export const getSensoresGeneralesEndpoints = (bombaId: BombaId): string[] => {
  return BOMBAS_CONFIG[bombaId].sensoresGenerales.map(s => s.endpoint);
};

// Normalizar nombre de sensor: quitar prefijo prediccion y unificar separadores
export const normalizarSensor = (tipoSensor: string): string => {
  return tipoSensor.replace(/^prediccion[_-]/, '').replace(/[-_]/g, '-');
};

// Verificar si un tipo_sensor corresponde a un sensor general
// Los tipo_sensor del API pueden tener prefijo "prediccion_" o "prediccion-"
export const esSensorGeneral = (tipoSensor: string): boolean => {
  const normalizado = normalizarSensor(tipoSensor);
  const endpointsA = getSensoresGeneralesEndpoints('A').map(e => e.replace(/[-_]/g, '-'));
  const endpointsB = getSensoresGeneralesEndpoints('B').map(e => e.replace(/[-_]/g, '-'));
  return endpointsA.includes(normalizado) || endpointsB.includes(normalizado);
};
