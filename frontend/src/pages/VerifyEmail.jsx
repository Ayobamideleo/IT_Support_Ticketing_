import React, { useEffect, useState } from 'react'
import axios from '../api/axios'
import { useNavigate, useLocation } from 'react-router-dom'
import BackButton from '../components/BackButton'

export default function VerifyEmail() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  const [devCode, setDevCode] = useState(location.state?.verificationCode || '') // For dev/testing

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await axios.post('/auth/verify', { email, code })
      setSuccess('Email verified successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setSuccess('')
    setResending(true)
    try {
      const res = await axios.post('/auth/resend', { email })
      setSuccess('Verification code sent. Please check your email.')
      if (res.data?.verificationCode && import.meta.env.MODE !== 'production') {
        setDevCode(res.data.verificationCode)
      }
      setCooldown(60)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend code right now')
    } finally {
      setResending(false)
    }
  }

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  return (
    <div className="max-w-md mx-auto card">
      <div className="mb-2">
        <BackButton fallback="/login" />
      </div>
      <h2 className="text-xl font-bold mb-3">Verify your email</h2>
      <p className="text-sm muted mb-4">
        We've sent a 6-digit verification code to <strong>{email}</strong>
      </p>
      {devCode && import.meta.env.MODE !== 'production' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm">
          <strong>Dev mode:</strong> Your verification code is <code className="bg-yellow-100 px-2 py-1 rounded">{devCode}</code>
        </div>
      )}
      {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}
      {success && <div className="text-green-600 mb-3 text-sm">{success}</div>}
      <form onSubmit={handleVerify} className="space-y-3">
        <input
          className="w-full p-2 border rounded text-center text-lg tracking-widest"
          placeholder="000000"
          maxLength="6"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          required
          autoFocus
        />
        <div className="flex justify-between items-center">
          <button className="cta-primary" disabled={loading || code.length !== 6}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              disabled={resending || cooldown > 0}
            >
              {resending ? 'Sending…' : cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm muted hover:text-primary"
            >
              Back to login
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
