import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export function formatDate(dateString: string, pattern = "dd/MM/yyyy") {
  return format(parseISO(dateString), pattern, { locale: vi });
}

export function formatDateTime(dateString: string) {
  return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
}
