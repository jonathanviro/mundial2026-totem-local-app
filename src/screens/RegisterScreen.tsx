import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "../store";
import { registrationsApi } from "../api";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { InactivityOverlay } from "../components/InactivityOverlay";
import { useInactivity } from "../hooks/useInactivity";

type FieldId =
  | "factura"
  | "cedula"
  | "nombres"
  | "apellidos"
  | "telefono"
  | "email";
type KbMode = "default" | "numeric" | "email" | "alphanumeric" | "no-at";

const FIELDS: {
  id: FieldId;
  label: string;
  placeholder: string;
  mode: KbMode;
  required: boolean;
}[] = [
  {
    id: "factura",
    label: "Número de Factura",
    placeholder: "Ej: 001000123",
    mode: "numeric",
    required: true,
  },
  {
    id: "cedula",
    label: "Cédula / RUC",
    placeholder: "Número de cédula",
    mode: "numeric",
    required: true,
  },
  {
    id: "nombres",
    label: "Nombres",
    placeholder: "Tu nombre",
    mode: "no-at",
    required: true,
  },
  {
    id: "apellidos",
    label: "Apellidos",
    placeholder: "Tus apellidos",
    mode: "no-at",
    required: true,
  },
  {
    id: "telefono",
    label: "Teléfono",
    placeholder: "0999999999",
    mode: "numeric",
    required: true,
  },
  {
    id: "email",
    label: "Correo electrónico",
    placeholder: "correo@ejemplo.com",
    mode: "email",
    required: true,
  },
];

