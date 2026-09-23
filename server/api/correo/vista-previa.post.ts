// Devuelve el HTML exacto que se enviaría, SIN enviarlo (vista previa del
// correo en una pestaña nueva). No requiere SMTP.
import { TIPOS_CORREO, plantillaCorreo, type TipoCorreo, type ReporteCorreo } from "../../utils/correo";

export default defineEventHandler(async (event) => {
  const b = await readBody<{ asunto?: string; cuerpo?: string; tipo?: TipoCorreo; imagen?: string; descripcionGrafico?: string; reporte?: ReporteCorreo }>(event);
  if (!b?.tipo || !TIPOS_CORREO.includes(b.tipo)) throw createError({ statusCode: 400, statusMessage: "Tipo inválido" });
  let html = plantillaCorreo({
    tipo: b.tipo,
    asunto: String(b.asunto ?? "").slice(0, 150),
    cuerpo: String(b.cuerpo ?? "").slice(0, 5000),
    descripcionGrafico: b.descripcionGrafico,
    conImagen: !!b.imagen,
    reporte: b.tipo === "reporte" && b.reporte && typeof b.reporte === "object" ? b.reporte : undefined,
  });
  // En el correo real la imagen va inline (cid); en la vista previa, como data URL.
  if (b.imagen && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(b.imagen)) html = html.replace('src="cid:grafico"', `src="${b.imagen}"`);
  setHeader(event, "Content-Type", "text/html; charset=utf-8");
  return html;
});
