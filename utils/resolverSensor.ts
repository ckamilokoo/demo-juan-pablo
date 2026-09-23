// Traduce nombres dichos en lenguaje natural ("vibración axial", "temp del
// motor", "corriente") al sensor de cada bomba. Los nombres internos difieren
// entre A y B (temperaturaDescansoBomba vs tempDescansoBomba), así que se
// compara por palabras contra título, etiqueta, clave y endpoint.
import { getAllSensores as sensoresUI } from "~/config/sensoresConfig";
import { getAllSensores as sensoresApi, type BombaId } from "~/config/bombasConfig";

export interface SensorResuelto {
  localName: string; // clave usada por SensoresUnificado
  endpoint: string; // slug usado por la API / alertas
  titulo: string;
  unidad: string;
}

const SINONIMOS: Record<string, string> = {
  temp: "temperatura",
  vib: "vibracion",
  desc: "descanso",
  presion: "presion",
  generacion: "mw",
  potencia: "mw",
  amperes: "corriente",
  amperaje: "corriente",
  valvula: "valvula",
};

const PALABRAS_VACIAS = new Set(["de", "del", "la", "el", "los", "las", "sensor", "senal", "grafico", "bomba", "a", "b", "y", "en"]);

export const normalizarTexto = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2");

const tokens = (t: string) =>
  normalizarTexto(t.replace(/([a-z])([A-Z])/g, "$1 $2"))
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !PALABRAS_VACIAS.has(w))
    .map((w) => SINONIMOS[w] ?? w);

export const catalogoSensores = (bomba: BombaId): SensorResuelto[] => {
  const ui = sensoresUI(bomba) as Record<string, { titulo: string; unidad: string }>;
  return sensoresApi(bomba).map((s) => ({
    localName: s.localName,
    endpoint: s.endpoint,
    titulo: ui[s.localName]?.titulo ?? s.localName,
    unidad: ui[s.localName]?.unidad ?? "",
  }));
};

/** Mejor coincidencia para `texto`, o null si nada se parece. */
export const resolverSensor = (bomba: BombaId, texto: string): SensorResuelto | null => {
  const buscado = tokens(texto);
  if (!buscado.length) return null;
  let mejor: SensorResuelto | null = null;
  let mejorPuntaje = 0;
  for (const s of catalogoSensores(bomba)) {
    const candidatos = new Set([
      ...tokens(s.titulo),
      ...tokens(s.localName),
      ...tokens(s.endpoint.replace(/[-_]/g, " ")),
    ]);
    let puntaje = 0;
    for (const w of buscado) {
      if (candidatos.has(w)) puntaje += 2;
      else if ([...candidatos].some((c) => c.startsWith(w) || w.startsWith(c))) puntaje += 1;
    }
    // Desempate: preferir el sensor con menos palabras sobrantes.
    const ajustado = puntaje - candidatos.size * 0.01;
    if (puntaje > 0 && ajustado > mejorPuntaje) {
      mejorPuntaje = ajustado;
      mejor = s;
    }
  }
  return mejor;
};
