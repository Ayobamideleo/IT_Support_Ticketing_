import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useEffect, useState } from 'react'
import axios from './api/axios'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import Welcome from './pages/Welcome'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ITDashboard from './pages/ITDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import TicketDetail from './pages/TicketDetail'
import ManageAccounts from './pages/ManageAccounts'
import ITUserAccounts from './pages/ITUserAccounts'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

const Header = () => {
  const { user, logout } = useAuth()
  const [health, setHealth] = useState('unknown')

  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        const res = await axios.get('/health')
        if (active) setHealth(res.data?.status === 'ok' ? 'ok' : 'error')
      } catch {
        if (active) setHealth('error')
      }
    }
    check()
    const id = setInterval(check, 15000)
    return () => { active = false; clearInterval(id) }
  }, [])
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="header-brand">
            <img src="/wyze-logo.jpg" alt="WYZE" className="logo-small" onError={(e)=>{ if (e.currentTarget && !e.currentTarget.src.endsWith('.svg')) e.currentTarget.src='/wyze-logo.svg'}} />
            <div>
              <div style={{lineHeight:1}}>WYZE</div>
              <div style={{fontSize:12, marginTop:2}} className="muted">Support Portal</div>
            </div>
          </Link>
          <nav className="hidden sm:flex gap-3 items-center">
            <Link to="/employee" className="text-sm muted hover:text-primary">Employee</Link>
            <Link to="/it" className="text-sm muted hover:text-primary">IT</Link>
            <Link to="/manager" className="text-sm muted hover:text-primary">Manager</Link>
          </nav>
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className={`text-xs px-2 py-1 rounded ${health==='ok'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>API: {health}</span>
              <span className="text-sm text-gray-600">{user.name}</span>
              <button onClick={logout} className="text-sm text-white bg-primary px-3 py-1 rounded">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="text-sm text-primary">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/it"
            element={
              <ProtectedRoute allowedRoles={["it_staff"]}>
                <ITDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/accounts"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <ManageAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/it/accounts"
            element={
              <ProtectedRoute allowedRoles={["it_staff"]}>
                <ITUserAccounts />
              </ProtectedRoute>
            }
          />
          <Route path="/tickets/:id" element={<ProtectedRoute allowedRoles={["employee","it_staff","manager"]}><TicketDetail /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="*" element={<div className="p-8">Page not found</div>} />
        </Routes>
      </main>
    </div>
  )
}
