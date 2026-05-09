import { useStore } from "../store";
import { Flag } from "../components/Flag";

export function SuccessScreen() {
  const { formData, predictions, matches, champion, resetFlow } = useStore();

  const getMatch = (id: number) => matches.find((m) => m.id === id);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundImage: "url(/fondo_resultado.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,.55)",
        }}
      />

      <div
        className="fade-in"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 40px 24px",
          textAlign: "center",
          gap: 20,
          width: "100%",
          maxWidth: 1300,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 42,
                fontWeight: 900,
                color: "#00e676",
                textShadow: "0 0 30px rgba(0,200,83,.4)",
                lineHeight: 1.1,
              }}
            >
              ¡Registro exitoso!
            </div>
            <div
              style={{
                fontSize: 24,
                color: "rgba(255,255,255,.8)",
                fontWeight: 500,
                marginTop: 4,
              }}
            >
              ¡Mucha suerte, <strong>{formData.nombres}</strong>!
            </div>
          </div>
        </div>

        {/* Resumen predicciones */}
        <div
          style={{
            background: "rgba(255,255,255,.12)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,.18)",
            borderRadius: 20,
            padding: "28px 28px",
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,.45)",
              marginBottom: 14,
              textTransform: "uppercase",
              letterSpacing: ".1em",
              fontWeight: 700,
            }}
          >
            Tus predicciones guardadas ({predictions.length})
          </div>
          <div
            className="scroll"
            style={{
              maxHeight: 520,
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: predictions.length > 4 ? "1fr 1fr" : "1fr",
              gap: "8px 18px",
            }}
          >
            {predictions.map((pred, i) => {
              const m = getMatch(pred.match_id);
              if (!m) return null;
              return (
                <div
                  key={pred.match_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background:
                      i % 2 === 0 ? "rgba(255,255,255,.05)" : "transparent",
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#69f0ae",
                      minWidth: 28,
                      flexShrink: 0,
                      textAlign: "right",
                    }}
                  >
                    {i + 1}
                  </span>
                  <Flag team={m.team_local} size={28} />
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      flex: 1,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.team_local}
                  </span>
                  <div
                    style={{
                      background: "rgba(0,0,0,.35)",
                      border: "1px solid rgba(0,230,118,.35)",
                      borderRadius: 8,
                      padding: "2px 14px",
                      fontSize: 24,
                      fontWeight: 900,
                      color: "#69f0ae",
                      letterSpacing: ".04em",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {pred.goals_local}–{pred.goals_visitor}
                  </div>
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      flex: 1,
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.team_visitor}
                  </span>
                  <Flag team={m.team_visitor} size={28} />
                </div>
              );
            })}
          </div>
          {champion && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginTop: 14,
                paddingTop: 10,
                borderTop: "1px solid rgba(255,215,0,.2)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  color: "rgba(255,215,0,.5)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  fontWeight: 700,
                }}
              >
                Campeón:
              </span>
              <Flag team={champion} size={30} />
              <span style={{ fontSize: 20, fontWeight: 800, color: "#ffd700" }}>
                {champion}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <img
            src="/btn-home.png"
            alt="Inicio"
            style={{ height: 90, cursor: "pointer" }}
            onClick={resetFlow}
          />
        </div>
      </div>
    </div>
  );
}
