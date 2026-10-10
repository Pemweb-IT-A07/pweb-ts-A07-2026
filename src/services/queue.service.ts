import type { PriorityLevel, QueueType, Ticket } from "../types/index.js";
import { getQueueTypes, getTickets, setQueueTypes, setTickets } from "./storage.service.js";

const PRIORITY_WEIGHT: Record<PriorityLevel, number> = {
  VIP: 3,
  Disabilitas: 2,
  Lansia: 1,
  Normal: 0,
};

const DEFAULT_QUEUE_TYPES: QueueType[] = [
  { code: "U", name: "Umum", active: true },
  { code: "G", name: "Gigi", active: true },
  { code: "F", name: "Farmasi", active: true },
];

/** Mengisi data awal jenis antrian bila Local Storage masih kosong. */
export function ensureSeedData(): void {
  if (getQueueTypes().length === 0) {
    setQueueTypes(DEFAULT_QUEUE_TYPES);
  }
}

export function listQueueTypes(): QueueType[] {
  return getQueueTypes();
}

export function listActiveQueueTypes(): QueueType[] {
  return getQueueTypes().filter((q) => q.active);
}

export function findQueueType(code: string): QueueType | undefined {
  return getQueueTypes().find((q) => q.code === code);
}

export type CreateQueueTypeResult = { ok: true } | { ok: false; message: string };

export function createQueueType(rawCode: string, rawName: string): CreateQueueTypeResult {
  const code = rawCode.trim().toUpperCase();
  const name = rawName.trim();

  if (!/^[A-Z]$/.test(code)) {
    return { ok: false, message: "Kode harus 1 huruf kapital (A-Z)." };
  }
  if (name.length === 0) {
    return { ok: false, message: "Nama layanan tidak boleh kosong." };
  }

  const list = getQueueTypes();
  const duplicate = list.some(
    (q) => q.code.toLowerCase() === code.toLowerCase() || q.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    return { ok: false, message: "Kode atau nama layanan sudah digunakan." };
  }

  list.push({ code, name, active: true });
  setQueueTypes(list);
  return { ok: true };
}

export function toggleQueueTypeActive(code: string): void {
  const list = getQueueTypes();
  const target = list.find((q) => q.code === code);
  if (!target) return;
  target.active = !target.active;
  setQueueTypes(list);
}

export function deleteQueueType(code: string): void {
  setQueueTypes(getQueueTypes().filter((q) => q.code !== code));
  setTickets(getTickets().filter((t) => t.queueCode !== code));
}

/** Mengosongkan seluruh antrian aktif dan mengembalikan penomoran tiket ke awal. */
export function resetAllQueues(): void {
  setTickets([]);
}

export function listTickets(): Ticket[] {
  return getTickets();
}

export function listTicketsForQueue(code: string): Ticket[] {
  return getTickets().filter((t) => t.queueCode === code);
}

function nextTicketNumber(code: string): number {
  const tickets = listTicketsForQueue(code);
  if (tickets.length === 0) return 1;
  return Math.max(...tickets.map((t) => t.number)) + 1;
}

export function issueTicket(code: string, priority: PriorityLevel): Ticket | null {
  const queueType = findQueueType(code);
  if (!queueType || !queueType.active) return null;

  const ticket: Ticket = {
    id: crypto.randomUUID(),
    queueCode: code,
    number: nextTicketNumber(code),
    priority,
    status: "Menunggu",
    createdAt: Date.now(),
  };

  const tickets = getTickets();
  tickets.push(ticket);
  setTickets(tickets);
  return ticket;
}

export function sortWaitingOrder(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (weightDiff !== 0) return weightDiff;
    return a.createdAt - b.createdAt;
  });
}

export function getWaitingTickets(code: string): Ticket[] {
  return sortWaitingOrder(listTicketsForQueue(code).filter((t) => t.status === "Menunggu"));
}

export function getCalledTicket(code: string): Ticket | undefined {
  return listTicketsForQueue(code).find((t) => t.status === "Dipanggil");
}

export function getNextWaitingTicket(code: string): Ticket | undefined {
  return getWaitingTickets(code)[0];
}

export function queueWaitingCount(code: string): number {
  return getWaitingTickets(code).length;
}

function updateTicket(ticketId: string, updater: (ticket: Ticket) => void): Ticket | null {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) return null;
  updater(ticket);
  setTickets(tickets);
  return ticket;
}

/** Memanggil tiket tertentu secara langsung; tiket lain yang sedang dipanggil di jenis antrian yang sama otomatis menjadi Selesai. */
export function callTicket(ticketId: string): Ticket | null {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) return null;

  for (const other of tickets) {
    if (other.queueCode === ticket.queueCode && other.status === "Dipanggil" && other.id !== ticket.id) {
      other.status = "Selesai";
    }
  }
  ticket.status = "Dipanggil";
  setTickets(tickets);
  return ticket;
}

export function completeTicket(ticketId: string): Ticket | null {
  return updateTicket(ticketId, (t) => {
    t.status = "Selesai";
  });
}

export function skipTicket(ticketId: string): Ticket | null {
  return updateTicket(ticketId, (t) => {
    t.status = "Dilewati";
  });
}

/** Menutup tiket yang sedang dipanggil (bila ada) sebagai Selesai, lalu memanggil tiket berikutnya berdasarkan prioritas. */
export function callNextInQueue(code: string): Ticket | null {
  const current = getCalledTicket(code);
  if (current) {
    completeTicket(current.id);
  }
  const next = getNextWaitingTicket(code);
  if (!next) return null;
  return callTicket(next.id);
}
