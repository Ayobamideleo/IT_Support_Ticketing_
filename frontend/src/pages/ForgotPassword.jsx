import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import BackButton from '../components/BackButton'

export default function ForgotPassword() {
  const [step, setStep] = useState(1) // 1: email, 2: code + new password
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email)
    }
  }, [location.state])

  const handleRequestCode = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    
    try {
      const response = await axios.post('/auth/forgot-password', { email })
      setMessage(response.data.message)
      
      // If in dev mode and code is returned, log it
      if (response.data.resetCode) {
        console.log('🔑 Password Reset Code:', response.data.resetCode)
      }
      
      // Move to step 2
      setTimeout(() => {
        setStep(2)
        setMessage('')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await axios.post('/auth/reset-password', { 
        email, 
        code, 
        newPassword 
      })
      setMessage(response.data.message)
      
      // Redirect to login after success
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-600/30 to-red-800/30 rounded-full blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-gray-700/30 to-gray-900/30 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-md w-full relative">
        <div className="absolute -top-10 left-0">
          <BackButton fallback="/login" />
        </div>
        {/* Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-red-500/30">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-red-600 via-red-700 to-gray-900 rounded-2xl shadow-2xl shadow-red-500/20 border border-red-500/30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-red-500 via-red-400 to-gray-300 bg-clip-text text-transparent">
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </h1>
          <p className="text-center text-gray-400 mb-8">
            {step === 1 
              ? 'Enter your email and we\'ll send you a reset code' 
              : 'Enter the 6-digit code and your new password'}
          </p>
          
          {error && (
            <div className="mb-4 p-4 bg-red-950/50 border border-red-600 rounded-xl flex items-center gap-3 backdrop-blur-sm">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
          
          {message && (
            <div className="mb-4 p-4 bg-green-950/50 border border-green-600 rounded-xl flex items-center gap-3 backdrop-blur-sm">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-400 text-sm">{message}</span>
            </div>
          )}
          
          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
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
                  disabled={loading}
                />
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Sending...' : 'Send Reset Code'}</span>
                {!loading && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <input 
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-red-500/30 text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all tracking-widest text-center text-lg font-bold" 
                  placeholder="000000" 
                  type="text"
                  maxLength="6"
                  value={code} 
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  required 
                  disabled={loading}
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
                  placeholder="New password" 
                  type="password"
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  required 
                  disabled={loading}
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input 
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-red-500/30 text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" 
                  placeholder="Confirm new password" 
                  type="password"
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
                  required 
                  disabled={loading}
                />
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
                {!loading && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-gray-400 hover:text-gray-300 transition-colors text-sm"
              >
                ← Back to email
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Remember your password?{' '}
              <a href="/login" className="font-semibold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent hover:from-red-400 hover:to-gray-300 transition-all">
                Sign in
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
