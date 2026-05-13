import { logsApi } from "../api";

const log = (level: "INFO" | "WARN" | "ERROR", action: string, message: string, details?: any) => {
  logsApi.log({ level, action, message, details });
};

export const logger = {
  info: (action: string, message: string, details?: any) => log("INFO", action, message, details),
  warn: (action: string, message: string, details?: any) => log("WARN", action, message, details),
  error: (action: string, message: string, details?: any) => log("ERROR", action, message, details),
};

// Detectar cambios de conectividad
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    log("INFO", "connection_online", "Conexión recuperada");
  });
  window.addEventListener("offline", () => {
    log("WARN", "connection_offline", "Conexión perdida");
  });
}
