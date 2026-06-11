export interface Campaign {
  id: number
  name: string
  slug: string
  bg_screen1_url?: string | null
  bg_screen2_url?: string | null
}

export interface Phase {
  id: number
  number: number
  name: string
  date_from?: string | null
  date_to?: string | null
  predictions_required: number
  min_correct_to_win: number
  version: number
}

export interface Match {
  id: number
  phase_id: number
  match_number: number
  group_name?: string | null
  team_local?: string | null
  team_visitor?: string | null
  goals_local?: number | null
  goals_visitor?: number | null
  finished: number
  date?: string | null
}

export interface Team {
  name: string
  flag: string
  match_ids: number[]
}

export interface Prediction {
  match_id: number
  goals_local: number
  goals_visitor: number
  match?: Match
}

export interface Participant {
  cedula: string
  nombres: string
  apellidos: string
  telefono?: string
  email?: string
}

export interface FormData {
  factura: string
  cedula: string
  nombres: string
  apellidos: string
  telefono: string
  email: string
}

export const EMPTY_FORM: FormData = {
  factura: '', cedula: '', nombres: '', apellidos: '', telefono: '', email: '',
}

// Pantallas de la app
export type Screen =
  | 'splash'      // Pantalla publicidad + botón participar
  | 'config'      // Configuración oculta (10 taps)
  | 'register'    // Formulario de datos del participante
  | 'predict'     // Selección de partidos y predicciones
  | 'confirm'     // Resumen antes de confirmar
  | 'success'     // Éxito - auto reset
  | 'logs'        // Visor de logs del sistema
  | 'matches'     // Visor de partidos de la fase
