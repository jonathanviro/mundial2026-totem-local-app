import { useEffect, useState, useCallback } from "react";
import { useStore } from "../store";
import { logsApi } from "../api";

interface LogEntry {
  ts: string;
  level: "INFO" | "WARN" | "ERROR";
  action: string;
  message: string;
  details?: any;
}

const LOG_COLORS: Record<string, string> = {
  INFO: "#00e676",
  WARN: "#ffd740",
  ERROR: "#ff5252",
};


export function LogsScreen() {
  const { setScreen } = useStore();
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    logsApi.getDates().then((d) => {
      setDates(d);
      if (d.length > 0) setSelectedDate(d[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    logsApi.getByDate(selectedDate).then((entries) => {
      setLogs(entries);
    });
  }, [selectedDate]);

  const filtered = levelFilter
    ? logs.filter((e) => e.level === levelFilter)
    : logs;

  const sorted = [...filtered].sort((a, b) => {
    const diff = new Date(a.ts).getTime() - new Date(b.ts).getTime();
    return sortAsc ? diff : -diff;
  });

  const formatTime = (ts: string) => ts.slice(11, 19);

  const handleRefresh = useCallback(() => {
    if (selectedDate) {
      logsApi.getByDate(selectedDate).then(setLogs);
    }
  }, [selectedDate]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundImage: "url(/fondo_juego.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)" }} />

      {/* Header */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
          padding: "32px 60px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,.35)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,.12)",
        }}
      >
        <div style={{ position: "absolute", left: 60 }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 18, minHeight: 56, padding: "0 24px", borderRadius: 12 }}
            onClick={() => setScreen("config")}
          >
            ← Cerrar
          </button>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="screen-step">Registro de actividad</div>
          <div className="screen-title">Logs del sistema</div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "24px 60px",
          overflow: "hidden",
        }}
      >
        {/* Filtros */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexShrink: 0,
            marginBottom: 16,
          }}
        >
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              background: "rgba(255,255,255,.12)",
              border: "1px solid rgba(255,255,255,.2)",
              borderRadius: 12,
              color: "#fff",
              fontSize: 18,
              fontWeight: 600,
              padding: "12px 20px",
              fontFamily: "inherit",
              cursor: "pointer",
              minWidth: 160,
            }}
          >
            {dates.map((d) => (
              <option key={d} value={d} style={{ background: "#1a1a2e" }}>
                {d}
              </option>
            ))}
          </select>

          {["ERROR", "WARN", "INFO"].map((lvl) => (
            <button
              key={lvl}
              className="btn btn-ghost"
              style={{
                fontSize: 16,
                minHeight: 44,
                padding: "0 18px",
                borderRadius: 10,
                border: levelFilter === lvl ? `2px solid ${LOG_COLORS[lvl]}` : "2px solid transparent",
                color: LOG_COLORS[lvl],
                fontWeight: 700,
                opacity: levelFilter === lvl || !levelFilter ? 1 : 0.4,
              }}
              onClick={() => setLevelFilter(levelFilter === lvl ? null : lvl)}
            >
              {lvl}
            </button>
          ))}

          <button
            className="btn btn-ghost"
            style={{
              fontSize: 16,
              minHeight: 44,
              padding: "0 18px",
              borderRadius: 10,
              marginLeft: "auto",
              color: sortAsc ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.5)",
            }}
            onClick={() => setSortAsc(!sortAsc)}
          >
            {sortAsc ? "↑" : "↓"} Ordenar
          </button>
          <button
            className="btn btn-ghost"
            style={{
              fontSize: 16,
              minHeight: 44,
              padding: "0 18px",
              borderRadius: 10,
            }}
            onClick={handleRefresh}
          >
            ↻ Refrescar
          </button>
        </div>

        {/* Lista de logs */}
        <div
          className="scroll"
          style={{
            flex: 1,
            background: "rgba(0,0,0,.3)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,.08)",
            padding: "16px 20px",
          }}
        >
          {sorted.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                color: "rgba(255,255,255,.3)",
                fontSize: 20,
              }}
            >
              No hay logs para esta fecha
            </div>
          )}
          {sorted.map((entry, i) => (
            <div key={i}>
              <div
                onClick={() => setExpandedIdx(expandedIdx === i ? null : entry.details ? i : null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: expandedIdx === i ? "none" : "1px solid rgba(255,255,255,.04)",
                  fontFamily: "'Courier New', monospace",
                  fontSize: 15,
                  lineHeight: 1.4,
                  cursor: entry.details ? "pointer" : "default",
                }}
              >
                <span style={{ color: "rgba(255,255,255,.3)", minWidth: 70, flexShrink: 0 }}>
                  {formatTime(entry.ts)}
                </span>
                <span
                  style={{
                    color: LOG_COLORS[entry.level],
                    fontWeight: 800,
                    minWidth: 56,
                    flexShrink: 0,
                  }}
                >
                  [{entry.level}]
                </span>
                <span style={{ color: "rgba(255,255,255,.7)", fontWeight: 700, minWidth: 120, flexShrink: 0 }}>
                  {entry.action}
                </span>
                <span style={{ color: "rgba(255,255,255,.9)", flex: 1 }}>
                  {entry.message}
                </span>
                {entry.details && (
                  <span style={{ color: "rgba(255,255,255,.3)", fontSize: 13, flexShrink: 0 }}>
                    {expandedIdx === i ? "▼" : "[+]"}
                  </span>
                )}
              </div>
              {expandedIdx === i && entry.details && (
                <div
                  style={{
                    padding: "8px 0 12px 82px",
                    borderBottom: "1px solid rgba(255,255,255,.04)",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,.55)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {JSON.stringify(entry.details, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
