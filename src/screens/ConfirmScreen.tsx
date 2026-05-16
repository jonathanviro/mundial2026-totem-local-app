import { useState, useCallback, useEffect, useRef } from "react";
import { useStore } from "../store";
import { registrationsApi } from "../api";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { InactivityOverlay } from "../components/InactivityOverlay";
import { useInactivity } from "../hooks/useInactivity";
import { logger } from "../services/logger";
import { getTeamFlag } from "../data/teams";
import { Flag } from "../components/Flag";

type FieldId = "cedula" | "nombres" | "apellidos" | "telefono" | "email";
type KbMode = "default" | "numeric" | "email" | "alphanumeric" | "no-at";

const MAX_LENGTH: Record<FieldId, number> = {
  cedula: 15,
  nombres: 30,
  apellidos: 30,
  telefono: 10,
  email: 50,
};

const EDITABLE_FIELDS: {
  id: FieldId;
  label: string;
  mode: KbMode;
  required: boolean;
}[] = [
  { id: "cedula", label: "Cédula / RUC", mode: "numeric", required: true },
  { id: "nombres", label: "Nombres", mode: "no-at", required: true },
  { id: "apellidos", label: "Apellidos", mode: "no-at", required: false },
  { id: "telefono", label: "Teléfono", mode: "numeric", required: false },
  { id: "email", label: "Correo electrónico", mode: "email", required: false },
];

const HIDDEN_FIELDS: FieldId[] = ["apellidos", "telefono", "email"];

