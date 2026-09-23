// Conocimiento de dominio de sensores (glosario + acciones recomendadas por
// nivel), adaptado del backend real (SENSOR_INFO / knowledge_base). Genérico: sin marcas.
export type NivelConocimiento = "AVISO" | "ALERTA" | "CRÍTICA";

export interface ConocimientoSensor {
  nombre: string;            // nombre legible, p. ej. "Vibración axial"
  que_mide: string;          // 1 frase
  unidad: string;            // unidad de la demo
  por_que_importa: string;   // 1-2 frases: qué indica que suba/baje, riesgo
  causas_tipicas: string[];  // 2-4 causas probables de desvío
  acciones: Record<NivelConocimiento, string>; // acción recomendada por nivel (1 frase cada una)
}

// ── Eléctricos ──
const corriente: ConocimientoSensor = {
  nombre: "Corriente del motor",
  que_mide: "Corriente eléctrica consumida por el motor de la bomba de alimentación.",
  unidad: "A",
  por_que_importa:
    "Es uno de los indicadores más críticos: una subida indica sobrecarga mecánica o hidráulica del motor; una caída brusca puede indicar pérdida de carga o de cebado de la bomba.",
  causas_tipicas: [
    "Aumento de demanda de flujo o presión de descarga",
    "Roce o daño mecánico en rodamientos o impulsor",
    "Desbalance o caída de tensión en la alimentación",
    "Cavitación o pérdida de succión (caída de corriente)",
  ],
  acciones: {
    AVISO: "Verificar niveles de carga y distribución eléctrica.",
    ALERTA: "Revisar sobrecarga en el sistema eléctrico y reducir carga de la bomba si es posible.",
    CRÍTICA: "Intervención inmediata: riesgo de falla eléctrica; activar protocolos de seguridad.",
  },
};

const voltajeBarra: ConocimientoSensor = {
  nombre: "Voltaje de barra",
  que_mide: "Tensión en la barra de media tensión que alimenta los motores de las bombas (compartido A/B).",
  unidad: "V",
  por_que_importa:
    "Una caída de tensión obliga al motor a tomar más corriente y calentarse; sobretensiones o fluctuaciones pueden dañar aislamientos y disparar protecciones.",
  causas_tipicas: [
    "Perturbaciones en la red o en el transformador auxiliar",
    "Arranque de otras cargas grandes en la misma barra",
    "Falla en la regulación de tensión",
  ],
  acciones: {
    AVISO: "Verificar estabilidad del suministro eléctrico.",
    ALERTA: "Revisar regulación de voltaje y protecciones.",
    CRÍTICA: "Intervención inmediata: riesgo de daño en equipos por fluctuaciones de voltaje.",
  },
};

const temperaturaEstator: ConocimientoSensor = {
  nombre: "Temperatura del estator",
  que_mide: "Temperatura del bobinado del estator del motor de la bomba.",
  unidad: "°C",
  por_que_importa:
    "Una temperatura alta sostenida degrada el aislamiento del bobinado y acorta la vida del motor; suele acompañar a sobrecarga o mala refrigeración.",
  causas_tipicas: [
    "Sobrecarga del motor (corriente alta)",
    "Ventilación o refrigeración del motor obstruida",
    "Desbalance o baja tensión de alimentación",
    "Temperatura ambiente elevada",
  ],
  acciones: {
    AVISO: "Verificar sistema de refrigeración del motor.",
    ALERTA: "Revisar carga del motor y sistema de ventilación.",
    CRÍTICA: "Intervención inmediata: riesgo de falla en el aislamiento del motor.",
  },
};

