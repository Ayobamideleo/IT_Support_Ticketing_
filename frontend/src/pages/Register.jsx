import React, { useState } from 'react'
import axios from '../api/axios'
import { useNavigate } from 'react-router-dom'
import { DEPARTMENTS } from '../constants/departments'
import BackButton from '../components/BackButton'

export default function Register(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const res = await axios.post('/auth/register', { name, email, password, department })
      setSuccess('Registration successful. Please verify your email.')
      const verificationCode = res.data.verificationCode
      setTimeout(() => {
        navigate('/verify-email', { state: { email, verificationCode } })
      }, 800)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-600/30 to-red-800/30 rounded-full blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-gray-700/30 to-gray-900/30 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-md w-full relative">
        <div className="absolute -top-10 left-0">
          <BackButton fallback="/welcome" />
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-red-500/30">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-red-600 via-red-700 to-gray-900 rounded-2xl shadow-2xl shadow-red-500/20 border border-red-500/30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-red-500 via-red-400 to-gray-300 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-center text-gray-400 mb-8">
            Join WYZE Support Portal today
          </p>
          
          {error && (
            <div className="mb-4 p-4 bg-red-950/50 border border-red-600 rounded-xl flex items-center gap-3 backdrop-blur-sm">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-950/50 border border-green-600 rounded-xl flex items-center gap-3 backdrop-blur-sm">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-400 text-sm">{success}</span>
            </div>
          )}
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input 
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-red-500/30 text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" 
                placeholder="Full name" 
                value={name} 
                onChange={e=>setName(e.target.value)} 
                required 
              />
            </div>
            
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
                onChange={e=>setEmail(e.target.value)} 
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
                placeholder="Password" 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required 
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <select 
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-red-500/30 text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all appearance-none cursor-pointer" 
                value={department} 
                onChange={e=>setDepartment(e.target.value)} 
                required 
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 border border-red-500/30"
            >
              <span>Create Account</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <button 
                onClick={()=>navigate('/login')} 
                className="font-semibold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent hover:from-red-400 hover:to-gray-300 transition-all"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          © 2025 WYZE Support System. All rights reserved.
        </div>
      </div>
    </div>
  )
}
