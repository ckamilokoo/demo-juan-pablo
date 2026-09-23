// Envío de correos del agente: SMTP (mismo esquema que Backend-GM:
// Gmail + contraseña de aplicación) con el gráfico capturado incrustado en
// el cuerpo como imagen inline (cid), para que se vea sin abrir adjuntos.
import nodemailer from "nodemailer";
import type { H3Event } from "h3";

export const TIPOS_CORREO = ["falla", "alerta", "grafico", "reporte"] as const;
export type TipoCorreo = (typeof TIPOS_CORREO)[number];

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
export const esCorreoValido = (c: string) => EMAIL_RE.test(c.trim());

export const MAX_DESTINATARIOS = 5;
// Base64 de ~4 MB ≈ 3 MB de PNG: un gráfico a 2x pesa bastante menos.
export const MAX_IMAGEN_BASE64 = 4_000_000;

export const leerContactos = (event: H3Event): Array<{ nombre: string; correo: string }> => {
  const { contactosCorreo } = useRuntimeConfig(event);
  try {
    const obj = JSON.parse(String(contactosCorreo || "{}")) as Record<string, string>;
    return Object.entries(obj)
      .filter(([, correo]) => typeof correo === "string" && esCorreoValido(correo))
      .map(([nombre, correo]) => ({ nombre, correo: correo.trim() }));
  } catch {
    console.warn("[correo] CONTACTOS_CORREO no es JSON válido");
    return [];
  }
};

// Límite simple en memoria: evita que un bucle del agente mande decenas de correos.
const envios: number[] = [];
const MAX_POR_HORA = 15;
export const dentroDelLimite = () => {
  const hace1h = Date.now() - 3_600_000;
  while (envios.length && envios[0] < hace1h) envios.shift();
  if (envios.length >= MAX_POR_HORA) return false;
  envios.push(Date.now());
  return true;
};

const escapar = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ETIQUETA_TIPO: Record<TipoCorreo, { texto: string; color: string }> = {
  falla: { texto: "Reporte de falla", color: "#dc2626" },
  alerta: { texto: "Aviso de alerta", color: "#ea580c" },
  grafico: { texto: "Gráfico compartido", color: "#2563eb" },
  reporte: { texto: "Reporte de turno", color: "#0f766e" },
};

// Reporte de turno (formato de agente/reporteTurno.ts). Todo se escapa: viene del navegador.
export interface ReporteCorreo {
  periodo?: { desde?: string; hasta?: string; horasReales?: number };
  estado?: { bomba_activa?: string; eficiencia_a_pct?: number | null; eficiencia_b_pct?: number | null; potencia_neta_mw?: number | null };
  alertas?: { por_nivel?: Record<string, number>; lista?: Array<Record<string, unknown>> };
  sensores?: Array<Record<string, unknown>>;
  bitacoras?: Array<Record<string, unknown>>;
}

