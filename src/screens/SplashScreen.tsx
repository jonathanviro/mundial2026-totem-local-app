import { useEffect, useRef } from "react";
import { useStore } from "../store";
import { phaseApi, configApi } from "../api";
import { logger } from "../services/logger";

export function SplashScreen() {
  const { setScreen, setPhaseData, setConfigured, isConfigured } = useStore();
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    configApi
      .get()
      .then((cfg) => {
        if (cfg.totem_code) {
          setConfigured(true, cfg.totem_code);
          logger.info("load_config", "Configuración cargada", { code: cfg.totem_code });
        }
      })
      .catch(() => logger.error("load_config", "Error al cargar configuración"));
    phaseApi
      .getActive()
      .then((data) => {
        if (data.phase) {
          setPhaseData(data.phase, data.matches || [], data.campaign || null);
          logger.info("load_phase", `Fase activa: ${data.phase.name}`, { phase_id: data.phase.id });
        }
      })
      .catch(() => logger.error("load_phase", "Error al cargar fase activa"));
  }, []);

  const handleTap = () => {
    tapCount.current++;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 10) {
      tapCount.current = 0;
      setScreen("config");
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 3000);
  };

  return (
    <div
      onClick={handleTap}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundImage: "url(/fondo_inicio.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Imagen centrada */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isConfigured ? (
          <img
            src="/btn-jugar.png"
            alt="Jugar"
            className="pulse-scale"
            onClick={(e) => {
              e.stopPropagation();
              setScreen("register");
            }}
            style={{
              width: "35%",
              marginTop: "75%",
              cursor: "pointer",
            }}
          />
        ) : (
          <div
            style={{
              background: "rgba(0,0,0,.65)",
              borderRadius: 16,
              padding: "24px 40px",
              textAlign: "center",
              border: "1px solid rgba(220,38,38,.4)",
            }}
          >
            <div
              style={{
                fontSize: 22,
                color: "#ff8080",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              ⚠ Tótem no configurado
            </div>
            <div style={{ fontSize: 18, color: "rgba(255,255,255,.5)" }}>
              Toca 10 veces para configurar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
