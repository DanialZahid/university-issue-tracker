export function formatTicketNumber(ticketNumber: number): string {
  return `CMP-${String(ticketNumber).padStart(5, '0')}`;
}