export function RegisterScreen() {
  const {
    formData,
    setFormField,
    prefillForm,
    facturaStatus,
    setFacturaStatus,
    setScreen,
    resetFlow,
  } = useStore();

  const [activeField, setActiveField] = useState<FieldId | null>(null);
  const [error, setError] = useState("");
  const facturaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cedulaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { countdown, cancelReset } = useInactivity(90000, resetFlow);

  const currentField = FIELDS.find((f) => f.id === activeField);

  const isFormComplete = (): boolean => {
    // Check all required fields are non-empty
    for (const f of FIELDS) {
      if (f.required && !formData[f.id].trim()) {
        return false;
      }
    }
    // If factura has 3+ chars, it must be validated (ok)
    if (formData.factura.trim().length >= 3 && facturaStatus !== "ok")
      return false;
    return true;
  };

  // Validar factura en tiempo real
  useEffect(() => {
    const val = formData.factura.trim();
    if (val.length < 3) {
      setFacturaStatus("idle");
      return;
    }
    setFacturaStatus("checking");
    if (facturaTimer.current) clearTimeout(facturaTimer.current);
    facturaTimer.current = setTimeout(async () => {
      try {
        const res = await registrationsApi.checkFactura(val);
        setFacturaStatus(res.available ? "ok" : "taken");
      } catch {
        setFacturaStatus("idle");
      }
    }, 700);
  }, [formData.factura]);

  // Pre-llenar por cédula
  useEffect(() => {
    const val = formData.cedula.trim();
    if (val.length < 10) return;
    if (cedulaTimer.current) clearTimeout(cedulaTimer.current);
    cedulaTimer.current = setTimeout(async () => {
      try {
        const p = await registrationsApi.getParticipant(val);
        if (p) prefillForm(p);
      } catch {}
    }, 500);
  }, [formData.cedula]);

  const handleContinue = () => {
    setError("");
    setActiveField(null);
    setScreen("predict");
  };

  const handleKbChange = useCallback(
    (val: string) => {
      if (!activeField) return;
      // Nombres y apellidos siempre en mayúsculas
      const upperFields: FieldId[] = ["nombres", "apellidos"];
      const finalVal = upperFields.includes(activeField)
        ? val.toUpperCase()
        : val;
      setFormField(activeField, finalVal);
    },
    [activeField],
  );

  const handleDone = () => {
    const idx = FIELDS.findIndex((f) => f.id === activeField);
    if (idx < FIELDS.length - 1) setActiveField(FIELDS[idx + 1].id);
    else setActiveField(null);
  };

  const getInputClass = (id: FieldId) => {
    let cls = "input-field";
    if (activeField === id) cls += " active";
    if (id === "factura") {
      if (facturaStatus === "ok") cls += " ok";
      if (facturaStatus === "taken") cls += " err";
    }
    return cls;
  };

  const getHint = (id: FieldId) => {
    if (id === "factura") {
      if (facturaStatus === "checking")
        return { text: "Verificando...", cls: "" };
      if (facturaStatus === "ok")
        return { text: "✓ Factura disponible", cls: "ok" };
      if (facturaStatus === "taken")
        return { text: "✗ Factura ya utilizada", cls: "err" };
    }
    return null;
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
      {/* Overlay semitransparente para legibilidad */}
      <div style={{ position: "absolute", inset: 0 }} />

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
        <div style={{ textAlign: "center" }}>
          <div className="screen-step">Paso 1 de 2</div>
          <div className="screen-title">Tus datos</div>
        </div>
      </div>

      {/* Form centrado - fijo, no salta */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 80px",
          overflowY: "auto",
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
          <div
            style={{
              width: "100%",
              maxWidth: 960,
              background: "rgba(255,255,255,.25)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              borderRadius: 24,
              padding: "48px 60px",
              border: "1px solid rgba(255,255,255,.2)",
              boxShadow:
                "0 8px 40px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.08)",
            }}
          >
            {error && (
              <div
                style={{
                  background: "rgba(220,38,38,.15)",
                  border: "1px solid rgba(220,38,38,.35)",
                  borderRadius: 12,
                  padding: "14px 22px",
                  fontSize: 20,
                  color: "#ff8080",
                  marginBottom: 20,
                }}
              >
                ⚠ {error}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "32px 60px",
              }}
            >
              {FIELDS.map((f) => {
                const hint = getHint(f.id);
                return (
                  <div key={f.id} className="input-wrap">
                    <label className="input-label">
                      {f.label}
                      {f.required && <span>*</span>}
                    </label>
                    <input
                      readOnly
                      className={getInputClass(f.id)}
                      style={{ fontSize: 28, minHeight: 80, cursor: "pointer" }}
                      value={formData[f.id]}
                      placeholder={f.placeholder}
                      onPointerDown={() => setActiveField(f.id)}
                    />
                    {hint && (
                      <div className={`input-hint ${hint.cls}`}>{hint.text}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", margin: "48px 0 0" }} />

            <button
              className="btn btn-accent btn-full"
              style={{
                marginTop: 28,
                fontSize: 26,
                minHeight: 88,
                opacity: isFormComplete() ? 1 : 0.55,
                cursor: isFormComplete() ? "pointer" : "not-allowed",
                filter: isFormComplete() ? "none" : "grayscale(0.6)",
              }}
              disabled={!isFormComplete()}
              onClick={handleContinue}
            >
              Continuar
            </button>
          </div>
        </div>

        <div style={{ flexShrink: 0, marginTop: 28 }}>
          <img
            src="/btn-atras.png"
            alt="Volver"
            style={{ height: 120, cursor: "pointer" }}
            onClick={() => {
              setActiveField(null);
              setScreen("splash");
            }}
          />
        </div>
      </div>

      {/* Keyboard - solo visible cuando hay campo activo */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          flexShrink: 0,
          background: activeField ? "rgba(255,255,255,.18)" : "transparent",
          backdropFilter: activeField ? "blur(18px)" : "none",
          WebkitBackdropFilter: activeField ? "blur(18px)" : "none",
          borderTop: activeField ? "1px solid rgba(255,255,255,.12)" : "none",
          visibility: activeField ? "visible" : "hidden",
          pointerEvents: activeField ? "auto" : "none",
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
            {currentField?.label || "Selecciona un campo"}
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
              onClick={() => setActiveField(null)}
            >
              Cerrar
            </button>
            <button
              className="btn btn-primary"
              disabled={!isFormComplete()}
              style={{
                fontSize: 18,
                minHeight: 56,
                padding: "0 28px",
                borderRadius: 12,
                opacity: isFormComplete() ? 1 : 0.4,
                cursor: isFormComplete() ? "pointer" : "not-allowed",
              }}
              onClick={handleContinue}
            >
              Continuar →
            </button>
          </div>
        </div>
        <VirtualKeyboard
          value={activeField ? formData[activeField] || "" : ""}
          onChange={handleKbChange}
          mode={currentField?.mode || "default"}
          onDone={handleDone}
        />
      </div>

      <InactivityOverlay countdown={countdown} onCancel={cancelReset} />
    </div>
  );
}
