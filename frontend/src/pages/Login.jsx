import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import BackButton from '../components/BackButton'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      // Show more helpful errors: API-provided message, else network error, else fallback
      const msg = err?.response?.data?.message || err?.message || 'Login failed'
      setError(msg)
      // eslint-disable-next-line no-console
      console.error('Login error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-600/30 to-red-800/30 rounded-full blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-gray-700/30 to-gray-900/30 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-md w-full relative">
        <div className="absolute -top-10 left-0">
          <BackButton fallback="/welcome" />
        </div>
        {/* Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-red-500/30">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-red-600 via-red-700 to-gray-900 rounded-2xl shadow-2xl shadow-red-500/20 border border-red-500/30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-red-500 via-red-400 to-gray-300 bg-clip-text text-transparent">
            Welcome Back to WYZE
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Access your support tickets and track progress
          </p>
          
          {error && (
            <div className="mb-4 p-4 bg-red-950/50 border border-red-600 rounded-xl flex items-center gap-3 backdrop-blur-sm">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input 
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-red-500/30 text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" 
                placeholder="Email address" 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-red-500/30 text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <div className="flex items-center justify-end">
              <a href="/forgot-password" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                Forgot password?
              </a>
            </div>
            
            <button 
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 border border-red-500/30"
            >
              <span>Sign In</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <a href="/register" className="font-semibold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent hover:from-red-400 hover:to-gray-300 transition-all">
                Register now
              </a>
            </p>
          </div>
        </div>
        
        {/* Bottom decoration */}
        <div className="mt-4 text-center text-xs text-gray-500">
          © 2025 WYZE Support System. All rights reserved.
        </div>
      </div>
    </div>
  )
}
