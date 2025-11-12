import axios from 'axios'

// Build a sensible default API base URL that works on LAN:
// - If running on localhost, default to localhost:5000
// - If accessed via a LAN IP/hostname, default to that host on port 5000
const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const inferredBase = (host === 'localhost' || host === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : `http://${host}:5000/api`
const API_BASE = import.meta.env.VITE_API_BASE || inferredBase

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
    if (status === 401) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } catch {}
      // Hard redirect to login; preserve path for after login if needed
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default instance
