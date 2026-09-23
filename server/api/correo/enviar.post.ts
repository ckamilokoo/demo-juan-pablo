// Envía el borrador que el usuario confirmó (por voz o con el botón Enviar).
// Valida todo de nuevo en el servidor: destinatarios, tipo, tamaño de imagen
// y un límite de envíos por hora.
import {
  TIPOS_CORREO,
  MAX_DESTINATARIOS,
  MAX_IMAGEN_BASE64,
  esCorreoValido,
  dentroDelLimite,
  plantillaCorreo,
  enviarCorreoSmtp,
  type TipoCorreo,
  type ReporteCorreo,
} from "../../utils/correo";

interface Cuerpo {
  para?: string[];
  asunto?: string;
  cuerpo?: string;
  tipo?: TipoCorreo;
  imagen?: string; // data:image/png;base64,...
  descripcionGrafico?: string;
  reporte?: ReporteCorreo; // solo para tipo "reporte"
}

export default defineEventHandler(async (event) => {
  const c = useRuntimeConfig(event);
  if (!c.smtpUser || !c.smtpPassword) {
    throw createError({ statusCode: 500, statusMessage: "Correo no configurado: faltan SMTP_USER y SMTP_PASSWORD en .env" });
  }

  const b = await readBody<Cuerpo>(event);
  const para = [...new Set((b?.para ?? []).map((x) => String(x).trim().toLowerCase()))];
  if (!para.length || para.length > MAX_DESTINATARIOS || !para.every(esCorreoValido)) {
    throw createError({ statusCode: 400, statusMessage: `Destinatarios inválidos (1 a ${MAX_DESTINATARIOS} correos válidos)` });
  }
  if (!b?.tipo || !TIPOS_CORREO.includes(b.tipo)) {
    throw createError({ statusCode: 400, statusMessage: "Tipo inválido: solo fallas, alertas, gráficos o reportes" });
  }
  const asunto = String(b.asunto ?? "").trim().slice(0, 150);
  const cuerpo = String(b.cuerpo ?? "").trim().slice(0, 5000);
  if (!asunto || !cuerpo) throw createError({ statusCode: 400, statusMessage: "Falta asunto o cuerpo" });

  let imagenPngBase64: string | undefined;
  if (b.imagen) {
    const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(b.imagen);
    if (!m || m[1].length > MAX_IMAGEN_BASE64) {
      throw createError({ statusCode: 400, statusMessage: "Imagen inválida o demasiado grande" });
    }
    imagenPngBase64 = m[1];
  }

  if (!dentroDelLimite()) {
    throw createError({ statusCode: 429, statusMessage: "Límite de correos por hora alcanzado" });
  }

  try {
    const info = await enviarCorreoSmtp(event, {
      para,
      asunto,
      texto: cuerpo + (b.descripcionGrafico ? `\n\n[Gráfico: ${b.descripcionGrafico}]` : ""),
      html: plantillaCorreo({
        tipo: b.tipo,
        asunto,
        cuerpo,
        descripcionGrafico: b.descripcionGrafico,
        conImagen: !!imagenPngBase64,
        reporte: b.tipo === "reporte" && b.reporte && typeof b.reporte === "object" ? b.reporte : undefined,
      }),
      imagenPngBase64,
    });
    return { ok: true, id: info.messageId, para };
  } catch (e: any) {
    console.error("[correo] Falló el envío:", e?.message || e);
    throw createError({ statusCode: 502, statusMessage: `No se pudo enviar el correo: ${e?.message || "error SMTP"}` });
  }
});