// ── Temperaturas de descansos ──
const tempDescansoBomba: ConocimientoSensor = {
  nombre: "Temperatura descanso bomba",
  que_mide: "Temperatura del descanso (rodamiento/cojinete) interno de la bomba.",
  unidad: "°C",
  por_que_importa:
    "Un aumento indica fricción excesiva, lubricación deficiente o desgaste; si no se corrige puede terminar en agarrotamiento del cojinete. Es un sensor crítico.",
  causas_tipicas: [
    "Lubricación insuficiente o aceite degradado",
    "Falla en el enfriamiento del aceite",
    "Desgaste del cojinete o desalineación",
    "Carga radial excesiva",
  ],
  acciones: {
    AVISO: "Verificar sistema de lubricación y enfriamiento.",
    ALERTA: "Revisar desgaste y programar mantenimiento preventivo.",
    CRÍTICA: "Intervención inmediata: riesgo de falla mecánica en la bomba.",
  },
};

const tempDescansoMotor: ConocimientoSensor = {
  nombre: "Temperatura descanso motor",
  que_mide: "Temperatura del descanso (cojinete) del motor que acciona la bomba.",
  unidad: "°C",
  por_que_importa:
    "Una subida indica calentamiento del motor o problemas de lubricación en su cojinete; sostenida, arriesga la falla del motor por sobrecalentamiento.",
  causas_tipicas: [
    "Ventilación deficiente o carga elevada del motor",
    "Lubricación inadecuada del cojinete",
    "Desalineación del acoplamiento motor-bomba",
  ],
  acciones: {
    AVISO: "Verificar ventilación y cargas de operación.",
    ALERTA: "Revisar sistema eléctrico y refrigeración del motor.",
    CRÍTICA: "Intervención inmediata: riesgo de falla del motor por sobrecalentamiento.",
  },
};

const tempEmpuje: ConocimientoSensor = {
  nombre: "Temperatura descanso de empuje",
  que_mide: "Temperatura del cojinete de empuje, que soporta la carga axial del rotor de la bomba.",
  unidad: "°C",
  por_que_importa:
    "Una subida indica mayor carga axial o problemas de lubricación; el cojinete de empuje es clave para mantener la posición axial del rotor.",
  causas_tipicas: [
    "Aumento de carga axial (desgaste de disco de balance o anillos)",
    "Lubricación o enfriamiento deficientes",
    "Desalineación",
  ],
  acciones: {
    AVISO: "Verificar alineación y lubricación.",
    ALERTA: "Revisar carga axial y sistema de enfriamiento.",
    CRÍTICA: "Intervención inmediata: riesgo de falla en el sistema de empuje.",
  },
};

// ── Vibraciones y excentricidad ──
const excentricidad: ConocimientoSensor = {
  nombre: "Excentricidad de la bomba",
  que_mide: "Desplazamiento del eje respecto a su centro de giro (excentricidad del rotor).",
  unidad: "ms",
  por_que_importa:
    "Valores altos indican desalineación o eje fuera de centro, lo que aumenta vibraciones y desgaste de cojinetes y sellos.",
  causas_tipicas: [
    "Desalineación del eje o del acoplamiento",
    "Eje flectado o deformación térmica",
    "Desgaste de cojinetes",
  ],
  acciones: {
    AVISO: "Verificar alineación y balanceo del rotor.",
    ALERTA: "Revisar desgaste en cojinetes y programar mantenimiento.",
    CRÍTICA: "Intervención inmediata: riesgo de falla catastrófica por desalineación.",
  },
};

const vibracionAxial: ConocimientoSensor = {
  nombre: "Vibración axial",
  que_mide: "Vibración en la dirección del eje, medida en el descanso de empuje.",
  unidad: "ms",
  por_que_importa:
    "Vibraciones axiales altas pueden indicar desalineación, desbalance o desgaste de rodamientos, y comprometen el cojinete de empuje.",
  causas_tipicas: [
    "Desalineación del acoplamiento",
    "Desbalance del rotor",
    "Desgaste de rodamientos o del cojinete de empuje",
    "Cavitación o flujo inestable",
  ],
  acciones: {
    AVISO: "Verificar balanceo y alineación.",
    ALERTA: "Programar revisión mecánica por posible desbalance.",
    CRÍTICA: "Intervención inmediata: riesgo de daño estructural por vibraciones.",
  },
};

