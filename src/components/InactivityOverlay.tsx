interface Props { countdown: number | null; onCancel: () => void }

export function InactivityOverlay({ countdown, onCancel }: Props) {
  if (countdown === null) return null
  return (
    <div className="inactivity-overlay" onClick={onCancel}>
      <div style={{ fontSize: 32, color: 'rgba(255,255,255,.65)', textAlign: 'center' }}>
        ¿Sigues ahí?
      </div>
      <div className="inactivity-count">{countdown}</div>
      <div style={{ fontSize: 22, color: 'rgba(255,255,255,.45)', textAlign: 'center' }}>
        La sesión se reiniciará automáticamente
      </div>
      <button
        className="btn btn-accent btn-lg"
        style={{ marginTop: 16, width: 360 }}
        onClick={e => { e.stopPropagation(); onCancel() }}
      >
        Continuar
      </button>
    </div>
  )
}
