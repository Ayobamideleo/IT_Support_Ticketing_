import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.trim())
  ? import.meta.env.VITE_API_BASE.trim()
  : 'http://localhost:5000/api'

const instance = axios.create({
  baseURL: API_BASE,
})

// attach token if present in localStorage
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  // Prevent caching of GET requests
  if (config.method === 'get') {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    config.headers['Pragma'] = 'no-cache'
    config.headers['Expires'] = '0'
  }
  return config
})

// global error handling
instance.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const msgRaw = (error?.response?.data?.message || error?.response?.data?.error || error?.message || '').toString()
    const msg = msgRaw.toLowerCase()

    // Consider common JWT failure messages across environments
    const isInvalid = msg.includes('invalid token') || msg.includes('jwt malformed') || msg.includes('signature')
    const isExpired = msg.includes('expired') || msg.includes('jwt expired') || msg.includes('token expired')

    if (status === 401 || (status === 403 && (isInvalid || isExpired))) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } catch {}
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default instance
