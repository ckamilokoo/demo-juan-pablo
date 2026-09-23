// Agenda de contactos del agente (CONTACTOS_CORREO) y si el SMTP está configurado.
import { leerContactos } from "../../utils/correo";

export default defineEventHandler((event) => {
  const c = useRuntimeConfig(event);
  return {
    configurado: !!(c.smtpUser && c.smtpPassword),
    contactos: leerContactos(event),
  };
});
