import React from 'react'
import { Link } from 'react-router-dom'

export default function Welcome(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-600/20 to-red-800/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-gray-700/20 to-gray-900/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-6xl w-full relative">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-red-500/30">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Customer service icon */}
              <div className="flex justify-center lg:justify-start mb-8">
                <div className="p-6 bg-gradient-to-br from-red-600 via-red-700 to-gray-900 rounded-3xl shadow-2xl shadow-red-500/20 border border-red-500/30 transform hover:scale-105 transition-all duration-300">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Customer service icon">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4a7 7 0 00-6.96 6.18 2.4 2.4 0 00-1.29 2.13V14a2 2 0 002 2h1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4a7 7 0 016.96 6.18 2.4 2.4 0 011.29 2.13V14a2 2 0 01-2 2h-1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13.5a3 3 0 006 0" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 10.5h.008v.008H9.75zM14.25 10.5h.008v.008h-.008z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16v1.5a3.5 3.5 0 003.5 3.5h1A3.5 3.5 0 0016 17.5V16" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 6.5l1.5-1.5M6.5 6.5L5 5" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 via-red-400 to-gray-300 bg-clip-text text-transparent">
                Welcome to WYZE
              </h1>
              <p className="text-2xl text-gray-400 mb-8">
                WYZE Support Portal — fast, simple IT helpdesk for your organisation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/register" 
                  className="px-8 py-4 bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 border border-red-500/30"
                >
                  <span>Get Started</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link 
                  to="/login" 
                  className="px-8 py-4 bg-gradient-to-br from-gray-800 to-gray-900 text-gray-200 font-bold text-lg rounded-xl border border-red-500/30 hover:border-red-500/50 hover:bg-gradient-to-r hover:from-red-950 hover:to-gray-900 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <span>Sign In</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </Link>
              </div>
            </div>
            
            {/* Right Content - Info Cards */}
            <div className="flex-1 space-y-6">
              {/* Features */}
              <div className="bg-gradient-to-br from-red-950/30 to-gray-900/30 rounded-2xl p-6 border border-red-500/20 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-red-600 to-red-800 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-200 mb-2">Fast Resolution</h3>
                    <p className="text-gray-400">Get your IT issues resolved quickly with our efficient ticketing system</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-950/30 to-gray-900/30 rounded-2xl p-6 border border-red-500/20 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-red-600 to-red-800 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-200 mb-2">24/7 Tracking</h3>
                    <p className="text-gray-400">Track your tickets in real-time and stay updated on progress</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-950/30 to-gray-900/30 rounded-2xl p-6 border border-red-500/20 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-red-600 to-red-800 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-200 mb-2">Team Collaboration</h3>
                    <p className="text-gray-400">Seamless collaboration between employees and IT staff</p>
                  </div>
                </div>
              </div>
              
              {/* Support Info */}
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-black rounded-2xl border border-red-500/20">
                <p className="text-gray-400 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Support hours:</span> Mon–Fri 09:00–17:00
                </p>
                <p className="text-gray-400">
                  Contact WYZE IT via tickets here for fast resolution.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom decoration */}
        <div className="mt-6 text-center text-sm text-gray-500">
          © 2025 WYZE Support System. All rights reserved.
        </div>
      </div>
    </div>
  )
}
