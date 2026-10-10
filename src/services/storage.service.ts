import type { QueueType, SessionUser, Ticket } from "../types/index.js";

const KEYS = {
  SESSION: "antrian:session",
  QUEUE_TYPES: "antrian:queue-types",
  TICKETS: "antrian:tickets",
} as const;

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSession(): SessionUser | null {
  return readJson<SessionUser | null>(KEYS.SESSION, null);
}

export function setSession(session: SessionUser): void {
  writeJson(KEYS.SESSION, session);
}

export function clearSession(): void {
  localStorage.removeItem(KEYS.SESSION);
}

export function getQueueTypes(): QueueType[] {
  return readJson<QueueType[]>(KEYS.QUEUE_TYPES, []);
}

export function setQueueTypes(list: QueueType[]): void {
  writeJson(KEYS.QUEUE_TYPES, list);
}

export function getTickets(): Ticket[] {
  return readJson<Ticket[]>(KEYS.TICKETS, []);
}

export function setTickets(list: Ticket[]): void {
  writeJson(KEYS.TICKETS, list);
}
