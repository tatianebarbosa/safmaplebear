import { CalendarEvent, CalendarEventInput } from "@/types/events";
import { getAuthToken } from "@/services/authService";
import { getCurrentUser } from "@/services/authService";

// Cliente simples para a API de eventos; reutiliza a base configurada no Vite
const apiBase =
  typeof import.meta !== "undefined"
    ? ((import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? "")
    : "";
const apiPrefix = apiBase ? apiBase.replace(/\/$/, "") : "";

const buildUrl = (suffix = "") => `${apiPrefix}/api/events${suffix}`;

const authHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const parseResponse = async (res: Response) => {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    const msg = json?.message || `Erro ${res.status || "desconhecido"} ao chamar API`;
    throw new Error(msg);
  }
  return json;
};

// --- Fallback local (dev) ---
const LOCAL_KEY = "saf_local_events_v1";

const readLocal = (): CalendarEvent[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CalendarEvent[];
  } catch {
    return [];
  }
};

const writeLocal = (events: CalendarEvent[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(events));
  } catch {
    /* ignore */
  }
};

const buildLocalEvent = (input: CalendarEventInput): CalendarEvent => {
  const user = getCurrentUser();
  const now = new Date().toISOString();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    titulo: input.titulo,
    descricao: input.descricao,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    tipo: input.tipo,
    createdByUserId: user?.id ?? user?.username ?? "local-user",
    createdByName: user?.username ?? "Usuario local",
    createdAt: now,
    updatedAt: now,
  };
};

export async function fetchEvents(month: string, day?: string): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({ mes: month });
  if (day) params.set("dia", day);

  try {
    const res = await fetch(`${buildUrl()}?${params.toString()}`, {
      method: "GET",
      headers: authHeaders(),
    });
    const json = await parseResponse(res);
    return (json.events ?? json.data ?? []) as CalendarEvent[];
  } catch (error) {
    // fallback local em modo dev
    console.warn("fetchEvents fallback local", error);
    const all = readLocal();
    const filtered = all.filter((ev) => ev.dataInicio.startsWith(month));
    return day ? filtered.filter((ev) => ev.dataInicio.startsWith(day)) : filtered;
  }
}

export async function createEvent(input: CalendarEventInput): Promise<CalendarEvent> {
  try {
    const res = await fetch(buildUrl(), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    const json = await parseResponse(res);
    return (json.event ?? json.data) as CalendarEvent;
  } catch (error) {
    console.warn("createEvent fallback local", error);
    const events = readLocal();
    const newEvent = buildLocalEvent(input);
    events.push(newEvent);
    writeLocal(events);
    return newEvent;
  }
}

export async function updateEvent(id: string, input: CalendarEventInput): Promise<CalendarEvent> {
  try {
    const res = await fetch(buildUrl(`/${id}`), {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    const json = await parseResponse(res);
    return (json.event ?? json.data) as CalendarEvent;
  } catch (error) {
    console.warn("updateEvent fallback local", error);
    const events = readLocal();
    const idx = events.findIndex((ev) => ev.id === id);
    if (idx === -1) throw error;
    const updated: CalendarEvent = {
      ...events[idx],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    events[idx] = updated;
    writeLocal(events);
    return updated;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    const res = await fetch(buildUrl(`/${id}`), {
      method: "DELETE",
      headers: authHeaders(),
    });
    await parseResponse(res);
  } catch (error) {
    console.warn("deleteEvent fallback local", error);
    const events = readLocal().filter((ev) => ev.id !== id);
    writeLocal(events);
  }
}
