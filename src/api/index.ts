import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 10000 })

export const configApi = {
  get: () => api.get('/config').then(r => r.data),
  update: (data: { totem_code?: string; totem_name?: string }) =>
    api.put('/config', data).then(r => r.data),
}

export const syncApi = {
  trigger: () => api.post('/sync/trigger').then(r => r.data),
  status:  () => api.get('/sync/status').then(r => r.data),
}

export const phaseApi = {
  getActive: () => api.get('/phase/active').then(r => r.data),
  getTeams:  () => api.get('/phase/teams').then(r => r.data),
}

export const registrationsApi = {
  checkFactura: (factura: string) =>
    api.get(`/registrations/check-factura/${encodeURIComponent(factura)}`).then(r => r.data),
  getParticipant: (cedula: string) =>
    api.get(`/registrations/participant/${encodeURIComponent(cedula)}`).then(r => r.data),
  register: (payload: {
    factura: string
    cedula: string
    nombres: string
    apellidos: string
    telefono?: string
    email?: string
    champion_team?: string
    predictions: { match_id: number; goals_local: number; goals_visitor: number }[]
  }) => api.post('/registrations', payload).then(r => r.data),
}

export const logsApi = {
  log: (data: { level: string; action: string; message: string; details?: any }) =>
    api.post('/logs', data).then(r => r.data).catch(() => {}),
  getDates: () => api.get('/logs').then(r => r.data),
  getByDate: (date: string) => api.get(`/logs/${date}`).then(r => r.data),
}
