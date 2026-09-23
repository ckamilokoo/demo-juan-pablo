// Captura un gráfico de la pantalla como PNG para incrustarlo en un correo.
// No es un pantallazo: se exporta el canvas del gráfico (Chart.js) o la
// instancia de ECharts, así sale nítido y sin el resto de la interfaz.
import { Chart } from "chart.js";
import { normalizarTexto } from "~/utils/resolverSensor";

export interface CapturaGrafico {
  imagen: string; // data:image/png;base64,...
  descripcion: string;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Texto de las cercanías del canvas (título de la tarjeta), para reconocerlo.
const textoCercano = (el: Element) => {
  let n: Element | null = el;
  for (let i = 0; i < 5 && n; i++) n = n.parentElement;
  return normalizarTexto((n as HTMLElement | null)?.innerText?.slice(0, 400) ?? "");
};

const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 150 && r.height > 100;
};

/** Canvas de Chart.js más adecuado para `pista` (nombre de sensor), o el más grande. */
const buscarCanvasChartJs = (pista?: string): HTMLCanvasElement | null => {
  const canvases = [...document.querySelectorAll("main canvas")].filter(
    (c): c is HTMLCanvasElement => c instanceof HTMLCanvasElement && !!Chart.getChart(c) && visible(c)
  );
  if (!canvases.length) return null;
  if (pista) {
    const p = normalizarTexto(pista);
    const coincide = canvases.find((c) => {
      const etiquetas = (Chart.getChart(c)?.data.datasets ?? []).map((d) => normalizarTexto(String(d.label ?? "")));
      return etiquetas.some((e) => e.includes(p) || p.includes(e)) || textoCercano(c).includes(p);
    });
    if (coincide) return coincide;
  }
  return canvases.sort((a, b) => b.width * b.height - a.width * a.height)[0];
};

/** Compone la imagen final: franja con título y hora + gráfico. */
const componer = (fuente: CanvasImageSource, ancho: number, alto: number, titulo: string, fondo: string, tinta: string) => {
  const escala = Math.min(1, 1400 / ancho);
  const w = Math.round(ancho * escala);
  const h = Math.round(alto * escala);
  const franja = 56;
  const c = document.createElement("canvas");
  c.width = w + 32;
  c.height = h + franja + 16;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = tinta;
  ctx.font = "600 20px Segoe UI, Arial, sans-serif";
  ctx.fillText(titulo, 16, 32);
  ctx.globalAlpha = 0.6;
  ctx.font = "14px Segoe UI, Arial, sans-serif";
  ctx.fillText(new Date().toLocaleString("es-CL"), 16, 50);
  ctx.globalAlpha = 1;
  ctx.drawImage(fuente, 16, franja, w, h);
  return c.toDataURL("image/png");
};

const cargarImagen = (src: string) =>
  new Promise<HTMLImageElement>((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = src;
  });

/**
 * Espera a que el gráfico esté dibujado y lo captura.
 * - tipo 'chartjs': señales y anomalías (usa `pista` = nombre del sensor).
 * - tipo 'echarts': eficiencia (índice de tarjeta: 0 sistema, 1 bomba A, 2 bomba B).
 */
export const capturarGrafico = async (o: {
  tipo: "chartjs" | "echarts";
  pista?: string;
  indiceEcharts?: number;
  titulo: string;
  oscuro: boolean;
}): Promise<CapturaGrafico | null> => {
  const fondo = o.oscuro ? "#111827" : "#ffffff";
  const tinta = o.oscuro ? "#e5e7eb" : "#0f172a";
  const limite = Date.now() + 6000;

  while (Date.now() < limite) {
    if (o.tipo === "chartjs") {
      const canvas = buscarCanvasChartJs(o.pista);
      const puntos = canvas ? (Chart.getChart(canvas)?.data.datasets ?? []).reduce((n, d) => n + (d.data?.length ?? 0), 0) : 0;
      if (canvas && puntos > 0) {
        await esperar(900); // dejar terminar animaciones y el último refresco
        return { imagen: componer(canvas, canvas.width, canvas.height, o.titulo, fondo, tinta), descripcion: o.titulo };
      }
    } else {
      const { getInstanceByDom } = await import("echarts");
      const divs = [...document.querySelectorAll("main [_echarts_instance_]")] as HTMLElement[];
      const div = divs[o.indiceEcharts ?? 0];
      const inst = div && getInstanceByDom(div);
      if (inst && visible(div)) {
        await esperar(1200); // dejar terminar la animación de las líneas
        const url = inst.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: fondo });
        const img = await cargarImagen(url);
        return { imagen: componer(img, img.width, img.height, o.titulo, fondo, tinta), descripcion: o.titulo };
      }
    }
    await esperar(250);
  }
  return null;
};
