// Estado compartido de la simulación guiada. La app arranca sin datos; el
// primer evento "conecta" la planta (empiezan a llegar señales) y, unos
// segundos después, un sensor escala aviso → alerta → crítica según su
// propio contador. Los eventos siguientes escalan otros sensores.
import { ref, readonly, type Ref } from "vue";
import {
  dispararAnomalia,
  iniciarTransmision,
  reiniciarEscenario,
  escenario,
  ahoraSim,
  msSimAReal,
  type Anomalia,
  type Bomba,
} from "~/mock/escenario";

export type FaseEvento = "inactivo" | "recibiendo" | "analizando" | "detectada";

// Singleton global (sobrevive a copias del módulo por recarga en caliente).
const G = ((globalThis as any).__eventoDemo ??= { fase: ref<FaseEvento>("inactivo"), transmitiendo: ref(false) });
const fase: Ref<FaseEvento> = G.fase;
const transmitiendo: Ref<boolean> = G.transmitiendo;
let timers: ReturnType<typeof setTimeout>[] = [];

const limpiarTimers = () => {
  timers.forEach(clearTimeout);
  timers = [];
};

const programar = (ms: number, fn: () => void) => {
  timers.push(setTimeout(fn, Math.max(0, ms)));
};

// Fases del indicador: "recibiendo" hasta que empieza el desvío, "analizando"
// mientras el modelo lo evalúa y "detectada" cuando existe la alerta.
const programarFases = (principal: Anomalia, detecciones: number[], alDetectar?: () => void) => {
  // Las anomalías están en hora de planta; los timers, en tiempo real.
  const ahora = ahoraSim();
  const enReal = (tSim: number) => msSimAReal(tSim - ahora);
  fase.value = "recibiendo";
  programar(enReal(principal.inicio), () => (fase.value = "analizando"));
  detecciones.forEach((t, i) =>
    programar(enReal(t) + 150, () => {
      if (i === 0) fase.value = "detectada";
      alDetectar?.();
    })
  );
  const ultima = Math.max(...detecciones);
  programar(enReal(ultima) + 8000, () => (fase.value = "inactivo"));
};

// Sensor principal de cada "Simular evento", en rotación por bomba.
const ROTACION: Record<Bomba, string[]> = {
  A: ["corriente", "vibracion-axial", "temperatura-descanso-bomba"],
  B: ["corriente", "vibracion_axial_empuje", "temp_descanso_bomba"],
};

// Sensores físicamente relacionados que se desvían junto al principal en el
// mismo episodio (para Combinado/Conjunto). Fuera de la rotación, así no
// adelantan el contador de los principales.
const CORRELADOS: Record<string, string[]> = {
  "corriente": ["excentricidad-bomba", "vibracion-x-interno"],
  "vibracion-axial": ["vibracion-y-interno", "temperatura-interna-empuje"],
  "temperatura-descanso-bomba": ["temperatura-descanso-motor", "vibracion-x-externo"],
};
const CORRELADOS_B: Record<string, string[]> = {
  "corriente": ["excentricidad_bomba", "vibracion_x_descanso"],
  "vibracion_axial_empuje": ["vibracion_y_descanso", "temp_descanso_empuje"],
  "temp_descanso_bomba": ["temp_descanso_motor", "vibracion_x_descanso_externo"],
};
const RETRASO_CORRELADO_MS = 2000;
const turnos: Record<Bomba, number> = { A: 0, B: 0 };

// Una escalada = 3 anomalías superpuestas del MISMO sensor que empiezan cada
// 8 s y terminan juntas: la señal sube en escalones y el contador del sensor
// produce aviso → alerta → crítica (si el sensor ya tenía historial, sigue
// desde donde iba).
const ESCALONES = 3;
const PASO_ESCALON_MS = 8000;
const DURACION_ESCALADA_S = 60;

export const useEventoDemo = () => {
  /**
   * Primer uso: inicia la transmisión (unos segundos de datos normales) y
   * luego la escalada. Siguientes usos: escalada del próximo sensor de la
   * rotación, en la bomba en operación. `alDetectar` se llama en cada alerta.
   */
  const simular = (alDetectar?: () => void): Bomba => {
    limpiarTimers();

    let retrasoInicial = 3000;
    if (!transmitiendo.value) {
      iniciarTransmision();
      transmitiendo.value = true;
      // Señal estable llegando antes del primer desvío.
      retrasoInicial = 10000;
    }

    // Ocurre en la bomba que está operando (A si están ambas o ninguna).
    const bomba: Bomba = escenario.bombaActiva === "B" ? "B" : "A";
    const sensor = ROTACION[bomba][turnos[bomba]++ % ROTACION[bomba].length];
    const escalada = Array.from({ length: ESCALONES }, (_, i) =>
      dispararAnomalia(bomba, sensor, undefined, {
        retrasoMs: retrasoInicial + i * PASO_ESCALON_MS,
        duracionS: DURACION_ESCALADA_S - (i * PASO_ESCALON_MS) / 1000,
      })
    );
    // Los relacionados arrancan poco después del principal y terminan con él;
    // cada uno genera una alerta según su propio contador.
    const relacionados = (bomba === "A" ? CORRELADOS : CORRELADOS_B)[sensor] || [];
    const secundarias = relacionados.map((rel, i) => {
      const retraso = retrasoInicial + (i + 1) * RETRASO_CORRELADO_MS;
      return dispararAnomalia(bomba, rel, undefined, {
        retrasoMs: retraso,
        duracionS: DURACION_ESCALADA_S - (retraso - retrasoInicial) / 1000,
      });
    });
    programarFases(
      escalada[0],
      [...escalada, ...secundarias].map((a) => a.deteccion).sort((x, y) => x - y),
      alDetectar
    );
    return bomba;
  };

  /** Anomalía puntual (panel oculto). Inicia la transmisión si hacía falta. */
  const anomaliaManual = (bomba: Bomba, sensor: string, nivel?: Anomalia["nivel"]) => {
    if (!transmitiendo.value) {
      iniciarTransmision();
      transmitiendo.value = true;
    }
    return dispararAnomalia(bomba, sensor, nivel);
  };

  const reiniciar = () => {
    limpiarTimers();
    reiniciarEscenario();
    turnos.A = 0;
    turnos.B = 0;
    transmitiendo.value = false;
    fase.value = "inactivo";
  };

  return {
    fase: readonly(fase),
    transmitiendo: readonly(transmitiendo),
    simular,
    anomaliaManual,
    reiniciar,
  };
};
