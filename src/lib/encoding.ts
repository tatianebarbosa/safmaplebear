const WINDOWS_1252_DECODER = new TextDecoder("windows-1252");

const ENCODING_FIXES: Record<string, string> = {
  "AdimplǦncia": "Adimplência",
  "Utiliza��ǜo": "Utilização",
  "Habilita��ǜo": "Habilitação",
  "Observa��ǜo": "Observação",
  "C��digo": "Código",
  "Eleg��vel": "Elegível",
  Nǜo: "Não",
  "Cama��ari": "Camaçari",
  "Paul��nia": "Paulínia",
  "Cambu��": "Cambuí",
  "Bǭrbara": "Bárbara",
  "orienta����es": "orientações",
  "AndrǸ": "André",
  "Joǜo": "João",
  "Florian��polis": "Florianópolis",
  "Goi��nia": "Goiânia",
  Paranǭ: "Paraná",
  "Ribeirǜo": "Ribeirão",
  "Sǜo": "São",
};

export function decodeWindows1252(buffer: ArrayBuffer): string {
  return WINDOWS_1252_DECODER.decode(buffer).replace(/^\uFEFF/, "");
}

export async function fetchCsvWindows1252(path: string): Promise<string> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Falha ao carregar CSV ${path}: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  return decodeWindows1252(buffer);
}

export function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function fixEncoding(text: string): string {
  if (!text) return text;

  let fixedText = text;
  Object.entries(ENCODING_FIXES).forEach(([broken, correct]) => {
    fixedText = fixedText.replace(new RegExp(broken, "g"), correct);
  });

  return fixedText.normalize("NFC");
}
