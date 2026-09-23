// Emite una clave temporal (10 min) para que el navegador abra la sesión de
// voz con OpenAI Realtime por WebRTC. La API key real se queda en el servidor.
// El cliente manda sus instrucciones y herramientas (se ejecutan en el
// navegador, porque controlan la interfaz).

interface RespuestaClientSecret {
  value: string;
  expires_at: number;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  if (!config.openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Falta OPENAI_API_KEY en el archivo .env del proyecto",
    });
  }

  const body = await readBody<{ instructions?: string; tools?: unknown[] }>(event);

  try {
    const r = await $fetch<RespuestaClientSecret>("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.openaiApiKey}` },
      body: {
        expires_after: { anchor: "created_at", seconds: 600 },
        session: {
          type: "realtime",
          model: config.openaiModeloVoz,
          instructions: body?.instructions ?? "",
          tools: body?.tools ?? [],
          tool_choice: "auto",
          audio: {
            input: {
              transcription: { model: "gpt-4o-mini-transcribe", language: "es" },
              turn_detection: { type: "semantic_vad" },
            },
            output: { voice: config.openaiVoz },
          },
        },
      },
    });
    return { value: r.value, expires_at: r.expires_at };
  } catch (e: any) {
    const detalle = e?.data?.error?.message || e?.message || "error desconocido";
    console.error("[voz] No se pudo crear la sesión Realtime:", detalle);
    throw createError({ statusCode: 502, statusMessage: `OpenAI rechazó la sesión de voz: ${detalle}` });
  }
});