const vibracionRadial = (eje: "X" | "Y", lado: "interno" | "externo"): ConocimientoSensor => ({
  nombre: `Vibración ${eje} descanso ${lado}`,
  que_mide: `Vibración radial en el eje ${eje} del descanso ${lado} de la bomba.`,
  unidad: "ms",
  por_que_importa:
    "Un aumento indica desbalance, desalineación o holgura en el descanso; sostenido, acelera el desgaste de cojinetes y sellos.",
  causas_tipicas: [
    "Desbalance del rotor o impulsor",
    "Desalineación del acoplamiento",
    "Holgura o desgaste del cojinete",
    "Operación fuera del punto de diseño (recirculación, cavitación)",
  ],
  acciones:
    lado === "interno"
      ? {
          AVISO: "Verificar condiciones de operación.",
          ALERTA: "Programar revisión mecánica.",
          CRÍTICA: "Intervención inmediata: riesgo de daño en el descanso por vibraciones.",
        }
      : {
          AVISO: "Verificar condiciones de operación y comparar con el descanso interno.",
          ALERTA: "Programar revisión mecánica de alineación y anclajes.",
          CRÍTICA: "Intervención inmediata: riesgo de daño en el descanso por vibraciones.",
        },
});

const vibXInterno = vibracionRadial("X", "interno");
const vibYInterno = vibracionRadial("Y", "interno");
const vibXExterno = vibracionRadial("X", "externo");
const vibYExterno = vibracionRadial("Y", "externo");

// ── Presiones ──
const presionSuccion: ConocimientoSensor = {
  nombre: "Presión de succión de la bomba",
  que_mide: "Presión del agua a la entrada (succión) de la bomba de alimentación.",
  unidad: "barg",
  por_que_importa:
    "Si baja, el margen contra cavitación (NPSH) se reduce y la bomba puede cavitar, dañando el impulsor.",
  causas_tipicas: [
    "Bajo nivel en el tanque de agua de alimentación",
    "Filtro de succión obstruido",
    "Restricción o válvula parcialmente cerrada en la línea de succión",
  ],
  acciones: {
    AVISO: "Verificar nivel en el tanque de agua de alimentación.",
    ALERTA: "Revisar posibles restricciones en la línea de succión.",
    CRÍTICA: "Intervención inmediata: riesgo de cavitación y daño en la bomba.",
  },
};

const presionAgua: ConocimientoSensor = {
  nombre: "Presión de agua de alimentación AP",
  que_mide: "Presión del agua de alimentación de alta presión en la descarga hacia el economizador AP.",
  unidad: "barg",
  por_que_importa:
    "Una subida puede indicar restricción aguas abajo y riesgo de sobrepresión; una caída indica pérdida de rendimiento de la bomba o fuga.",
  causas_tipicas: [
    "Cambios de demanda del domo AP",
    "Válvula de control o de retención con falla",
    "Fuga en la línea de descarga",
    "Desgaste interno de la bomba",
  ],
  acciones: {
    AVISO: "Verificar sistema de regulación de presión.",
    ALERTA: "Revisar posibles fugas o fallos en el sistema de presión.",
    CRÍTICA: "Intervención inmediata: riesgo de sobrepresión en el sistema hidráulico.",
  },
};

const presionAguaMp: ConocimientoSensor = {
  nombre: "Presión de agua MP",
  que_mide: "Presión del agua de alimentación hacia el economizador de media presión.",
  unidad: "barg",
  por_que_importa:
    "Presiones fuera de rango indican fugas, restricciones o mal control, y pueden dañar el economizador MP.",
  causas_tipicas: [
    "Fuga o restricción en tuberías",
    "Falla en la válvula de control MP",
    "Variación de la presión de descarga de la bomba",
  ],
  acciones: {
    AVISO: "Verificar sistema de control de presión.",
    ALERTA: "Revisar posibles fugas o restricciones en tuberías.",
    CRÍTICA: "Intervención inmediata: riesgo de daño en el economizador por presión anormal.",
  },
};

