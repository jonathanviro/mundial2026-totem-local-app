import { useEffect, useState } from "react";
import { useStore } from "../store";
import { phaseApi } from "../api";
import { getTeamFlag } from "../data/teams";

export function MatchesScreen() {
  const { setScreen } = useStore();
  const [matches, setMatches] = useState<any[]>([]);
  const [phaseName, setPhaseName] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterTeam, setFilterTeam] = useState("");

  useEffect(() => {
    phaseApi
      .getActive()
      .then((data) => {
        setMatches(data.matches || []);
        setPhaseName(data.phase?.name || "Fase activa");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const uniqueDates = [...new Set(matches.map((m: any) => m.date).filter(Boolean))].sort();
  const uniqueTeams = [...new Set(matches.flatMap((m: any) => [m.team_local, m.team_visitor]).filter(Boolean))].sort();

  const filtered = matches.filter((m: any) => {
    if (filterDate && m.date !== filterDate) return false;
    if (filterTeam && m.team_local !== filterTeam && m.team_visitor !== filterTeam) return false;
    return true;
  });

  const byDate: Record<string, any[]> = {};
  filtered.forEach((m: any) => {
    const d = m.date || "Sin fecha";
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(m);
  });
  const sortedDates = Object.keys(byDate).sort((a, b) => a.localeCompare(b));

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
          <img
            src="/btn-atras.png"
            alt="Cerrar"
            style={{ height: 64, cursor: "pointer" }}
            onClick={() => setScreen("config")}
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="screen-step">Partidos</div>
          <div className="screen-title">{phaseName}</div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
          padding: "20px 60px",
          background: "rgba(255,255,255,.05)",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          gap: 20,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.4)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>
            Filtrar por fecha
          </div>
            <select
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setFilterTeam(""); }}
              style={{
                width: "100%",
                minHeight: 56,
                fontSize: 20,
                borderRadius: 12,
                background: "rgba(255,255,255,.1)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.15)",
                padding: "0 16px",
                outline: "none",
              }}
            >
              <option value="" style={{ color: "#1a2332", background: "#fff" }}>Todas las fechas</option>
              {uniqueDates.map((d) => (
                <option key={d as string} value={d as string} style={{ color: "#1a2332", background: "#fff" }}>{d as string}</option>
              ))}
            </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.4)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>
            Filtrar por país
          </div>
            <select
              value={filterTeam}
              onChange={(e) => { setFilterTeam(e.target.value); setFilterDate(""); }}
              style={{
                width: "100%",
                minHeight: 56,
                fontSize: 20,
                borderRadius: 12,
                background: "rgba(255,255,255,.1)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.15)",
                padding: "0 16px",
                outline: "none",
              }}
            >
              <option value="" style={{ color: "#1a2332", background: "#fff" }}>Todos los países</option>
              {uniqueTeams.map((t) => (
                <option key={t as string} value={t as string} style={{ color: "#1a2332", background: "#fff" }}>{t as string}</option>
              ))}
            </select>
        </div>
      </div>

      {/* List */}
      <div
        className="scroll"
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          padding: "24px 60px",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,.4)", fontSize: 22 }}>
            Cargando...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,.4)", fontSize: 22 }}>
            {matches.length === 0 ? "No hay partidos cargados" : "Sin resultados"}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,.35)", marginBottom: 16 }}>
              {filtered.length} partido{filtered.length !== 1 ? "s" : ""}
              {filterDate && ` — ${filterDate}`}
              {filterTeam && ` — ${filterTeam}`}
            </div>
            {sortedDates.map((date) => (
              <div key={date} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#C8952A",
                    marginBottom: 10,
                    borderBottom: "1px solid rgba(255,255,255,.08)",
                    paddingBottom: 8,
                  }}
                >
                  📅 {date === "Sin fecha" ? "Sin fecha" : date}
                </div>
                {byDate[date].map((m: any) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      marginBottom: 6,
                      borderRadius: 12,
                      background: m.finished ? "rgba(0,230,118,.06)" : "rgba(255,255,255,.04)",
                      border: `1px solid ${m.finished ? "rgba(0,230,118,.15)" : "rgba(255,255,255,.06)"}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                      <span style={{ fontSize: 28 }}>{getTeamFlag(m.team_local) || "🏳️"}</span>
                      <span style={{ fontSize: 18, fontWeight: 600, minWidth: 100, textAlign: "right" }}>{m.team_local}</span>
                    </div>
                    <div style={{ textAlign: "center", minWidth: 80 }}>
                      {m.finished ? (
                        <span style={{ fontSize: 20, fontWeight: 700, color: "#00e676" }}>
                          {m.goals_local}–{m.goals_visitor}
                        </span>
                      ) : (
                        <span style={{ fontSize: 14, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                          vs
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                      <span style={{ fontSize: 18, fontWeight: 600, minWidth: 100 }}>{m.team_visitor}</span>
                      <span style={{ fontSize: 28 }}>{getTeamFlag(m.team_visitor) || "🏳️"}</span>
                    </div>
                    <div style={{ marginLeft: 16, flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          padding: "4px 12px",
                          borderRadius: 20,
                          background: m.finished ? "rgba(0,230,118,.15)" : "rgba(255,255,255,.08)",
                          color: m.finished ? "#00e676" : "rgba(255,255,255,.4)",
                        }}
                      >
                        {m.finished ? "Finalizado" : "Pendiente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
