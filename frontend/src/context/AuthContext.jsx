import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from '../api/axios'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null
    } catch (e) {
      return null
    }
  })
  const navigate = useNavigate()

  useEffect(() => {
    // nothing for now; placeholder for token validation on mount
  }, [])

  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { email, password })
    const { token, user: payload, mustChangePassword } = res.data
    const enrichedUser = { ...payload, mustChangePassword }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(enrichedUser))
    setUser(enrichedUser)
    if (mustChangePassword) {
      window.alert('For security, please change your password now. Use "Forgot password" to set a new one before continuing to use the portal.')
    }
    // redirect based on role
    if (payload.role === 'it_staff') navigate('/it')
    else if (payload.role === 'manager') navigate('/manager')
    else navigate('/employee')
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