const validateField = (id: FieldId, value: string): string | null => {
  if (HIDDEN_FIELDS.includes(id)) return null;
  const v = value.trim();
  if (!v) return "Campo obligatorio";
  switch (id) {
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

export function ConfirmScreen() {
  const {
    formData,
    setFormField,
    predictions,
    matches,
    phase,
    champion,
    submitting,
    setSubmitting,
    setScreen,
    resetFlow,
  } = useStore();

  const [activeField, setActiveField] = useState<FieldId | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldId, string>>
  >({});
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  const cedulaRef = useRef<HTMLDivElement>(null);
  const nombresRef = useRef<HTMLDivElement>(null);
  const { countdown, cancelReset } = useInactivity(60000, resetFlow);

  const currentField = EDITABLE_FIELDS.find((f) => f.id === activeField);

  useEffect(() => {
    if (activeField === "cedula" && cedulaRef.current) {
      const rect = cedulaRef.current.getBoundingClientRect();
      setKeyboardTop(rect.bottom + 8);
    } else if (activeField === "nombres" && nombresRef.current) {
      const rect = nombresRef.current.getBoundingClientRect();
      setKeyboardTop(rect.bottom + 8);
    } else {
      setKeyboardTop(null);
    }
  }, [activeField]);

  const getMatch = (id: number) => matches.find((m) => m.id === id);

  const handleKbChange = useCallback(
    (val: string) => {
      if (!activeField) return;
      let finalVal = activeField === "nombres" ? val.toUpperCase() : val;
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
    [activeField, setFormField],
  );

  const handleDone = () => {
    if (!activeField) return;
    const error = validateField(activeField, formData[activeField]);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [activeField]: error }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, [activeField]: undefined }));
    const allIds = EDITABLE_FIELDS.map((f) => f.id);
    let next = allIds.indexOf(activeField) + 1;
    while (next < allIds.length && HIDDEN_FIELDS.includes(allIds[next]))
      next++;
    if (next < allIds.length) setActiveField(allIds[next]);
    else setActiveField(null);
  };

  const goToNextField = () => {
    if (!activeField) return;
    if (activeField === "cedula") {
      setActiveField("nombres");
    } else {
      setActiveField(null);
    }
  };

  const getInputClass = (id: FieldId) => {
    let cls = "input-field";
    if (activeField === id) cls += " active";
    if (!formData[id].trim()) cls += " err";
    if (fieldErrors[id]) cls += " err";
    return cls;
  };

  const handleConfirm = async () => {
    const errors: Partial<Record<FieldId, string>> = {};
    let hasError = false;
    for (const f of EDITABLE_FIELDS) {
      const err = validateField(f.id, formData[f.id]);
      if (err) {
        errors[f.id] = err;
        hasError = true;
      }
    }
    setFieldErrors(errors);
    if (hasError) return;

    setSubmitting(true);
    try {
      await registrationsApi.register({
        factura: formData.factura,
        cedula: formData.cedula,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono || undefined,
        email: formData.email || undefined,
        champion_team: champion || undefined,
        predictions: predictions.map((p) => ({
          match_id: p.match_id,
          goals_local: p.goals_local,
          goals_visitor: p.goals_visitor,
        })),
      });
      logger.info("register_success", "Registro enviado exitosamente", { factura: formData.factura });
      setScreen("success");
    } catch (err: any) {
      logger.error("register_error", "Error al enviar registro", { factura: formData.factura, error: err?.response?.data?.message || err.message });
      alert(
        err?.response?.data?.message || "Error al guardar. Intenta de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
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
          <div className="screen-step">Confirmar participación</div>
          <div className="screen-title">Revisa tus datos</div>
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
          padding: "16px 60px",
          overflow: "hidden",
        }}
      >
        <div
          className="scroll"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            maxWidth: 1300,
            width: "100%",
            alignSelf: "center",
            gap: 12,
          }}
        >
          {/* Datos del participante */}
          <div
            style={{
              width: "100%",
              background: "rgba(255,255,255,.22)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,.28)",
              borderRadius: 20,
              padding: "20px 32px",
              boxShadow:
                "0 8px 32px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.06)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,.5)",
                textTransform: "uppercase",
                letterSpacing: ".1em",
                marginBottom: 18,
                fontWeight: 700,
              }}
            >
              Datos del participante
            </div>

            {/* Factura - estática */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "10px 18px",
                marginBottom: 16,
                background: "rgba(255,255,255,.08)",
                borderRadius: 14,
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,.4)",
                  fontWeight: 600,
                  minWidth: 80,
                }}
              >
                Factura
              </span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#69f0ae",
                }}
              >
                {formData.factura}
              </span>
            </div>

            {/* Campos editables */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "16px 32px",
              }}
            >
              {EDITABLE_FIELDS.map((f) => {
                const hidden = HIDDEN_FIELDS.includes(f.id);
                return (
                  <div key={f.id} className="input-wrap" ref={f.id === "cedula" ? cedulaRef : f.id === "nombres" ? nombresRef : undefined} style={hidden ? { display: "none" } : undefined}>
                    <label className="input-label">
                      {f.label}
                      {f.required && <span>*</span>}
                    </label>
                    <input
                      readOnly
                      className={getInputClass(f.id)}
                      style={{
                        fontSize: 22,
                        minHeight: 60,
                        cursor: "pointer",
                      }}
                      value={formData[f.id]}
                      placeholder={f.label}
                      onPointerDown={() => setActiveField(f.id)}
                    />
                    {!formData[f.id].trim() && !fieldErrors[f.id] && (
                      <div
                        style={{
                          fontSize: 14,
                          color: "#ff8080",
                          marginTop: 4,
                        }}
                      >
                        Campo requerido
                      </div>
                    )}
                    {fieldErrors[f.id] && (
                      <div className="input-hint err">{fieldErrors[f.id]}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campeón */}
          {champion && (
            <div
              style={{
                width: "100%",
                background: "rgba(255,215,0,.15)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,215,0,.35)",
                borderRadius: 20,
                padding: "14px 32px",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                flexShrink: 0,
              }}
            >
              <Flag team={champion} size={36} />
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,215,0)",
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                    fontWeight: 700,
                    marginBottom: 2,
                  }}
                >
                  Tu campeón
                </div>
                <div
                  style={{ fontSize: 20, fontWeight: 700, color: "#ffffff" }}
                >
                  {champion}
                </div>
              </div>
            </div>
          )}

          {/* Predicciones */}
          <div
            style={{
              width: "100%",
              background: "rgba(255,255,255,.22)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,.28)",
              borderRadius: 20,
              padding: "28px 28px",
              boxShadow:
                "0 8px 32px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.06)",
            }}
          >
            <div
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,.5)",
                textTransform: "uppercase",
                letterSpacing: ".1em",
                marginBottom: 14,
                fontWeight: 700,
              }}
            >
              Tus predicciones ({predictions.length})
            </div>
            <div
              style={{
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
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#69f0ae",
                        minWidth: 24,
                        flexShrink: 0,
                        textAlign: "right",
                      }}
                    >
                      {i + 1}
                    </span>
                    <Flag team={m.team_local} size={24} />
                    <span
                      style={{
                        fontSize: 16,
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
                        fontSize: 22,
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
                        fontSize: 16,
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
                    <Flag team={m.team_visitor} size={24} />
                  </div>
                );
              })}
            </div>
          </div>
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
              onClick={() => setActiveField(null)}
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
          value={activeField ? formData[activeField] || "" : ""}
          onChange={handleKbChange}
          mode={currentField?.mode || "default"}
          onDone={handleDone}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
          padding: "24px 80px",
          display: "flex",
          gap: 20,
          background: "rgba(0,0,0,.35)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,.12)",
        }}
      >
        <button
          className="btn btn-secondary btn-lg"
          style={{ flex: 1 }}
          onClick={() => setScreen("predict")}
          disabled={submitting}
        >
          Modificar
        </button>
        <button
          className="btn btn-accent btn-xl"
          style={{ flex: 2, fontSize: 26 }}
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? "Guardando..." : "¡Confirmar!"}
        </button>
      </div>

      <InactivityOverlay countdown={countdown} onCancel={cancelReset} />
    </div>
  );
}
