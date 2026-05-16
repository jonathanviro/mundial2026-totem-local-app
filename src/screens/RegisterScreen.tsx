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
    required: false,
  },
  {
    id: "telefono",
    label: "Teléfono",
    placeholder: "0999999999",
    mode: "numeric",
    required: false,
  },
  {
    id: "email",
    label: "Correo electrónico",
    placeholder: "correo@ejemplo.com",
    mode: "email",
    required: false,
  },
];

const HIDDEN_FIELDS: FieldId[] = ["apellidos", "telefono", "email"];

const validateField = (id: FieldId, value: string): string | null => {
  if (HIDDEN_FIELDS.includes(id)) return null;
  const v = value.trim();
  if (!v) return "Campo obligatorio";
  switch (id) {
    case "factura":
      return null;
    case "cedula":
      if (!/^\d+$/.test(v)) return "Solo se permiten dígitos";
      if (v.length < 10) return "Debe tener al menos 10 dígitos";
      if (v.length > 13) return "Máximo 13 dígitos";
      return null;
    case "nombres":
      if (v.length < 3) return "Debe tener al menos 3 caracteres";
      if (v.length > MAX_LENGTH.nombres) return "Máximo 30 caracteres";
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

  const { countdown, cancelReset } = useInactivity(90000, resetFlow);

  const [facturaDigits, setFacturaDigits] = useState<string[]>(() => {
    const digits = formData.factura.replace(/-/g, "");
    if (digits.length === 15) return [...digits];
    return Array(15).fill("0");
  });
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      setFormField("factura", "000-000-000000000");
    }
  }, []);

  const [facturaFocus, setFacturaFocus] = useState<number | null>(null);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  const [facturaDirty, setFacturaDirty] = useState(false);

  const facturaRef = useRef<HTMLDivElement>(null);
  const cedulaRef = useRef<HTMLDivElement>(null);
  const nombresRef = useRef<HTMLDivElement>(null);
  const cedulaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentField = FIELDS.find((f) => f.id === activeField);

  const isFormComplete = (): boolean => {
    for (const f of FIELDS) {
      if (f.required && !formData[f.id].trim()) {
        return false;
      }
    }
    if (!/^\d{3}-\d{3}-\d{9}$/.test(formData.factura.trim())) return false;
    if (formData.factura.trim().length >= 4 && facturaStatus === "taken")
      return false;
    return true;
  };

  // Validar factura en tiempo real
  useEffect(() => {
    if (!facturaDirty) return;
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
          logger.warn("check_factura", "Factura ya utilizada", {
            factura: val,
          });
        }
      } catch {
        setFacturaStatus("idle");
        logger.error("check_factura", "Error al verificar factura", {
          factura: val,
        });
      }
    }, 700);
  }, [formData.factura, facturaDirty]);

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
          logger.info("get_participant", "Participante encontrado por cédula", {
            cedula: val,
          });
        }
      } catch {
        logger.warn(
          "get_participant",
          "Participante no encontrado por cédula",
          { cedula: val },
        );
      }
    }, 500);
  }, [formData.cedula]);

  // Posicionar teclado flotante
  useEffect(() => {
    if (activeField === "factura" && facturaRef.current) {
      const rect = facturaRef.current.getBoundingClientRect();
      setKeyboardTop(rect.bottom + 8);
    } else if (activeField === "cedula" && cedulaRef.current) {
      const rect = cedulaRef.current.getBoundingClientRect();
      setKeyboardTop(rect.bottom + 8);
    } else if (activeField === "nombres" && nombresRef.current) {
      const rect = nombresRef.current.getBoundingClientRect();
      setKeyboardTop(rect.bottom + 8);
    } else {
      setKeyboardTop(null);
    }
  }, [activeField]);

  const handleContinue = async () => {
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
      } else if (facturaStatus === "taken") {
        errors.factura = "Factura ya utilizada";
        hasError = true;
      } else if (facturaStatus === "idle") {
        // Validar ahora si nunca se modificó
        try {
          const res = await registrationsApi.checkFactura(
            formData.factura.trim(),
          );
          if (!res.available) {
            setFacturaStatus("taken");
            errors.factura = "Factura ya utilizada";
            hasError = true;
          } else {
            setFacturaStatus("ok");
          }
        } catch {
          // Sin conexión — continuar igual
          setFacturaStatus("ok");
        }
      }
    }
    setFieldErrors(errors);
    if (hasError) return;
    setError("");
    setActiveField(null);
    logger.info(
      "register_form_complete",
      "Formulario completado, avanzando a predicciones",
    );
    setScreen("predict");
  };

  const handleKbChange = useCallback(
    (val: string) => {
      if (!activeField) return;

      if (activeField === "factura" && facturaFocus !== null) {
        if (!facturaDirty) setFacturaDirty(true);
        const next = [...facturaDigits];
        const current = facturaDigits[facturaFocus];
        let nextFocus: number | null = null;
        if (val.length < current.length) {
          next[facturaFocus] = "";
          nextFocus = facturaFocus > 0 ? facturaFocus - 1 : null;
        } else if (val.length > 0) {
          next[facturaFocus] = val.slice(-1);
          nextFocus = facturaFocus < 14 ? facturaFocus + 1 : null;
        }
        setFacturaDigits(next);
        if (nextFocus !== null) setFacturaFocus(nextFocus);
        const assembled =
          next.slice(0, 3).join("") +
          "-" +
          next.slice(3, 6).join("") +
          "-" +
          next.slice(6, 15).join("");
        setFormField("factura", assembled);
        return;
      }

      let finalVal = val;
      if (activeField === "nombres") {
        finalVal = val.toUpperCase();
      }
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
    [activeField, facturaFocus, facturaDigits],
  );

  const handleDone = () => {
    if (!activeField) return;
    if (activeField === "factura") {
      setActiveField(null);
      setFacturaFocus(null);
      return;
    }
    const error = validateField(activeField, formData[activeField]);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [activeField]: error }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, [activeField]: undefined }));
    const allIds = FIELDS.map((f) => f.id);
    let next = allIds.indexOf(activeField) + 1;
    while (next < allIds.length && HIDDEN_FIELDS.includes(allIds[next]))
      next++;
    if (next < allIds.length) setActiveField(allIds[next]);
    else setActiveField(null);
  };

  const goToNextField = () => {
    if (!activeField) return;
    if (activeField === "factura") {
      setFacturaFocus(null);
      setActiveField("cedula");
    } else if (activeField === "cedula") {
      setActiveField("nombres");
    } else {
      setActiveField(null);
    }
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

  const getDigitClass = (i: number) => {
    let cls = "input-field digit-box";
    if (facturaFocus === i) cls += " active";
    if (facturaStatus === "ok") cls += " ok";
    if (facturaStatus === "taken") cls += " err";
    if (fieldErrors.factura) cls += " err";
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
          padding: "32px 4px",
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
              maxWidth: "none",
              background: "rgba(255,255,255,.25)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              borderRadius: 24,
              padding: "64px 64px",
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
                gridTemplateColumns: "1fr",
                gap: "48px 80px",
              }}
            >
              {FIELDS.map((f) => {
                const hint = getHint(f.id);
                const hidden = HIDDEN_FIELDS.includes(f.id);
                if (f.id === "factura") {
                  return (
                    <div
                      key={f.id}
                      className="input-wrap"
                      style={{ gridColumn: "1 / -1" }}
                    >
                      <label className="input-label" style={{ fontSize: 22 }}>
                        {f.label}
                        {f.required && <span>*</span>}
                      </label>
                      <div
                        ref={facturaRef}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          justifyContent: "center",
                        }}
                      >
                        {facturaDigits.map((digit, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0,
                            }}
                          >
                            <div
                              className={getDigitClass(i)}
                              style={{
                                width: 42,
                                height: 60,
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 26,
                                fontWeight: 700,
                                cursor: "pointer",
                                borderRadius: 8,
                                background:
                                  facturaFocus === i
                                    ? "rgba(255,255,255,.2)"
                                    : digit
                                      ? "rgba(255,255,255,.12)"
                                      : "rgba(255,255,255,.06)",
                                border:
                                  facturaFocus === i
                                    ? "1px solid rgba(255,255,255,.6)"
                                    : "1px solid rgba(255,255,255,.15)",
                                color: digit ? "#fff" : "rgba(255,255,255,.25)",
                                transition: "all .15s",
                              }}
                              onPointerDown={() => {
                                setActiveField("factura");
                                setFacturaFocus(i);
                              }}
                            >
                              {digit || ""}
                            </div>
                            {(i === 2 || i === 5) && (
                              <span
                                style={{
                                  fontSize: 22,
                                  fontWeight: 700,
                                  color: "rgba(255,255,255,.4)",
                                  margin: "0 6px",
                                }}
                              >
                                –
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {hint && (
                        <div
                          className={`input-hint ${hint.cls}`}
                          style={{ textAlign: "center" }}
                        >
                          {hint.text}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div
                    key={f.id}
                    ref={f.id === "cedula" ? cedulaRef : f.id === "nombres" ? nombresRef : undefined}
                    className="input-wrap"
                    style={hidden ? { display: "none" } : undefined}
                  >
                    <label className="input-label" style={{ fontSize: 22 }}>
                      {f.label}
                      {f.required && <span>*</span>}
                    </label>
                    <input
                      readOnly
                      className={getInputClass(f.id)}
                      style={{
                        fontSize: 26,
                        minHeight: 68,
                        padding: "0 18px",
                        cursor: "pointer",
                      }}
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

      {/* Floating keyboard */}
      <div
        className="keyboard-floating"
        style={{
          top: keyboardTop !== null ? keyboardTop : -9999,
          opacity: activeField ? 1 : 0,
          pointerEvents: activeField ? "auto" : "none",
        }}
      >
        <div className="kb-bar-c">
          <span className="bar-label">
            {currentField?.label || "Selecciona un campo"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="bar-btn bar-btn-ghost"
              onClick={() => {
                setActiveField(null);
                setFacturaFocus(null);
              }}
            >
              Cerrar
            </button>
            <button
              className="bar-btn bar-btn-primary"
              onClick={goToNextField}
            >
              Siguiente
            </button>
          </div>
        </div>
        <VirtualKeyboard
          compact
          value={
            activeField === "factura" && facturaFocus !== null
              ? facturaDigits[facturaFocus]
              : activeField
                ? formData[activeField] || ""
                : ""
          }
          onChange={handleKbChange}
          mode={currentField?.mode || "default"}
          onDone={handleDone}
        />
      </div>

      <InactivityOverlay countdown={countdown} onCancel={cancelReset} />
    </div>
  );
}