const COLOR_NIVEL: Record<string, string> = { "CRÍTICA": "#dc2626", ALERTA: "#ea580c", AVISO: "#0d9488" };
const txt = (v: unknown) => escapar(String(v ?? "—"));
const num = (v: unknown, d = 1) => (typeof v === "number" && isFinite(v) ? v.toLocaleString("es-CL", { maximumFractionDigits: d }) : "—");
const th = (t: string) => `<th style="text-align:left;padding:6px 8px;font-size:12px;color:#475569;border-bottom:1px solid #e2e8f0">${t}</th>`;
const td = (t: string, extra = "") => `<td style="padding:6px 8px;font-size:12px;border-bottom:1px solid #f1f5f9;${extra}">${t}</td>`;
const titulo = (t: string) => `<div style="font-size:14px;font-weight:700;margin:18px 0 6px;color:#0f172a">${t}</div>`;
const tabla = (cab: string[], filas: string[]) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
     <tr>${cab.map(th).join("")}</tr>${filas.join("") || `<tr>${td("Sin registros en el periodo", "color:#94a3b8")}</tr>`}
   </table>`;

const seccionesReporte = (r: ReporteCorreo) => {
  const e = r.estado ?? {};
  const pn = r.alertas?.por_nivel ?? {};
  const alertas = (r.alertas?.lista ?? []).slice(0, 25).map((a) => {
    const nivel = String(a.nivel ?? "");
    return `<tr>${td(`<b style="color:${COLOR_NIVEL[nivel] ?? "#334155"}">${txt(nivel)}</b>`)}${td(txt(a.sensor))}${td(txt(a.bomba))}${td(txt(a.hora))}${td(txt(a.accion))}</tr>`;
  });
  const sensores = (r.sensores ?? []).slice(0, 15).map(
    (s) =>
      `<tr>${td(txt(s.sensor))}${td(txt(s.bomba))}${td(`${num(s.actual)} ${txt(s.unidad)}`)}${td(`${num(s.min)} – ${num(s.max)}`)}${td(num(s.umbral))}${td(`${num(s.lecturas_anomalas, 0)}/${num(s.lecturas_totales, 0)}`)}</tr>`
  );
  const bitacoras = (r.bitacoras ?? []).slice(0, 20).map(
    (b) => `<tr>${td(`<b style="color:${COLOR_NIVEL[String(b.nivel)] ?? "#334155"}">${txt(b.nivel)}</b>`)}${td(txt(b.bomba))}${td(txt(b.fecha))}${td(txt(b.texto))}</tr>`
  );
  return `
    ${titulo("Estado operativo")}
    <div style="font-size:13px;line-height:1.6">
      Bomba en operación: <b>${txt(e.bomba_activa)}</b> · Eficiencia A: <b>${num(e.eficiencia_a_pct)} %</b> ·
      Eficiencia B: <b>${num(e.eficiencia_b_pct)} %</b> · Potencia neta: <b>${num(e.potencia_neta_mw)} MW</b>
    </div>
    ${titulo(`Alertas del periodo (críticas ${num(pn["CRÍTICA"], 0)} · alertas ${num(pn.ALERTA, 0)} · avisos ${num(pn.AVISO, 0)})`)}
    ${tabla(["Nivel", "Sensor", "Bomba", "Hora", "Acción recomendada"], alertas)}
    ${titulo("Sensores con lecturas anómalas")}
    ${tabla(["Sensor", "Bomba", "Actual", "Mín – Máx", "Umbral", "Anómalas"], sensores)}
    ${titulo("Bitácoras del periodo")}
    ${tabla(["Nivel", "Bomba", "Fecha", "Registro"], bitacoras)}`;
};

export const plantillaCorreo = (o: {
  tipo: TipoCorreo;
  asunto: string;
  cuerpo: string;
  descripcionGrafico?: string;
  conImagen: boolean;
  reporte?: ReporteCorreo;
}) => {
  const etiqueta = ETIQUETA_TIPO[o.tipo];
  const parrafos = o.cuerpo
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.55">${escapar(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const fecha = new Date().toLocaleString("es-CL", { dateStyle: "long", timeStyle: "short" });
  return `<!doctype html>
<html><body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <tr><td style="background:#0f172a;padding:18px 24px;color:#ffffff">
          <div style="font-size:12px;letter-spacing:2px;color:#fb923c;font-weight:700">PLANTA DEMO · MONITOREO PREDICTIVO</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px">${escapar(o.asunto)}</div>
        </td></tr>
        <tr><td style="padding:20px 24px 4px">
          <span style="display:inline-block;background:${etiqueta.color}1a;color:${etiqueta.color};font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px">${etiqueta.texto}</span>
        </td></tr>
        <tr><td style="padding:12px 24px 6px;font-size:15px">${parrafos}${o.reporte ? seccionesReporte(o.reporte) : ""}</td></tr>
        ${
          o.conImagen
            ? `<tr><td style="padding:0 24px 8px">
                 <img src="cid:grafico" alt="${escapar(o.descripcionGrafico || "Gráfico")}" width="592" style="width:100%;max-width:592px;border-radius:8px;border:1px solid #e2e8f0;display:block">
                 ${o.descripcionGrafico ? `<div style="font-size:12px;color:#64748b;margin-top:6px">${escapar(o.descripcionGrafico)}</div>` : ""}
               </td></tr>`
            : ""
        }
        <tr><td style="padding:16px 24px 22px;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9">
          Enviado por Atlas, asistente de voz de Planta Demo · ${fecha}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

export const enviarCorreoSmtp = async (
  event: H3Event,
  o: { para: string[]; asunto: string; html: string; texto: string; imagenPngBase64?: string }
) => {
  const c = useRuntimeConfig(event);
  const puerto = Number(c.smtpPort) || 587;
  const transporte = nodemailer.createTransport({
    host: c.smtpHost,
    port: puerto,
    secure: puerto === 465,
    auth: { user: c.smtpUser, pass: c.smtpPassword },
    connectionTimeout: 30_000,
  });
  return transporte.sendMail({
    from: { name: c.smtpFromNombre, address: c.smtpFrom || c.smtpUser },
    to: o.para,
    subject: o.asunto,
    text: o.texto,
    html: o.html,
    attachments: o.imagenPngBase64
      ? [{ filename: "grafico.png", content: Buffer.from(o.imagenPngBase64, "base64"), cid: "grafico", contentType: "image/png" }]
      : [],
  });
};
