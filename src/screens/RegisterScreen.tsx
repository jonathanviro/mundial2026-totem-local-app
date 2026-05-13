import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "../store";
import { registrationsApi } from "../api";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { InactivityOverlay } from "../components/InactivityOverlay";
import { useInactivity } from "../hooks/useInactivity";
import { logger } from "../services/logger";

type FieldId =
  | "factura"
  | "cedula"
  | "nombres"
  | "apellidos"
  | "telefono"
  | "email";
type KbMode = "default" | "numeric" | "email" | "alphanumeric" | "no-at";

const MAX_LENGTH: Record<FieldId, number> = {
  factura: 15,
  cedula: 15,
  nombres: 30,
  apellidos: 30,
  telefono: 10,
  email: 50,
};

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

const validateField = (id: FieldId, value: string): string | null => {
  const v = value.trim();
  if (!v) return "Campo obligatorio";
  switch (id) {
    case "factura":
      if (v.length < 4) return "Debe tener al menos 4 caracteres";
      if (v.length > MAX_LENGTH.factura) return "Máximo 15 caracteres";
      return null;
    case "cedula":
      if (!/^\d+$/.test(v)) return "Solo se permiten dígitos";
      if (v.length < 10) return "Debe tener al menos 10 dígitos";
      if (v.length > MAX_LENGTH.cedula) return "Máximo 15 dígitos";
      return null;
    case "nombres":
      if (v.length < 3) return "Debe tener al menos 3 caracteres";
      if (v.length > MAX_LENGTH.nombres) return "Máximo 30 caracteres";
      return null;
    case "apellidos":
      if (v.length < 3) return "Debe tener al menos 3 caracteres";
      if (v.length > MAX_LENGTH.apellidos) return "Máximo 30 caracteres";
      return null;
    case "telefono":
      if (!/^\d+$/.test(v)) return "Solo se permiten dígitos";
      if (v.length > MAX_LENGTH.telefono) return "Máximo 10 dígitos";
      if (v.length !== 10) return "Debe tener exactamente 10 dígitos";
      return null;
    case "email":
      if (v.length > MAX_LENGTH.email) return "Máximo 50 caracteres";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        return "Correo electrónico inválido";
      return null;
    case "cedula":
      if (!/^\d+$/.test(v)) return "Solo se permiten dígitos";
      if (v.length < 10) return "Debe tener al menos 10 dígitos";
      if (v.length > 15) return "Debe tener máximo 15 dígitos";
      return null;
    case "nombres":
      if (v.length < 3) return "Debe tener al menos 3 caracteres";
      return null;
    case "apellidos":
      if (v.length < 3) return "Debe tener al menos 3 caracteres";
      return null;
    case "telefono":
      if (!/^\d+$/.test(v)) return "Solo se permiten dígitos";
      if (v.length !== 10) return "Debe tener exactamente 10 dígitos";
      return null;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        return "Correo electrónico inválido";
      return null;
    default:
      return null;
  }
};

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
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldId, string>>
  >({});
  const facturaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cedulaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { countdown, cancelReset } = useInactivity(90000, resetFlow);

  const currentField = FIELDS.find((f) => f.id === activeField);

  const isFormComplete = (): boolean => {
    for (const f of FIELDS) {
      if (f.required && !formData[f.id].trim()) {
        return false;
      }
    }
    if (formData.factura.trim().length >= 4 && facturaStatus !== "ok")
      return false;
    return true;
  };

  // Validar factura en tiempo real
  useEffect(() => {
    const val = formData.factura.trim();
    if (val.length < 4) {
      setFacturaStatus("idle");
      return;
    }
    setFacturaStatus("checking");
    if (facturaTimer.current) clearTimeout(facturaTimer.current);
    facturaTimer.current = setTimeout(async () => {
      try {
        const res = await registrationsApi.checkFactura(val);
        setFacturaStatus(res.available ? "ok" : "taken");
        if (res.available) {
          logger.info("check_factura", "Factura disponible", { factura: val });
        } else {
          logger.warn("check_factura", "Factura ya utilizada", { factura: val });
        }
      } catch {
        setFacturaStatus("idle");
        logger.error("check_factura", "Error al verificar factura", { factura: val });
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
        if (p) {
          prefillForm(p);
          logger.info("get_participant", "Participante encontrado por cédula", { cedula: val });
        }
      } catch {
        logger.warn("get_participant", "Participante no encontrado por cédula", { cedula: val });
      }
    }, 500);
  }, [formData.cedula]);

  const handleContinue = () => {
    const errors: Partial<Record<FieldId, string>> = {};
    let hasError = false;
    for (const f of FIELDS) {
      const err = validateField(f.id, formData[f.id]);
      if (err) {
        errors[f.id] = err;
        hasError = true;
      }
    }
    if (formData.factura.trim().length >= 4) {
      if (facturaStatus === "checking") {
        errors.factura = "Esperando verificación de factura...";
        hasError = true;
      } else if (facturaStatus !== "ok") {
        errors.factura = "Factura no disponible";
        hasError = true;
      }
    }
    setFieldErrors(errors);
    if (hasError) return;
    setError("");
    setActiveField(null);
    logger.info("register_form_complete", "Formulario completado, avanzando a predicciones");
    setScreen("predict");
  };

  const handleKbChange = useCallback(
    (val: string) => {
      if (!activeField) return;
      const upperFields: FieldId[] = ["nombres", "apellidos"];
      let finalVal = upperFields.includes(activeField)
        ? val.toUpperCase()
        : val;
      finalVal = finalVal.slice(0, MAX_LENGTH[activeField]);
      setFormField(activeField, finalVal);
      if (finalVal.trim()) {
        setFieldErrors((prev) => ({
          ...prev,
          [activeField]: validateField(activeField, finalVal),
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, [activeField]: undefined }));
      }
    },
    [activeField],
  );

  const handleDone = () => {
    if (!activeField) return;
    const error = validateField(activeField, formData[activeField]);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [activeField]: error }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, [activeField]: undefined }));
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
    if (fieldErrors[id]) cls += " err";
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
                      <div className={`input-hint ${hint.cls}`}>
                        {hint.text}
                      </div>
                    )}
                    {fieldErrors[f.id] && (
                      <div className="input-hint err">{fieldErrors[f.id]}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,.08)",
                margin: "48px 0 0",
              }}
            />

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
              resetFlow();
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
