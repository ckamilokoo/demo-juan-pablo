// Reporte de turno: mismas secciones que el reporte ejecutivo del backend
// real (servicios/reporte_service.py + reporte_pdf.py de Backend-GM), pero
// calculado en el navegador sobre los datos simulados.
//   1. Estado operativo   2. Resumen ejecutivo (LLM)   3. Alertas por nivel
//   4. Sensores con lecturas anómalas (actual/mín/máx)   5. Bitácoras del periodo
import { ref, type Ref } from "vue";
import { escenario, alertasVisibles, accionRecomendada, ahoraSim, type NivelAlerta } from "~/mock/escenario";
import { leerSenal, ultimaEficiencia, bitacorasActuales } from "~/mock/simulador";
import { perfilDe } from "~/mock/perfiles";
import { buscarConfigSensor } from "~/config/sensoresAnomaliasConfig";
import { catalogoSensores } from "~/utils/resolverSensor";

export interface ReporteTurno {
  generado: string; // ISO
  periodo: { desde: string; hasta: string; horas: number; horasReales: number };
  estado: {
    bomba_activa: string;
    eficiencia_a_pct: number | null;
    eficiencia_b_pct: number | null;
    potencia_neta_mw: number | null;
  };
  alertas: {
    por_nivel: Record<NivelAlerta, number>;
    lista: Array<{ nivel: NivelAlerta; bomba: string; sensor: string; hora: string; deteccion_n: number; accion: string }>;
  };
  sensores: Array<{
    bomba: string;
    sensor: string;
    unidad: string;
    actual: number;
    min: number;
    max: number;
    umbral: number;
    lecturas_anomalas: number;
    lecturas_totales: number;
  }>;
  bitacoras: Array<{ nivel: string; bomba: string; fecha: string; texto: string }>;
  narrativa: string | null;
}

// Reporte abierto en pantalla (uno a la vez), compartido entre la
// herramienta de voz y el componente ReporteTurno.vue.
const g = globalThis as any;
export const reporteAbierto: Ref<ReporteTurno | null> = (g.__reporteTurno ??= ref<ReporteTurno | null>(null));

const MAX_MUESTRAS = 240;
const HORA_MS = 3_600_000;

const horaCorta = (t: string | number) =>
  new Date(t).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

/** "45 min" o "2,5 h" para leer en voz y mostrar. */
export const duracionLegible = (horas: number) =>
  horas < 1 ? `${Math.max(1, Math.round(horas * 60))} min` : `${horas.toLocaleString("es-CL", { maximumFractionDigits: 1 })} h`;

/** Arma los datos del reporte de las últimas `horas` (o desde que empezó la transmisión). */
export const construirReporte = (horas = 8): ReporteTurno => {
  const ahora = ahoraSim();
  const desdePedido = ahora - horas * HORA_MS;
  const inicio = escenario.transmisionInicio;
  const desde = inicio === null ? ahora : Math.max(desdePedido, inicio);

  // Sensores: muestreo de la ventana; solo los que tuvieron lecturas anómalas.
  const sensores: ReporteTurno["sensores"] = [];
  if (inicio !== null) {
    const paso = Math.max(60_000, Math.ceil((ahora - desde) / MAX_MUESTRAS)); // datos por minuto
    for (const bomba of ["A", "B"] as const) {
      for (const s of catalogoSensores(bomba)) {
        let min = Infinity, max = -Infinity, anomalas = 0, total = 0;
        for (let t = desde; t <= ahora; t += paso) {
          const { valor, clasificacion } = leerSenal(bomba, s.endpoint, t);
          min = Math.min(min, valor);
          max = Math.max(max, valor);
          if (clasificacion === -1) anomalas++;
          total++;
        }
        if (anomalas > 0) {
          sensores.push({
            bomba,
            sensor: s.titulo,
            unidad: s.unidad,
            actual: leerSenal(bomba, s.endpoint, ahora).valor,
            min,
            max,
            umbral: perfilDe(s.endpoint).umbral,
            lecturas_anomalas: anomalas,
            lecturas_totales: total,
          });
        }
      }
    }
    sensores.sort((a, b) => b.lecturas_anomalas - a.lecturas_anomalas);
  }

  // Alertas del periodo, más graves primero y luego más recientes.
  const orden: Record<string, number> = { "CRÍTICA": 0, ALERTA: 1, AVISO: 2 };
  const lista = alertasVisibles(Math.max(1, horas / 24))
    .filter((a) => Date.parse(a.timestamp) >= desde)
    .map((a) => ({
      nivel: a.nivel as NivelAlerta,
      bomba: a.tabla_origen,
      sensor: buscarConfigSensor(a.tipo_sensor).label,
      hora: horaCorta(a.timestamp),
      deteccion_n: escenario.anomalias.find((x) => x.id === a.id)?.ocurrencia ?? 1,
      accion: accionRecomendada(a.tipo_sensor, a.nivel as NivelAlerta),
    }))
    .sort((x, y) => orden[x.nivel] - orden[y.nivel]);

  const bitacoras = bitacorasActuales()
    .filter((b) => b.alerta_aviso && Date.parse(b.tiempo_ejecucion) >= desdePedido)
    .sort((x, y) => Date.parse(y.tiempo_ejecucion) - Date.parse(x.tiempo_ejecucion))
    .map((b) => ({
      nivel: b.alerta_aviso as string,
      bomba: b.bomba,
      fecha: new Date(b.tiempo_ejecucion).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }),
      texto: b.bitacora.length > 180 ? b.bitacora.slice(0, 177) + "…" : b.bitacora,
    }));

  const ef = inicio !== null ? ultimaEficiencia() : { A: null, B: null, potencia: null };

  return {
    generado: new Date(ahora).toISOString(),
    periodo: {
      desde: new Date(desde).toISOString(),
      hasta: new Date(ahora).toISOString(),
      horas,
      horasReales: +((ahora - desde) / HORA_MS).toFixed(2),
    },
    estado: {
      bomba_activa: escenario.bombaActiva,
      eficiencia_a_pct: ef.A?.valor_sensor ?? null,
      eficiencia_b_pct: ef.B?.valor_sensor ?? null,
      potencia_neta_mw: ef.potencia?.valor_neto ?? null,
    },
    alertas: {
      por_nivel: {
        "CRÍTICA": lista.filter((a) => a.nivel === "CRÍTICA").length,
        ALERTA: lista.filter((a) => a.nivel === "ALERTA").length,
        AVISO: lista.filter((a) => a.nivel === "AVISO").length,
      },
      lista,
    },
    sensores,
    bitacoras,
    narrativa: null,
  };
};

/** Arma el reporte, pide el resumen ejecutivo al LLM y lo deja abierto en pantalla. */
export const generarReporte = async (horas = 8): Promise<ReporteTurno> => {
  const r = construirReporte(horas);
  try {
    const { narrativa } = await $fetch<{ narrativa: string }>("/api/reporte/narrativa", { method: "POST", body: r });
    r.narrativa = narrativa;
  } catch (e: any) {
    // Igual que el PDF real: sin narrativa si el LLM no responde.
    console.warn("[reporte] sin narrativa:", e?.data?.statusMessage || e?.message);
  }
  reporteAbierto.value = r;
  return r;
};
