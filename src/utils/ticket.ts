export function formatTicketNumber(ticketNumber: number): string {
  return `CMP-${String(ticketNumber).padStart(5, '0')}`;
}

export function parseTicketNumber(value: string): number | null {
  const match = /^CMP-(\d{1,9})$/i.exec(value);
  return match ? Number(match[1]) : null;
}