// ── Flujos ──
const flujoDescarga: ConocimientoSensor = {
  nombre: "Flujo de descarga",
  que_mide: "Flujo de agua en la descarga de alta presión de la bomba.",
  unidad: "kg/h",
  por_que_importa:
    "Una caída indica pérdida de capacidad de bombeo u obstrucción; un aumento anormal puede indicar fuga aguas abajo o apertura indebida de válvulas.",
  causas_tipicas: [
    "Obstrucción o válvula de descarga mal posicionada",
    "Desgaste del impulsor",
    "Fuga en la línea de descarga",
    "Cambio de carga de la caldera",
  ],
  acciones: {
    AVISO: "Verificar condiciones de operación.",
    ALERTA: "Revisar posibles obstrucciones o fallos.",
    CRÍTICA: "Intervención inmediata: riesgo de falla en el sistema de descarga.",
  },
};

const flujoSalida: ConocimientoSensor = {
  ...flujoDescarga,
  nombre: "Flujo de salida (descarga)",
  que_mide: "Flujo de salida de la bomba medido en el caudalímetro de descarga.",
  causas_tipicas: [
    "Descalibración o falla del medidor de flujo",
    "Obstrucción en la línea de descarga",
    "Pérdida de capacidad de la bomba",
  ],
  acciones: {
    AVISO: "Verificar calibración del medidor de flujo.",
    ALERTA: "Revisar posibles obstrucciones o fallos en el sistema.",
    CRÍTICA: "Intervención inmediata: riesgo de operación inadecuada por medición incorrecta.",
  },
};

const flujoDomoAp: ConocimientoSensor = {
  nombre: "Flujo de agua al domo AP",
  que_mide: "Flujo de agua de alimentación hacia el domo de alta presión.",
  unidad: "kg/h",
  por_que_importa:
    "Un flujo insuficiente baja el nivel del domo AP y arriesga sobrecalentamiento de tubos; un exceso puede provocar arrastre de agua al vapor.",
  causas_tipicas: [
    "Falla en la válvula de control de nivel del domo",
    "Obstrucción en la línea de alimentación",
    "Pérdida de capacidad de la bomba de alimentación",
  ],
  acciones: {
    AVISO: "Verificar sistema de control de flujo y válvulas.",
    ALERTA: "Revisar posibles obstrucciones o fallos en las bombas de alimentación.",
    CRÍTICA: "Intervención inmediata: riesgo de sobrecalentamiento en el domo AP.",
  },
};

const flujoDomoApComp: ConocimientoSensor = {
  ...flujoDomoAp,
  nombre: "Flujo domo AP compensado",
  que_mide: "Flujo de agua de alimentación al domo AP compensado por presión y temperatura.",
  causas_tipicas: [
    "Falla en la válvula de control de nivel del domo",
    "Error en las señales de compensación (presión/temperatura)",
    "Pérdida de capacidad de la bomba de alimentación",
  ],
};

const flujoDomoMp: ConocimientoSensor = {
  nombre: "Flujo de agua al domo MP",
  que_mide: "Flujo de agua de alimentación hacia el domo de media presión.",
  unidad: "kg/h",
  por_que_importa:
    "Desvíos afectan el nivel del domo MP: poco flujo arriesga tubos secos y exceso puede causar arrastre.",
  causas_tipicas: [
    "Falla en la válvula de control de nivel MP",
    "Restricción en la línea de alimentación",
    "Variación de la presión de descarga de la bomba",
  ],
  acciones: {
    AVISO: "Verificar sistema de control de flujo y niveles.",
    ALERTA: "Revisar funcionamiento de válvulas y sistema de bombeo.",
    CRÍTICA: "Intervención inmediata: riesgo de operación inadecuada del domo MP.",
  },
};

