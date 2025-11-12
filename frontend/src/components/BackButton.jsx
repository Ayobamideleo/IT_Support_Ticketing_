import React from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * BackButton - navigates to the previous page, or to a fallback route if no history exists.
 * Props:
 * - label?: string (default: "Back")
 * - fallback?: string (default: "/")
 * - className?: string (extra classes)
 */
export default function BackButton({ label = 'Back', fallback = '/', className = '' }) {
  const navigate = useNavigate()

  const goBack = () => {
    try {
      if (window.history && window.history.length > 1) {
        navigate(-1)
      } else if (fallback) {
        navigate(fallback)
      }
    } catch (e) {
      if (fallback) navigate(fallback)
    }
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:text-red-600 hover:border-red-400 shadow-sm ${className}`}
      aria-label="Go back"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span>{label}</span>
    </button>
  )
}
