// Foto del estado de la planta y de la pantalla, en el formato que consumen
// el agente de voz y el analista LangGraph. Se arma en el navegador porque
// ahí viven los datos (simulador) y el estado de la interfaz.
import { escenario, alertasVisibles } from "~/mock/escenario";
import { leerSenal, ultimaEficiencia, bitacorasActuales } from "~/mock/simulador";
import { perfilDe } from "~/mock/perfiles";
import { buscarConfigSensor } from "~/config/sensoresAnomaliasConfig";
import { catalogoSensores } from "~/utils/resolverSensor";
import { estadoUI } from "~/composables/useControlUI";

export interface EstadoPlanta {
  hora: string;
  transmitiendo: boolean;
  bomba_activa: string;
  vista_actual: string;
  alertas: Array<{
    nivel: string;
    bomba: string;
    sensor: string;
    hora: string;
    deteccion_n: number;
    descripcion: string;
  }>;
  bitacoras: Array<{ nivel: string; bomba: string; fecha: string; texto: string }>;
  sensores: Record<"A" | "B", Array<{
    sensor: string;
    valor: number;
    unidad: string;
    umbral: number;
    estado: "normal" | "anómalo" | "sin clasificar";
  }>>;
  eficiencia: {
    bomba_a_pct: number | null;
    bomba_b_pct: number | null;
    potencia_neta_mw: number | null;
  };
}

const horaCorta = (iso: string | number) =>
  new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const ESTADOS = { 1: "normal", "-1": "anómalo", 0: "sin clasificar" } as const;

export const construirEstadoPlanta = (): EstadoPlanta => {
  const transmitiendo = escenario.transmisionInicio !== null;
  const ahora = Date.now();

  const sensores = (bomba: "A" | "B") =>
    !transmitiendo
      ? []
      : catalogoSensores(bomba).map((s) => {
          const { valor, clasificacion } = leerSenal(bomba, s.endpoint, ahora);
          return {
            sensor: s.titulo,
            valor,
            unidad: s.unidad,
            umbral: perfilDe(s.endpoint).umbral,
            estado: ESTADOS[clasificacion as 1 | -1 | 0],
          };
        });

  const ef = transmitiendo ? ultimaEficiencia() : { A: null, B: null, potencia: null };

  return {
    hora: horaCorta(ahora),
    transmitiendo,
    bomba_activa: escenario.bombaActiva,
    vista_actual: estadoUI.vistaNombre,
    alertas: alertasVisibles(1).slice(0, 30).map((a) => ({
      nivel: a.nivel,
      bomba: a.tabla_origen,
      sensor: buscarConfigSensor(a.tipo_sensor).label,
      hora: horaCorta(a.timestamp),
      deteccion_n: escenario.anomalias.find((x) => x.id === a.id)?.ocurrencia ?? 1,
      descripcion: a.descripcion.replace(/\s*Acci[oó]n recomendada[\s\S]*$/i, ""),
    })),
    // Solo las que tienen nivel (ALERTA/AVISO): son las del panel "Bitácoras de alertas y avisos".
    bitacoras: bitacorasActuales()
      .filter((b) => b.alerta_aviso)
      .sort((x, y) => Date.parse(y.tiempo_ejecucion) - Date.parse(x.tiempo_ejecucion))
      .map((b) => ({
        nivel: b.alerta_aviso as string,
        bomba: b.bomba,
        fecha: new Date(b.tiempo_ejecucion).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }),
        texto: b.bitacora,
      })),
    sensores: { A: sensores("A"), B: sensores("B") },
    eficiencia: {
      bomba_a_pct: ef.A?.valor_sensor ?? null,
      bomba_b_pct: ef.B?.valor_sensor ?? null,
      potencia_neta_mw: ef.potencia?.valor_neto ?? null,
    },
  };
};

/** Resumen corto en texto de lo que hay en pantalla (herramienta rápida). */
export const resumenPantalla = (): string => {
  const e = construirEstadoPlanta();
  if (!e.transmitiendo) {
    return `Vista: ${e.vista_actual}. La planta no está transmitiendo datos todavía (se inicia con simular_evento).`;
  }
  const porNivel = (n: string) => e.alertas.filter((a) => a.nivel === n).length;
  const anomalos = (["A", "B"] as const).flatMap((b) =>
    e.sensores[b].filter((s) => s.estado === "anómalo").map((s) => `${s.sensor} (Bomba ${b})`)
  );
  const bit = (n: string) => e.bitacoras.filter((b) => b.nivel === n).length;
  return (
    `Vista: ${e.vista_actual}. Bomba en operación: ${e.bomba_activa}. ` +
    `Bitácoras con nivel: ${bit("ALERTA")} alertas y ${bit("AVISO")} avisos. ` +
    `Alertas del último día: ${porNivel("CRÍTICA")} críticas, ${porNivel("ALERTA")} alertas, ${porNivel("AVISO")} avisos. ` +
    `Sensores anómalos ahora: ${anomalos.join(", ") || "ninguno"}.`
  );
};
