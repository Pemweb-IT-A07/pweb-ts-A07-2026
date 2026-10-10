export function padNumber(num: number, length = 3): string {
  return String(num).padStart(length, "0");
}

export function formatTicketCode(queueCode: string, number: number): string {
  return `${queueCode}-${padNumber(number)}`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
