const WINDOWS_1252_DECODER = new TextDecoder("windows-1252");

const ENCODING_FIXES: Record<string, string> = {
  "Adimpl?ncia": "Adimpl?ncia",
  "Utiliza??o": "Utiliza??o",
  "Habilita??o": "Habilita??o",
  "Observa??o": "Observa??o",
  "C?digo": "C?digo",
  "Eleg?vel": "Eleg?vel",
  "N?o": "N?o",
  "Cama?ari": "Cama?ari",
  "Paul?nia": "Paul?nia",
  "Cambu?": "Cambu?",
  "B?rbara": "B?rbara",
  "orienta??es": "orienta??es",
  "Andr?": "Andr?",
  "Jo?o": "Jo?o",
  "Florian?polis": "Florian?polis",
  "Goi?nia": "Goi?nia",
  "Paran?": "Paran?",
  "Ribeir?o": "Ribeir?o",
  "S?o": "S?o",
};

export function decodeWindows1252(buffer: ArrayBuffer): string {
  return WINDOWS_1252_DECODER.decode(buffer).replace(/^/, "");
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
    .replace(/[-]/g, "")
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
