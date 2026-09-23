// Estado compartido de la simulación guiada. La app arranca sin datos; el
// primer evento "conecta" la planta (empiezan a llegar señales) y, unos
// segundos después, ocurre una anomalía que el modelo detecta y alerta.
// Los eventos siguientes solo disparan anomalías nuevas.
import { ref, readonly } from "vue";
import {
  dispararAnomalia,
  iniciarTransmision,
  reiniciarEscenario,
  escenario,
  type Anomalia,
  type Bomba,
} from "~/mock/escenario";

export type FaseEvento = "inactivo" | "recibiendo" | "analizando" | "detectada";

const fase = ref<FaseEvento>("inactivo");
const transmitiendo = ref(false);
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
  const ahora = Date.now();
  fase.value = "recibiendo";
  programar(principal.inicio - ahora, () => (fase.value = "analizando"));
  detecciones.forEach((t, i) =>
    programar(t - ahora + 150, () => {
      if (i === 0) fase.value = "detectada";
      alDetectar?.();
    })
  );
  const ultima = Math.max(...detecciones);
  programar(ultima - ahora + 8000, () => (fase.value = "inactivo"));
};

export const useEventoDemo = () => {
  /**
   * Primer uso: inicia la transmisión y programa un episodio correlacionado
   * (corriente → vibración → temperatura). Siguientes usos: una anomalía
   * nueva en la bomba en operación. Devuelve la bomba afectada.
   * `alDetectar` se llama cada vez que aparece una alerta (para refrescar).
   */
  const simular = (alDetectar?: () => void): Bomba => {
    limpiarTimers();

    if (!transmitiendo.value) {
      iniciarTransmision();
      transmitiendo.value = true;
      // Unos segundos de datos normales antes del desvío, para que se vea
      // la señal estable llegando.
      const principal = dispararAnomalia("A", "corriente", "CRÍTICA", { retrasoMs: 12000 });
      const vib = dispararAnomalia("A", "vibracion-axial", "ALERTA", { retrasoMs: 15000 });
      const temp = dispararAnomalia("A", "temperatura-descanso-motor", "AVISO", { retrasoMs: 18000 });
      programarFases(principal, [principal.deteccion, vib.deteccion, temp.deteccion], alDetectar);
      return "A";
    }

    // Ocurre en la bomba que está operando (A si están ambas o ninguna).
    const bomba: Bomba = escenario.bombaActiva === "B" ? "B" : "A";
    const anomalia = dispararAnomalia(bomba, "corriente", "CRÍTICA", { retrasoMs: 3000 });
    programarFases(anomalia, [anomalia.deteccion], alDetectar);
    return bomba;
  };

  /** Anomalía puntual (panel oculto). Inicia la transmisión si hacía falta. */
  const anomaliaManual = (bomba: Bomba, sensor: string, nivel: Anomalia["nivel"]) => {
    if (!transmitiendo.value) {
      iniciarTransmision();
      transmitiendo.value = true;
    }
    return dispararAnomalia(bomba, sensor, nivel);
  };

  const reiniciar = () => {
    limpiarTimers();
    reiniciarEscenario();
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
