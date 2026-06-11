import { useState, useMemo } from "react";
import { useStore } from "../store";
import { InactivityOverlay } from "../components/InactivityOverlay";
import { useInactivity } from "../hooks/useInactivity";
import { getTeamFlag } from "../data/teams";
import { Flag } from "../components/Flag";
import { logger } from "../services/logger";
import type { Match, Team } from "../types";

// Construye equipos únicos desde los partidos
function buildTeams(matches: Match[]): Team[] {
  const map = new Map<string, Team>();
  matches.forEach((m) => {
    if (m.team_local && !map.has(m.team_local)) {
      map.set(m.team_local, {
        name: m.team_local,
        flag: getTeamFlag(m.team_local),
        match_ids: [],
      });
    }
    if (m.team_local) map.get(m.team_local)!.match_ids.push(m.id);

    if (m.team_visitor && !map.has(m.team_visitor)) {
      map.set(m.team_visitor, {
        name: m.team_visitor,
        flag: getTeamFlag(m.team_visitor),
        match_ids: [],
      });
    }
    if (m.team_visitor) map.get(m.team_visitor)!.match_ids.push(m.id);
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Stepper +/-
function Stepper({
  value,
  onChange,
  compact,
  medium,
  large,
}: {
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
  medium?: boolean;
  large?: boolean;
}) {
  const l = large;
  const m = medium;
  const s = compact;
  return (
    <div className="stepper">
      <button
        className={l ? "stepper-btn stepper-btn-lg" : m ? "stepper-btn stepper-btn-md" : s ? "stepper-btn stepper-btn-sm" : "stepper-btn"}
        onPointerDown={(e) => {
          e.stopPropagation();
          onChange(Math.max(0, value - 1));
        }}
      >
        −
      </button>
      <div className={l ? "stepper-val stepper-val-lg" : m ? "stepper-val stepper-val-md" : s ? "stepper-val stepper-val-sm" : "stepper-val"}>{value}</div>
      <button
        className={l ? "stepper-btn stepper-btn-lg" : m ? "stepper-btn stepper-btn-md" : s ? "stepper-btn stepper-btn-sm" : "stepper-btn"}
        onPointerDown={(e) => {
          e.stopPropagation();
          onChange(value + 1);
        }}
      >
        +
      </button>
    </div>
  );
}

// Tarjeta de partido
function MatchCard({
  match,
  prediction,
  onAdd,
  onRemove,
  onUpdate,
  canAdd,
  compact,
  medium,
  large,
}: {
  match: Match;
  prediction: any;
  onAdd: () => void;
  onRemove: () => void;
  onUpdate: (field: "goals_local" | "goals_visitor", v: number) => void;
  canAdd: boolean;
  compact?: boolean;
  medium?: boolean;
  large?: boolean;
}) {
  const selected = !!prediction;
  const l = large;
  const m = medium;
  const s = compact;
  return (
    <div
      style={{
        background: selected ? "rgba(0,230,118,.25)" : "rgba(255,255,255,.22)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${selected ? "rgba(0,230,118,.45)" : "rgba(255,255,255,.18)"}`,
        borderRadius: l ? 22 : m ? 14 : s ? 8 : 20,
        padding: l ? "38px 52px" : m ? "24px 32px" : s ? "10px 12px" : "36px 48px",
        boxShadow: selected
          ? "0 8px 40px rgba(0,230,118,.12), inset 0 1px 0 rgba(255,255,255,.06)"
          : "0 8px 40px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.06)",
        transition: "all .25s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: l ? 25 : m ? 16 : s ? 7 : 24 }}>
        {/* Local */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <Flag team={match.team_local} size={l ? 77 : m ? 48 : s ? 22 : 72} />
          <div
            style={{
              fontSize: l ? 22 : m ? 14 : s ? 8 : 20,
              fontWeight: 700,
              marginTop: l ? 11 : m ? 6 : s ? 3 : 10,
              lineHeight: 1.2,
              textShadow: "0 1px 6px rgba(0,0,0,.5)",
            }}
          >
            {match.team_local}
          </div>
        </div>

        {/* Centro */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: l ? 14 : m ? 10 : s ? 5 : 14,
            flex: 1.2,
          }}
        >
          {selected ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: l ? 18 : m ? 10 : s ? 5 : 16 }}>
                <Stepper
                  compact={s}
                  medium={m}
                  large={l}
                  value={prediction.goals_local}
                  onChange={(v) => onUpdate("goals_local", v)}
                />
                <span
                  style={{
                    fontSize: l ? 34 : m ? 22 : s ? 12 : 32,
                    color: "rgba(255,255,255,.4)",
                    fontWeight: 700,
                  }}
                >
                  —
                </span>
                <Stepper
                  compact={s}
                  medium={m}
                  large={l}
                  value={prediction.goals_visitor}
                  onChange={(v) => onUpdate("goals_visitor", v)}
                />
              </div>
              <button
                className="btn btn-ghost"
                style={{
                  fontSize: l ? 22 : m ? 14 : s ? 8 : 20,
                  color: "#ff8080",
                  minHeight: l ? 68 : m ? 44 : s ? 22 : 64,
                  padding: l ? "0 34px" : m ? "0 22px" : s ? "0 10px" : "0 32px",
                  borderRadius: l ? 34 : m ? 22 : s ? 11 : 32,
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                Quitar prediccion
              </button>
            </>
          ) : (
            <button
              className="btn btn-accent"
              style={{
                fontSize: l ? 23 : m ? 16 : s ? 9 : 22,
                fontWeight: 700,
                minHeight: l ? 68 : m ? 44 : s ? 24 : 64,
                padding: l ? "0 43px" : m ? "0 28px" : s ? "0 14px" : "0 40px",
                borderRadius: l ? 34 : m ? 22 : s ? 12 : 32,
                opacity: canAdd ? 1 : 0.35,
              }}
              disabled={!canAdd}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (canAdd) onAdd();
              }}
            >
              + Predecir
            </button>
          )}
        </div>

        {/* Visitante */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <Flag team={match.team_visitor} size={l ? 77 : m ? 48 : s ? 22 : 72} />
          <div
            style={{
              fontSize: l ? 22 : m ? 14 : s ? 8 : 20,
              fontWeight: 700,
              marginTop: l ? 11 : m ? 6 : s ? 3 : 10,
              lineHeight: 1.2,
              textShadow: "0 1px 6px rgba(0,0,0,.5)",
            }}
          >
            {match.team_visitor}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PredictScreen() {
  const {
    matches,
    phase,
    predictions,
    addPrediction,
    removePrediction,
    updatePrediction,
    champion,
    setChampion,
    setScreen,
    resetFlow,
  } = useStore();

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const { countdown, cancelReset } = useInactivity(90000, resetFlow);

  const required = phase?.predictions_required || 3;
  const done = predictions.length;

  // Filtrar partidos: ocultar los del día de hoy y pasados
  const todayStr = new Date().toISOString().split("T")[0];
  const availableMatches = useMemo(() => {
    return matches.filter(m => !m.date || m.date > todayStr);
  }, [matches, todayStr]);

  const teams = useMemo(() => buildTeams(availableMatches), [availableMatches]);
  const phaseNum = Number(phase?.number);
  const isPhase2 = phaseNum === 2;
  const isMediumPhase = phaseNum >= 2 && phaseNum <= 3;
  const isLargePhase = phaseNum >= 4;

  // Para fases > 1 no se usa grilla de banderas, se muestran todos los partidos
  const showTeamGrid = !selectedTeam && phase?.number === 1;

  const filteredMatches = useMemo(() => {
    if (!selectedTeam) return availableMatches;
    return availableMatches.filter(
      (m) => m.team_local === selectedTeam || m.team_visitor === selectedTeam,
    );
  }, [availableMatches, selectedTeam]);

  const handleAdd = (match: Match) => {
    if (done >= required) return;
    logger.info("add_prediction", `Predicción agregada: ${match.team_local} vs ${match.team_visitor}`, { match_id: match.id });
    addPrediction({
      match_id: match.id,
      goals_local: 0,
      goals_visitor: 0,
      match,
    });
  };

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
      <div style={{ position: "absolute", inset: 0 }} />

      {/* Header */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
          padding: "32px 60px 24px",
          background: "rgba(0,0,0,.35)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div className="screen-step">Paso 2 de 2</div>
            <div className="screen-title">
              {showTeamGrid ? "Elige un equipo" : selectedTeam || phase?.name}
            </div>
          </div>
          <div style={{ position: "absolute", right: 60, textAlign: "right" }}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,.4)" }}>
              Predicciones
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: done >= required ? "#00e676" : "#69f0ae",
              }}
            >
              {done} / {required}
            </div>
          </div>
        </div>
        {/* Progress */}
        <div className="progress-bar">
          <div
            className={`progress-fill ${done >= required ? "green" : "accent"}`}
            style={{ width: `${Math.min((done / required) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <div
        className="scroll"
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "28px 60px",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* GRILLA DE BANDERAS (fase grupos) */}
          {showTeamGrid && (
            <div style={{ width: "100%", maxWidth: 1200 }}>
              <div style={{ marginBottom: 32 }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#ffffff",
                    textAlign: "center",
                    marginBottom: 10,
                    textShadow: "0 2px 12px rgba(0,0,0,.5)",
                  }}
                >
                  Toca un equipo para ver sus partidos
                </div>
                <div
                  style={{
                    fontSize: 20,
                    color: "rgba(255,255,255,.55)",
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  Selecciona {required - done} predicción
                  {required - done !== 1 ? "es" : ""} más para continuar
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  columnGap: 16,
                  rowGap: 24,
                  justifyItems: "center",
                }}
              >
                {teams.map((team) => (
                  <button
                    key={team.name}
                    onPointerDown={() => setSelectedTeam(team.name)}
                    className="team-card"
                    style={{
                      width: "100%",
                      minHeight: 110,
                      background: "rgba(255,255,255,.28)",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      borderRadius: 16,
                      padding: "16px 10px",
                      border: "1px solid rgba(255,255,255,.3)",
                      boxShadow:
                        "0 8px 32px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.08)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      transition: "all .25s",
                    }}
                  >
                    <Flag team={team.name} size={44} />
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        textAlign: "center",
                        color: "#ffffff",
                        lineHeight: 1.2,
                        textShadow: "0 1px 8px rgba(0,0,0,.5)",
                      }}
                    >
                      {team.name}
                    </span>
                  </button>
                ))}
              </div>

              {predictions.length > 0 && (
                <>
                  <div
                    style={{
                      fontSize: 22,
                      color: "rgba(255,255,255)",
                      textTransform: "uppercase",
                      letterSpacing: ".12em",
                      fontWeight: 800,
                      marginTop: 110,
                      marginBottom: 20,
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    Mis predicciones
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 16,
                      justifyContent: "center",
                    }}
                  >
                    {predictions.map((p) => (
                      <div
                        key={p.match_id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 12,
                          background: "rgba(255,255,255,.18)",
                          backdropFilter: "blur(12px)",
                          WebkitBackdropFilter: "blur(12px)",
                          borderRadius: 14,
                          padding: "16px 24px",
                          border: "1px solid rgba(255,255,255,.15)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                          }}
                        >
                          <Flag team={p.match.team_local} size={28} />
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.match.team_local}
                          </span>
                          <span
                            style={{
                              fontSize: 20,
                              fontWeight: 900,
                              color: "#00e676",
                            }}
                          >
                            {p.goals_local} - {p.goals_visitor}
                          </span>
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.match.team_visitor}
                          </span>
                          <Flag team={p.match.team_visitor} size={28} />
                        </div>
                        <button
                          className="btn btn-ghost"
                          style={{
                            fontSize: 18,
                            color: "#ff8080",
                            minHeight: 44,
                            padding: "0 24px",
                            borderRadius: 22,
                          }}
                          onClick={() => removePrediction(p.match_id)}
                        >
                          Quitar prediccion
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* PARTIDOS del equipo seleccionado (o todos para fases > 1) */}
          {!showTeamGrid && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 40,
                width: "100%",
                maxWidth: isPhase2 ? 1200 : isLargePhase ? 1200 : 900,
              }}
            >
              {filteredMatches.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 60,
                    color: "rgba(255,255,255,.4)",
                    fontSize: 22,
                  }}
                >
                  No hay partidos disponibles
                </div>
              )}
                  <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isPhase2 ? "1fr 1fr" : "1fr",
                    gap: isPhase2 ? 12 : isLargePhase ? 31 : isMediumPhase ? 16 : 28,
                }}
              >
                {filteredMatches.map((m) => {
                  const pred = predictions.find((p) => p.match_id === m.id);
                  return (
                    <MatchCard
                      key={m.id}
                      match={m}
                      prediction={pred}
                      canAdd={done < required}
                      onAdd={() => handleAdd(m)}
                      onRemove={() => removePrediction(m.id)}
                      onUpdate={(field, v) => updatePrediction(m.id, field, v)}
                      medium={isMediumPhase}
                      large={isLargePhase}
                    />
                  );
                })}
              </div>
              {selectedTeam && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 12,
                  }}
                >
                  <img
                    src="/btn-atras.png"
                    alt="Volver"
                    style={{ height: 120, cursor: "pointer" }}
                    onClick={() => setSelectedTeam(null)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Champion section */}
          {done >= required && (
            <div style={{ width: "100%", maxWidth: 1200, marginTop: 32 }}>
              <div
                style={{
                  fontSize: 22,
                  color: "rgba(255,215,0)",
                  textTransform: "uppercase",
                  letterSpacing: ".12em",
                  fontWeight: 800,
                  marginBottom: 18,
                  textAlign: "center",
                }}
              >
                Mi campeón del Mundo
              </div>
              <div
                onClick={() => setShowChampionModal(true)}
                onPointerEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,215,0,.12)";
                  e.currentTarget.style.borderColor = "rgba(255,215,0,.45)";
                }}
                onPointerLeave={(e) => {
                  e.currentTarget.style.background = champion
                    ? "rgba(255,215,0,.08)"
                    : "rgba(255,215,0,.04)";
                  e.currentTarget.style.borderColor = champion
                    ? "rgba(255,215,0,.4)"
                    : "rgba(255,215,0,.2)";
                }}
                style={{
                  background: champion
                    ? "rgba(255,215,0,.08)"
                    : "rgba(255,215,0,.04)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: champion
                    ? "1px solid rgba(255,215,0,.4)"
                    : "1px dashed rgba(255,215,0,.2)",
                  borderRadius: 20,
                  padding: "24px 36px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all .25s",
                }}
              >
                {champion ? (
                  <>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 14 }}
                    >
                      <Flag team={champion} size={48} />
                      <span
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: "#ffd700",
                        }}
                      >
                        {champion}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, color: "rgba(255,215,0,.45)" }}>
                      Toca para cambiar
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#ffd700",
                        textShadow: "0 0 20px rgba(255,215,0,.3)",
                      }}
                    >
                      Campeón del mundo
                    </div>
                    <div style={{ fontSize: 18, color: "rgba(255,215,0,.5)" }}>
                      Toca para elegir tu campeón
                    </div>
                  </>
                )}
              </div>

              {showChampionModal && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,.75)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                  onClick={() => setShowChampionModal(false)}
                >
                  <div
                    style={{
                      background: "rgba(30,30,50,.9)",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      borderRadius: 24,
                      padding: "36px 32px",
                      maxWidth: 900,
                      width: "90%",
                      border: "1px solid rgba(255,255,255,.15)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 700,
                        color: "#ffffff",
                        textAlign: "center",
                        marginBottom: 24,
                        textShadow: "0 2px 8px rgba(0,0,0,.5)",
                      }}
                    >
                      Selecciona tu campeón
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(6, 1fr)",
                        gap: 10,
                        justifyItems: "center",
                      }}
                    >
                      {teams.map((team) => (
                        <button
                          key={team.name}
                          onClick={() => {
                            setChampion(team.name);
                            setShowChampionModal(false);
                          }}
                          style={{
                            background: "rgba(255,255,255,.1)",
                            borderRadius: 14,
                            padding: "10px 6px",
                            cursor: "pointer",
                            border: "1px solid rgba(255,255,255,.12)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 6,
                            width: "100%",
                            transition: "all .2s",
                          }}
                          onPointerEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(255,255,255,.22)";
                            e.currentTarget.style.borderColor =
                              "rgba(0,230,118,.3)";
                          }}
                          onPointerLeave={(e) => {
                            e.currentTarget.style.background =
                              "rgba(255,255,255,.1)";
                            e.currentTarget.style.borderColor =
                              "rgba(255,255,255,.12)";
                          }}
                        >
                          <Flag team={team.name} size={44} />
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#ffffff",
                              textAlign: "center",
                              lineHeight: 1.15,
                            }}
                          >
                            {team.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: 20,
                      }}
                    >
                      <button
                        className="btn btn-ghost"
                        style={{
                          fontSize: 20,
                          color: "#ff8080",
                          minHeight: 52,
                          padding: "0 36px",
                          borderRadius: 26,
                        }}
                        onClick={() => setShowChampionModal(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
          padding: "20px 60px",
          background: "rgba(0,0,0,.35)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,.12)",
        }}
      >
        <button
          className="btn btn-accent btn-full btn-lg"
          style={{
            fontSize: 26,
            opacity: done >= required && !!champion ? 1 : 0.4,
            cursor: done >= required && !!champion ? "pointer" : "not-allowed",
          }}
          disabled={done < required || !champion}
          onClick={() => setScreen("confirm")}
        >
          Ver resumen
        </button>
      </div>

      <InactivityOverlay countdown={countdown} onCancel={cancelReset} />
    </div>
  );
}
