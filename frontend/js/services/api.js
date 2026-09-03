const API_BASE_PATH = '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_PATH}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error('Não foi possível concluir a solicitação.')
  }

  return response.status === 204 ? null : response.json()
}

// Contratos preparados para a futura API. Nenhuma destas funções é chamada pela página atual.
export function registerAccount(email, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getCurrentUser() {
  return request('/auth/me')
}

export function logout() {
  return request('/auth/logout', { method: 'POST' })
}

export async function uploadDataFile(file) {
  const body = new FormData()
  body.append('file', file)

  const response = await fetch(`${API_BASE_PATH}/uploads`, {
    method: 'POST',
    credentials: 'same-origin',
    body,
  })

  if (!response.ok) {
    throw new Error('Não foi possível enviar o arquivo.')
  }

  return response.json()
}
