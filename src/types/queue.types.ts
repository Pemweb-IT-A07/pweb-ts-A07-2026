export type PriorityLevel = "Normal" | "Lansia" | "Disabilitas" | "VIP";

export interface QueueType {
  code: string;
  name: string;
  active: boolean;
}

export type TicketStatus = "Menunggu" | "Dipanggil" | "Selesai" | "Dilewati";

export interface Ticket {
  id: string;
  queueCode: string;
  number: number;
  priority: PriorityLevel;
  status: TicketStatus;
  createdAt: number;
}