const flujoRecalentador: ConocimientoSensor = {
  nombre: "Flujo de agua al recalentador",
  que_mide: "Flujo de agua de atemperación inyectada al vapor recalentado.",
  unidad: "kg/h",
  por_que_importa:
    "Un aumento indica que el vapor recalentado viene más caliente de lo normal; si la atemperación falla, se arriesga sobrecalentar el recalentador y la turbina.",
  causas_tipicas: [
    "Temperatura de gases de escape elevada",
    "Falla o fuga en la válvula de atemperación",
    "Error del control de temperatura de vapor",
  ],
  acciones: {
    AVISO: "Verificar sistema de control de temperatura.",
    ALERTA: "Revisar posibles fugas o bloqueos en el sistema de atemperación.",
    CRÍTICA: "Intervención inmediata: riesgo de sobrecalentamiento en el recalentador.",
  },
};

const flujoVaporAlta: ConocimientoSensor = {
  nombre: "Flujo de atemperación vapor AP",
  que_mide: "Flujo de agua de atemperación para el vapor sobrecalentado de alta presión.",
  unidad: "kg/h",
  por_que_importa:
    "Refleja cuánto hay que enfriar el vapor AP; desvíos o fallas de atemperación pueden llevar vapor demasiado caliente a la turbina.",
  causas_tipicas: [
    "Aumento de carga o de temperatura de gases",
    "Válvula de atemperación trabada o con fuga",
    "Falla en sensores de temperatura de vapor",
  ],
  acciones: {
    AVISO: "Verificar sistema de control de temperatura del vapor.",
    ALERTA: "Revisar válvulas de atemperación y sensores de temperatura.",
    CRÍTICA: "Intervención inmediata: riesgo de daño en turbina por temperatura excesiva.",
  },
};

const valvulaRecirc: ConocimientoSensor = {
  nombre: "Recirculación de la bomba",
  que_mide: "Flujo por la válvula de recirculación de mínimo flujo de la bomba de alimentación.",
  unidad: "kg/h",
  por_que_importa:
    "La recirculación protege la bomba cuando la demanda es baja; si no abre cuando corresponde la bomba puede recalentarse o cavitar, y si abre de más se desperdicia capacidad.",
  causas_tipicas: [
    "Baja demanda de agua de alimentación",
    "Falla del actuador o del control de la válvula",
    "Fuga interna en la válvula",
  ],
  acciones: {
    AVISO: "Verificar sistema de control de la válvula.",
    ALERTA: "Revisar actuador y posibles fugas en la válvula.",
    CRÍTICA: "Intervención inmediata: riesgo de cavitación en la bomba por flujo inadecuado.",
  },
};

// ── Proceso / generales ──
const tempAguaAlim: ConocimientoSensor = {
  nombre: "Temperatura agua de alimentación",
  que_mide: "Temperatura del agua de alimentación que entrega la bomba.",
  unidad: "°C",
  por_que_importa:
    "Si sube, se reduce el margen contra cavitación en la bomba; si baja, aumenta el estrés térmico en economizadores y domos.",
  causas_tipicas: [
    "Cambios en el precalentamiento o en el desaireador",
    "Variación de carga de la unidad",
    "Falla en el control térmico",
  ],
  acciones: {
    AVISO: "Verificar sistema de precalentamiento.",
    ALERTA: "Revisar sistema de control térmico.",
    CRÍTICA: "Intervención inmediata: riesgo de daño por temperatura inadecuada.",
  },
};

