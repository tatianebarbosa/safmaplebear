const WINDOWS_1252_DECODER = new TextDecoder("windows-1252");
const UTF8_DECODER = new TextDecoder("utf-8");

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

function garbledScore(value: string): number {
  const patterns = [/�/g, /Ã./g, /�/g];
  return patterns.reduce((score, regex) => score + (value.match(regex)?.length || 0), 0);
}

export async function fetchCsvSmart(path: string): Promise<string> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Falha ao carregar CSV ${path}: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const utf8 = UTF8_DECODER.decode(buffer);
  const win1252 = WINDOWS_1252_DECODER.decode(buffer);

  return garbledScore(utf8) <= garbledScore(win1252) ? utf8 : win1252;
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
