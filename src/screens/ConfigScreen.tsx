import { useEffect, useState } from "react";
import { useStore } from "../store";
import { configApi, syncApi } from "../api";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { logger } from "../services/logger";

const ADMIN_PASSWORD = "T123PASSWORD";

export function ConfigScreen() {
  const { setScreen, setConfigured } = useStore();
  const [code, setCode] = useState("");
  const [activeInput, setActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(
    null,
  );
  const [syncResult, setSyncResult] = useState("");
  const [info, setInfo] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    configApi.get().then((d) => {
      if (d.totem_code) setCode(d.totem_code);
    });
    syncApi
      .status()
      .then(setInfo)
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!code.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await configApi.update({ totem_code: code.trim() });
      setConfigured(true, code.trim());
      setStatus({ text: "Código guardado correctamente", ok: true });
      logger.info("save_config", "Código de tótem guardado", {
        code: code.trim(),
      });
    } catch {
      setStatus({ text: "Error al guardar el código", ok: false });
      logger.error("save_config", "Error al guardar código de tótem");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult("Sincronizando...");
    try {
      const res = await syncApi.trigger();
      setSyncResult(
        res.status === "ok"
          ? `Sincronización completada: ${res.message}`
          : res.status === "no_internet"
            ? "Sin conexión al servidor"
            : res.status === "not_configured"
              ? "Configura el código primero"
              : res.message || res.status,
      );
      if (res.status === "ok") {
        logger.info("manual_sync", "Sincronización exitosa", {
          message: res.message,
        });
      } else if (res.status === "no_internet") {
        logger.warn("manual_sync", "Sin conexión al servidor");
      } else {
        logger.warn("manual_sync", res.message || res.status);
      }
      syncApi
        .status()
        .then(setInfo)
        .catch(() => {});
    } catch {
      setSyncResult("Error en la sincronización");
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveWithPassword = () => {
    if (!code.trim()) return;
    setActive(false);
    setShowPassword(true);
    setPasswordValue("");
    setPasswordError(false);
  };

  const handleConfirmPassword = () => {
    if (passwordValue === ADMIN_PASSWORD) {
      setShowPassword(false);
      handleSave();
    } else {
      setPasswordError(true);
      setPasswordValue("");
    }
  };

  const handleBack = () => {
    setActive(false);
    setShowPassword(false);
    setScreen("splash");
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,.65)",
        }}
      />

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
            alt="Salir"
            style={{ height: 64, cursor: "pointer" }}
            onClick={handleBack}
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="screen-step">Configuración</div>
          <div className="screen-title">Administrar Tótem</div>
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
          alignItems: "center",
          padding: "40px 80px",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            maxWidth: 760,
          }}
        >
          {/* Card: Código */}
          <div
            style={{
              width: "100%",
              background: "rgba(255,255,255,.1)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,.15)",
              borderRadius: 20,
              padding: "32px 36px",
              marginBottom: 24,
            }}
          >
            <div className="input-wrap" style={{ marginBottom: 20 }}>
              <label className="input-label">
                Código del Tótem <span>*</span>
              </label>
              <input
                readOnly
                className={`input-field${activeInput ? " active" : ""}`}
                value={code}
                placeholder="Ej: TOTEM-001"
                onPointerDown={() => setActive(true)}
                style={{ fontSize: 28, minHeight: 80, cursor: "pointer" }}
              />
              <div className="input-hint">
                Este código debe coincidir exactamente con el registrado en el
                panel admin.
              </div>
            </div>

            {status && (
              <div
                style={{
                  padding: "14px 20px",
                  borderRadius: 12,
                  fontSize: 20,
                  marginBottom: 20,
                  background: status.ok
                    ? "rgba(0,230,118,.12)"
                    : "rgba(220,38,38,.12)",
                  color: status.ok ? "#00e676" : "#ff6b6b",
                  border: `1px solid ${status.ok ? "rgba(0,230,118,.3)" : "rgba(220,38,38,.3)"}`,
                }}
              >
                {status.ok ? "✓ " : "✗ "}
                {status.text}
              </div>
            )}

            {!activeInput && (
              <button
                className="btn btn-accent btn-full"
                style={{ fontSize: 24, minHeight: 80 }}
                onClick={handleSaveWithPassword}
                disabled={saving || !code.trim()}
              >
                {saving ? "Guardando..." : "Guardar código"}
              </button>
            )}
          </div>

          {/* Card: Sincronización */}
          <div
            style={{
              width: "100%",
              background: "rgba(255,255,255,.1)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,.15)",
              borderRadius: 20,
              padding: "32px 36px",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: "rgba(255,255,255,.5)",
                textTransform: "uppercase",
                letterSpacing: ".1em",
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              Sincronización
            </div>

            <button
              className="btn btn-primary btn-full"
              style={{ fontSize: 24, minHeight: 80 }}
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? <span className="spin">⟳</span> : "🔄"} Sincronizar
              ahora
            </button>

            {syncResult && (
              <div
                style={{
                  marginTop: 16,
                  padding: "14px 20px",
                  borderRadius: 12,
                  fontSize: 20,
                  background: syncResult.startsWith("Sincronización completada")
                    ? "rgba(0,230,118,.1)"
                    : "rgba(255,255,255,.05)",
                  color: syncResult.startsWith("Sincronización completada")
                    ? "#00e676"
                    : "rgba(255,255,255,.65)",
                  border: syncResult.startsWith("Sincronización completada")
                    ? "1px solid rgba(0,230,118,.3)"
                    : "1px solid rgba(255,255,255,.08)",
                }}
              >
                {syncResult}
              </div>
            )}
          </div>

          {/* Card: Logs */}
          {!activeInput && (
            <div
              style={{
                width: "100%",
                background: "rgba(255,255,255,.1)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 20,
                padding: "32px 36px",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  color: "rgba(255,255,255,.5)",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  fontWeight: 700,
                  marginBottom: 20,
                }}
              >
                Registro de actividad
              </div>
              <button
                className="btn btn-secondary btn-full"
                style={{ fontSize: 24, minHeight: 80 }}
                onClick={() => setScreen("logs")}
              >
                📋 Ver Logs
              </button>
            </div>
          )}

          {/* Card: Partidos */}
          {!activeInput && (
            <div
              style={{
                width: "100%",
                background: "rgba(255,255,255,.1)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 20,
                padding: "32px 36px",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  color: "rgba(255,255,255,.5)",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  fontWeight: 700,
                  marginBottom: 20,
                }}
              >
                Partidos de la Fase
              </div>
              <button
                className="btn btn-secondary btn-full"
                style={{ fontSize: 24, minHeight: 80 }}
                onClick={() => setScreen("matches")}
              >
                📋 Ver Partidos
              </button>
            </div>
          )}

          {/* Card: Estado actual */}
          {!activeInput && info && (
            <div
              style={{
                width: "100%",
                background: "rgba(255,255,255,.1)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 20,
                padding: "28px 36px",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  color: "rgba(255,255,255,.5)",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  fontWeight: 700,
                  marginBottom: 20,
                }}
              >
                Estado actual
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  ["Código", info.totem_code || "—"],
                  ["Versión datos", `v${info.version_data}`],
                  ["Registros locales", String(info.total_registrations)],
                  ["Pendientes sync", String(info.pending_sync)],
                  ["Fase activa", info.active_phase?.name || "—"],
                  [
                    "Partidos cargados",
                    String(info.active_phase?.matches_count ?? "—"),
                  ],
                ].map(([k, v]) => (
                  <div
                    key={k as string}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 0",
                      borderBottom: "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <span
                      style={{ color: "rgba(255,255,255,.45)", fontSize: 18 }}
                    >
                      {k}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 20,
                        color:
                          k === "Pendientes sync" && Number(v) > 0
                            ? "#69f0ae"
                            : "#ffffff",
                      }}
                    >
                      {v as string}
                      {k === "Pendientes sync" && Number(v) > 0 && " ⚠"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password keyboard */}
      {showPassword && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            background: "rgba(0,0,0,.85)",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 80px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div
                style={{
                  fontSize: 20,
                  color: "rgba(255,255,255,.5)",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Contraseña requerida
              </div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,.35)" }}>
                Ingresa la contraseña de administrador para guardar el código
              </div>
            </div>
            <input
              readOnly
              value={passwordValue ? "•".repeat(passwordValue.length) : ""}
              placeholder="Contraseña"
              onPointerDown={() => {}}
              style={{
                width: "100%",
                maxWidth: 480,
                minHeight: 80,
                fontSize: 36,
                textAlign: "center",
                background: passwordError
                  ? "rgba(220,38,38,.12)"
                  : "rgba(255,255,255,.08)",
                border: `2px solid ${passwordError ? "rgba(220,38,38,.5)" : "rgba(255,255,255,.15)"}`,
                borderRadius: 16,
                color: "#ffffff",
                outline: "none",
                letterSpacing: "1em",
                fontFamily: "monospace",
              }}
            />
            {passwordError && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: 18,
                  background: "rgba(220,38,38,.12)",
                  color: "#ff6b6b",
                  border: "1px solid rgba(220,38,38,.3)",
                }}
              >
                ✗ Contraseña incorrecta
              </div>
            )}
          </div>
          <div
            style={{
              flexShrink: 0,
              background: "rgba(255,255,255,.18)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              borderTop: "1px solid rgba(255,255,255,.12)",
            }}
          >
            <div className="keyboard-bar">
              <span
                style={{
                  fontSize: 20,
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  fontWeight: 700,
                }}
              >
                Contraseña de administrador
              </span>
              <div style={{ display: "flex", gap: 16 }}>
                <button
                  className="btn btn-ghost"
                  style={{
                    fontSize: 18,
                    minHeight: 56,
                    padding: "0 24px",
                    borderRadius: 12,
                  }}
                  onClick={() => {
                    setShowPassword(false);
                    setPasswordError(false);
                    setPasswordValue("");
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  style={{
                    fontSize: 18,
                    minHeight: 56,
                    padding: "0 28px",
                    borderRadius: 12,
                  }}
                  onClick={handleConfirmPassword}
                >
                  Confirmar →
                </button>
              </div>
            </div>
            <VirtualKeyboard
              value={passwordValue}
              onChange={setPasswordValue}
              mode="alphanumeric"
              onDone={handleConfirmPassword}
            />
          </div>
        </div>
      )}

      {/* Keyboard */}
      {activeInput && (
        <div
          style={{
            position: "relative",
            zIndex: 20,
            flexShrink: 0,
            background: "rgba(255,255,255,.18)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            borderTop: "1px solid rgba(255,255,255,.12)",
          }}
        >
          <div className="keyboard-bar">
            <span
              style={{
                fontSize: 20,
                color: "#ffffff",
                textTransform: "uppercase",
                letterSpacing: ".1em",
                fontWeight: 700,
              }}
            >
              Código del Tótem
            </span>
            <div style={{ display: "flex", gap: 16 }}>
              <button
                className="btn btn-ghost"
                style={{
                  fontSize: 18,
                  minHeight: 56,
                  padding: "0 24px",
                  borderRadius: 12,
                }}
                onClick={() => setActive(false)}
              >
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                style={{
                  fontSize: 18,
                  minHeight: 56,
                  padding: "0 28px",
                  borderRadius: 12,
                }}
                onClick={handleSaveWithPassword}
              >
                Guardar →
              </button>
            </div>
          </div>
          <VirtualKeyboard
            value={code}
            onChange={setCode}
            mode="alphanumeric"
            onDone={handleSaveWithPassword}
          />
        </div>
      )}
    </div>
  );
}