const tempAmbiental: ConocimientoSensor = {
  nombre: "Temperatura ambiental",
  que_mide: "Temperatura ambiente en la zona de operación (compartido A/B).",
  unidad: "°C",
  por_que_importa:
    "No indica falla por sí misma, pero temperaturas altas reducen la refrigeración de motores y descansos y explican subidas en otros sensores.",
  causas_tipicas: [
    "Condiciones climáticas",
    "Ventilación deficiente de la sala de bombas",
  ],
  acciones: {
    AVISO: "Verificar sistemas de ventilación y refrigeración.",
    ALERTA: "Activar sistemas adicionales de enfriamiento.",
    CRÍTICA: "Intervención inmediata: riesgo de sobrecalentamiento de equipos.",
  },
};

const mwBrutos: ConocimientoSensor = {
  nombre: "Potencia bruta de generación",
  que_mide: "Potencia eléctrica bruta generada por la unidad a gas (compartido A/B).",
  unidad: "MW",
  por_que_importa:
    "Define la demanda de agua de alimentación: cambios de carga explican variaciones en flujos, presiones y corriente de la bomba.",
  causas_tipicas: [
    "Cambios de despacho o de carga",
    "Problemas en combustión o suministro de gas",
    "Condiciones ambientales que limitan la potencia",
  ],
  acciones: {
    AVISO: "Verificar eficiencia en la conversión de gas a potencia.",
    ALERTA: "Revisar sistema de combustión y suministro de gas.",
    CRÍTICA: "Intervención inmediata: riesgo de falla en el sistema de generación.",
  },
};

export const CONOCIMIENTO_SENSORES: Record<string, ConocimientoSensor> = {
  // Bomba A
  "corriente": corriente,
  "excentricidad-bomba": excentricidad,
  "temperatura-descanso-bomba": tempDescansoBomba,
  "temperatura-descanso-motor": tempDescansoMotor,
  "temperatura-interna-empuje": tempEmpuje,
  "vibracion-axial": vibracionAxial,
  "vibracion-x-interno": vibXInterno,
  "vibracion-y-interno": vibYInterno,
  "vibracion-x-externo": vibXExterno,
  "vibracion-y-externo": vibYExterno,
  "presion-succion-baa": presionSuccion,
  "flujo-salida-12fpmfc": flujoSalida,
  "temperatura-estator": temperaturaEstator,
  "posicion-valvula-recirc": valvulaRecirc,
  "presion-agua": presionAgua,
  "presion-agua-mp": presionAguaMp,
  "flujo-agua-domo-ap": flujoDomoAp,
  "flujo-domo-ap-compensated": flujoDomoApComp,
  "flujo-agua-domo-mp": flujoDomoMp,
  "flujo-agua-recalentador": flujoRecalentador,
  "flujo-agua-vapor-alta": flujoVaporAlta,
  // Bomba B (equivalentes)
  "temp-descanso-bomba": tempDescansoBomba,
  "temp-descanso-motor": tempDescansoMotor,
  "temp-descanso-empuje": tempEmpuje,
  "vibracion-axial-empuje": vibracionAxial,
  "vibracion-x-descanso": vibXInterno,
  "vibracion-y-descanso": vibYInterno,
  "vibracion-x-descanso-externo": vibXExterno,
  "vibracion-y-descanso-externo": vibYExterno,
  "flujo-descarga": flujoDescarga,
  "presion-agua-econ-ap": presionAgua,
  "temperatura-agua-alim": tempAguaAlim,
  // Compartidos
  "voltaje-barra": voltajeBarra,
  "temperatura-ambiental": tempAmbiental,
  "mw-brutos-generacion-gas": mwBrutos,
};

const normalizar = (s: string) => s.replace(/^prediccion[_-]/, "").replace(/_/g, "-").toLowerCase();

/** Conocimiento del sensor por slug (A con guiones o B con guion bajo), o null. */
export const conocimientoDe = (slug: string): ConocimientoSensor | null =>
  CONOCIMIENTO_SENSORES[normalizar(slug)] ?? null;
