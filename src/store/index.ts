import { create } from 'zustand'
import type { Screen, Phase, Match, Campaign, Team, FormData, Prediction } from '../types'
import { EMPTY_FORM } from '../types'

interface AppStore {
  // Navegación
  screen: Screen
  setScreen: (s: Screen) => void

  // Datos del servidor
  phase: Phase | null
  matches: Match[]
  campaign: Campaign | null
  teams: Team[]
  isConfigured: boolean
  totemCode: string

  setPhaseData: (phase: Phase, matches: Match[], campaign: Campaign | null) => void
  setTeams: (teams: Team[], phaseNumber: number, predictionsRequired: number) => void
  setConfigured: (configured: boolean, code: string) => void

  // Formulario del participante
  formData: FormData
  setFormField: (field: keyof FormData, value: string) => void
  prefillForm: (p: { nombres: string; apellidos: string; telefono?: string; email?: string }) => void

  // Predicciones
  predictions: Prediction[]
  addPrediction: (p: Prediction) => void
  removePrediction: (match_id: number) => void
  updatePrediction: (match_id: number, field: 'goals_local' | 'goals_visitor', value: number) => void

  // Campeón
  champion: string | null
  setChampion: (team: string | null) => void

  // Factura
  facturaStatus: 'idle' | 'checking' | 'ok' | 'taken'
  setFacturaStatus: (s: AppStore['facturaStatus']) => void

  // Submit
  submitting: boolean
  setSubmitting: (v: boolean) => void

  // Reset al finalizar
  resetFlow: () => void
}

export const useStore = create<AppStore>((set) => ({
  screen: 'splash',
  setScreen: (screen) => set({ screen }),

  phase: null,
  matches: [],
  campaign: null,
  teams: [],
  isConfigured: false,
  totemCode: '',

  setPhaseData: (phase, matches, campaign) => set({ phase, matches, campaign }),
  setTeams: (teams) => set({ teams }),
  setConfigured: (isConfigured, totemCode) => set({ isConfigured, totemCode }),

  formData: { ...EMPTY_FORM },
  setFormField: (field, value) =>
    set(s => ({ formData: { ...s.formData, [field]: value } })),
  prefillForm: (p) =>
    set(s => ({
      formData: {
        ...s.formData,
        nombres:   p.nombres,
        apellidos: p.apellidos,
        telefono:  p.telefono || '',
        email:     p.email || '',
      },
    })),

  predictions: [],
  addPrediction: (pred) =>
    set(s => {
      if (s.predictions.find(p => p.match_id === pred.match_id)) return s
      return { predictions: [...s.predictions, pred] }
    }),
  removePrediction: (match_id) =>
    set(s => ({ predictions: s.predictions.filter(p => p.match_id !== match_id) })),
  updatePrediction: (match_id, field, value) =>
    set(s => ({
      predictions: s.predictions.map(p =>
        p.match_id === match_id ? { ...p, [field]: Math.max(0, value) } : p,
      ),
    })),

  champion: null,
  setChampion: (champion) => set({ champion }),

  facturaStatus: 'idle',
  setFacturaStatus: (facturaStatus) => set({ facturaStatus }),

  submitting: false,
  setSubmitting: (submitting) => set({ submitting }),

  resetFlow: () => set({
    screen: 'splash',
    formData: { ...EMPTY_FORM },
    predictions: [],
    champion: null,
    facturaStatus: 'idle',
    submitting: false,
  }),
}))
