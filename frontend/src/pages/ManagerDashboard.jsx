import React, { useEffect, useState, useRef } from 'react'
import axios from '../api/axios'
import { useNavigate, Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import FilterBar from '../components/FilterBar'
import { useAuth } from '../context/AuthContext'
import BackButton from '../components/BackButton'

export default function ManagerDashboard() {
  const [ticketStats, setTicketStats] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [breaches, setBreaches] = useState([])
  const [tickets, setTickets] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({ status: '', issueType: '', department: '', q: '' })
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const fetchData = async (p = page, f = filters) => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      query.set('page', p)
      query.set('limit', 20)
      if (f.status) query.set('status', f.status)
      if (f.issueType) query.set('issueType', f.issueType)
      if (f.department) query.set('department', f.department)
      if (f.q) query.set('q', f.q)
      const [ticketStatsRes, userStatsRes, breachesRes, ticketsRes] = await Promise.allSettled([
        axios.get('/tickets/stats'),
        axios.get('/users/stats'), // managers only; will fail for non-managers
        axios.get('/tickets/sla/breaches'),
        axios.get(`/tickets?${query.toString()}`),
      ])
      if (ticketStatsRes.status === 'fulfilled') {
        setTicketStats(ticketStatsRes.value.data)
      } else {
        console.error('Ticket stats fetch failed:', ticketStatsRes.reason)
      }
      if (userStatsRes.status === 'fulfilled') {
        setUserStats(userStatsRes.value.data)
      } else {
        // Gracefully degrade if user not authorized or other error
        setUserStats(null)
        if (userStatsRes.reason?.response?.status !== 403) {
          console.error('User stats fetch failed:', userStatsRes.reason)
        }
      }
      if (breachesRes.status === 'fulfilled') {
        setBreaches(breachesRes.value.data)
      } else {
        console.error('SLA breaches fetch failed:', breachesRes.reason)
        setBreaches([])
      }
      if (ticketsRes.status === 'fulfilled') {
        setTickets(ticketsRes.value.data.results)
        setPage(ticketsRes.value.data.page)
        setTotalPages(ticketsRes.value.data.totalPages)
      } else {
        console.error('Tickets fetch failed:', ticketsRes.reason)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(page, filters)
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(page, filters)
    }, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Status', 'Issue Type', 'Priority', 'Created By', 'Assigned To', 'Created At', 'Due Date']
    const rows = tickets.map(t => [
      t.id,
      `"${t.title}"`,
      t.status,
      t.issueType || 'N/A',
      t.priority,
      t.creator?.name || 'N/A',
      t.assignee?.name || 'Unassigned',
      new Date(t.createdAt).toISOString(),
      t.dueAt ? new Date(t.dueAt).toISOString() : 'N/A'
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tickets_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !ticketStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  // Prepare chart data
  const priorityData = ticketStats ? [
    { name: 'Low', value: tickets.filter(t => t.priority === 'low').length, color: '#10b981' },
    { name: 'Medium', value: tickets.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'High', value: tickets.filter(t => t.priority === 'high').length, color: '#f97316' },
    { name: 'Critical', value: tickets.filter(t => t.priority === 'critical').length, color: '#ef4444' }
  ] : []

  const slaData = ticketStats ? [
    { name: 'On Time', value: Math.max(0, ticketStats.total - breaches.length), color: '#10b981' },
    { name: 'Breached', value: breaches.length, color: '#ef4444' }
  ] : []

  const issueTypeBadge = (type) => {
    if (!type) return null
    const types = {
      hardware: { label: 'Hardware', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
      software: { label: 'Software', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
      networking: { label: 'Networking', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
      access_control: { label: 'Access Control', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
      email: { label: 'Email', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
      printer: { label: 'Printer', color: 'bg-pink-500/20 text-pink-400 border-pink-500/50' },
      phone: { label: 'Phone', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' },
      other: { label: 'Other', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' }
    }
    const t = types[type] || types.other
    return <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${t.color}`}>{t.label}</span>
  }

  const departmentData = tickets.reduce((acc, ticket) => {
    const dept = ticket.department || 'Other'
    const existing = acc.find(d => d.name === dept)
    if (existing) {
      existing.value++
    } else {
      acc.push({ name: dept, value: 1 })
    }
    return acc
  }, [])

  // Department breakdown sourced from backend stats (ticketsByDepartment) for consistency
  // Aggregate and sort by highest count
  const rawBackendDeptData = ticketStats?.ticketsByDepartment?.map(d => ({ name: d.department, value: d.count })) || []
  const backendDeptTotal = rawBackendDeptData.reduce((sum, d) => sum + d.value, 0)
  const backendDeptData = [...rawBackendDeptData].sort((a, b) => b.value - a.value)

  const rawUserDeptData = userStats?.usersByDepartment?.map(d => ({ name: d.department, value: d.count })) || []
  const userDeptTotal = rawUserDeptData.reduce((sum, d) => sum + d.value, 0)
  const userDeptData = [...rawUserDeptData].sort((a, b) => b.value - a.value)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative">
      {/* Floating Creative Menu Button */}
      <div className="fixed top-6 left-6 z-50" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="group relative p-4 bg-gradient-to-br from-red-600 via-red-700 to-gray-900 rounded-2xl shadow-2xl hover:shadow-red-500/50 transform hover:scale-110 transition-all duration-300 overflow-hidden border border-red-500/20"
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-red-300/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          {/* Hamburger Icon with Animation */}
          <div className="relative w-6 h-6">
            <span className={`absolute left-0 w-6 h-0.5 bg-white rounded-full transition-all duration-300 shadow-sm ${menuOpen ? 'top-3 rotate-45' : 'top-1'}`}></span>
            <span className={`absolute left-0 top-3 w-6 h-0.5 bg-white rounded-full transition-all duration-300 shadow-sm ${menuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}></span>
            <span className={`absolute left-0 w-6 h-0.5 bg-white rounded-full transition-all duration-300 shadow-sm ${menuOpen ? 'top-3 -rotate-45' : 'top-5'}`}></span>
          </div>
        </button>
        
        {/* Creative Dropdown Menu */}
        <div className={`absolute top-20 left-0 w-72 transition-all duration-300 transform origin-top-left ${
          menuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'
        }`}>
          <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl rounded-3xl shadow-2xl border border-red-500/30 overflow-hidden">
            {/* Menu Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-red-600 via-red-700 to-gray-900 border-b border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Manager Menu</p>
                  <p className="text-gray-300 text-xs">Quick Actions & Settings</p>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="relative p-3 space-y-1 bg-gradient-to-b from-gray-900 to-black">
              <Link
                to="/manager/accounts"
                onClick={() => setMenuOpen(false)}
                className="group flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-red-950 hover:to-gray-900 transition-all duration-300 transform hover:translate-x-1 border border-transparent hover:border-red-500/30"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-red-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative p-3 bg-gradient-to-br from-red-600 to-red-800 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-red-500/30">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white group-hover:text-red-400 transition-colors">Manage Accounts</p>
                  <p className="text-xs text-gray-400 mt-0.5">Control user access & roles</p>
                </div>
                <svg className="w-5 h-5 text-gray-500 group-hover:text-red-400 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <div className="mx-4 my-3 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
              
              <button
                onClick={handleLogout}
                className="group w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-red-950 hover:to-gray-900 transition-all duration-300 transform hover:translate-x-1 border border-transparent hover:border-red-500/30"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-red-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative p-3 bg-gradient-to-br from-red-600 to-red-800 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-red-500/30">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-white group-hover:text-red-400 transition-colors">Logout</p>
                  <p className="text-xs text-gray-400 mt-0.5">Sign out securely</p>
                </div>
                <svg className="w-5 h-5 text-gray-500 group-hover:text-red-400 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Decorative bottom wave */}
            <div className="h-2 bg-gradient-to-r from-red-600 via-red-700 to-gray-900"></div>
          </div>
        </div>
      </div>

      <div className="p-8 pt-24">
        {/* Creative Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-transparent to-red-600/20 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-red-500/20 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <div className="mb-2"><BackButton fallback="/welcome" /></div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-red-400 to-gray-300 bg-clip-text text-transparent mb-2">
                  Manager Dashboard
                </h1>
                <p className="text-gray-400">Overview of tickets, SLA compliance, and team performance</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => fetchData(page, filters)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 flex items-center gap-2 shadow-lg border border-gray-600/30 transition-all duration-300 hover:scale-105"
                  title="Refresh tickets"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button 
                  onClick={exportToCSV}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 flex items-center gap-2 shadow-lg shadow-red-500/30 border border-red-500/30 transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview Cards - Red/Black Theme */}
        {ticketStats && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <div className="relative group overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg shadow-red-500/10 hover:shadow-red-500/30 transition-all duration-300 transform hover:scale-105 border border-red-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="relative p-6 text-center">
                <div className="text-sm font-medium text-gray-400 mb-2">Total Tickets</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">{ticketStats.total}</div>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-red-600 to-transparent mx-auto rounded-full"></div>
              </div>
            </div>
            {userStats && (
            <div className="relative group overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 border border-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="relative p-6 text-center">
                <div className="text-sm font-medium text-gray-400 mb-2">Employees</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">{userStats.employees}</div>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-blue-600 to-transparent mx-auto rounded-full"></div>
              </div>
            </div>
            )}
            
            <div className="relative group overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105 border border-green-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="relative p-6 text-center">
                <div className="text-sm font-medium text-gray-400 mb-2">Open</div>
                <div className="text-4xl font-bold text-red-400">{ticketStats.open}</div>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-red-600 to-transparent mx-auto rounded-full"></div>
              </div>
            </div>
            
            <div className="relative group overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg shadow-purple-500/10 hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 border border-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="relative p-6 text-center">
                <div className="text-sm font-medium text-gray-400 mb-2">In Progress</div>
                <div className="text-4xl font-bold text-white">{ticketStats.inProgress || 0}</div>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-gray-500 to-transparent mx-auto rounded-full"></div>
              </div>
            </div>
            
            <div className="relative group overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/30 transition-all duration-300 transform hover:scale-105 border border-teal-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="relative p-6 text-center">
                <div className="text-sm font-medium text-gray-400 mb-2">Resolved</div>
                <div className="text-4xl font-bold text-gray-300">{ticketStats.resolved}</div>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-gray-400 to-transparent mx-auto rounded-full"></div>
              </div>
            </div>
            
            <div className="relative group overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg shadow-gray-500/10 hover:shadow-gray-500/30 transition-all duration-300 transform hover:scale-105 border border-gray-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="relative p-6 text-center">
                <div className="text-sm font-medium text-gray-400 mb-2">Closed</div>
                <div className="text-4xl font-bold text-gray-400">{ticketStats.closed || 0}</div>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-gray-500 to-transparent mx-auto rounded-full"></div>
              </div>
            </div>
            {userStats && (
            <div className="relative group overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 border border-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="relative p-6 text-center">
                <div className="text-sm font-medium text-gray-400 mb-2">IT Staff</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">{userStats.itStaff}</div>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-blue-600 to-transparent mx-auto rounded-full"></div>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Average Resolution Time - Dark Theme */}
        {ticketStats && (
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl shadow-red-500/10 p-8 mb-8 border border-red-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl border border-red-500/30">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">Average Resolution Time</h3>
              </div>
              <div className="text-6xl font-bold bg-gradient-to-r from-red-500 via-red-400 to-gray-300 bg-clip-text text-transparent">
                {ticketStats.avgResolutionHours > 0 ? `${ticketStats.avgResolutionHours.toFixed(1)} hours` : 'N/A'}
              </div>
              <p className="text-gray-400 mt-3">Time from ticket creation to resolution</p>
            </div>
          </div>
        )}

        {/* Charts Section - Dark Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* SLA Compliance Chart */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl shadow-red-500/10 p-6 border border-red-500/20">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-red-600 to-red-800 rounded-xl border border-red-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">SLA Compliance</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={slaData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {slaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2 text-sm font-semibold text-gray-700">
              {ticketStats && ticketStats.total > 0 ? `${((1 - breaches.length / ticketStats.total) * 100).toFixed(1)}% compliance` : 'N/A'}
            </div>
          </div>
        </div>

          {/* Priority Distribution Chart */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl shadow-red-500/10 p-6 border border-red-500/20">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-red-600 to-red-800 rounded-xl border border-red-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Priority Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Breakdown (Tickets) */}
          {backendDeptData.length > 0 && (
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl shadow-red-500/10 p-6 border border-red-500/20 md:col-span-2">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/10 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-red-600 to-red-800 rounded-xl border border-red-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Ticket Department Breakdown</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={backendDeptData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#fff' }}
                      formatter={(value) => {
                        const pct = backendDeptTotal > 0 ? ((value / backendDeptTotal) * 100).toFixed(1) : '0.0'
                        return [`${value} (${pct}%)`, 'Tickets']
                      }}
                    />
                    <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dc2626" />
                        <stop offset="100%" stopColor="#991b1b" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* User Department Distribution */}
          {userDeptData.length > 0 && (
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl shadow-blue-500/10 p-6 border border-blue-500/30 md:col-span-2">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl border border-blue-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 7l3 12h12l3-12M6 10h12M9 13h6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">User Department Distribution</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={userDeptData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #3b82f6', borderRadius: '0.5rem', color: '#fff' }}
                      formatter={(value) => {
                        const pct = userDeptTotal > 0 ? ((value / userDeptTotal) * 100).toFixed(1) : '0.0'
                        return [`${value} (${pct}%)`, 'Users']
                      }}
                    />
                    <Bar dataKey="value" fill="url(#userDeptGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="userDeptGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1e3a8a" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* SLA Breaches - Dark Theme */}
        {breaches.length > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-br from-red-950 to-gray-900 rounded-2xl shadow-2xl shadow-red-500/20 p-6 mb-8 border-l-4 border-red-600">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-600/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-red-600 to-red-800 rounded-xl animate-pulse border border-red-500/30">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-red-400">⚠️ SLA Breaches ({breaches.length})</h3>
              </div>
              <div className="space-y-3">
                {breaches.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="group p-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl cursor-pointer hover:from-red-950 hover:to-gray-900 transition-all duration-300 transform hover:scale-102 hover:shadow-xl border border-red-500/30 hover:border-red-500/50"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-white group-hover:text-red-400 transition-colors">{ticket.title}</div>
                        <div className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Due: {new Date(ticket.dueAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {issueTypeBadge(ticket.issueType)}
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                    </div>
                  </div>
                ))}
                {breaches.length > 5 && (
                  <div className="text-sm font-medium text-gray-300 text-center pt-2 bg-gray-700/50 rounded-lg py-2">
                    + {breaches.length - 5} more breaches
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        {/* Recent Tickets - Dark Theme */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl shadow-red-500/10 p-6 border border-red-500/20">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-gradient-to-b from-red-600 to-red-800 rounded-full"></span>
            Recent Tickets
          </h3>
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg">No tickets found</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="group p-5 border border-red-500/20 rounded-xl hover:bg-gray-700/50 cursor-pointer transition-all duration-300 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-semibold text-white group-hover:text-red-400 transition-colors">{ticket.title}</div>
                      <div className="flex gap-2">
                        {issueTypeBadge(ticket.issueType)}
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Created by {ticket.creator?.name || 'Unknown'} •{' '}
                      {ticket.assignee ? `Assigned to ${ticket.assignee.name}` : 'Unassigned'}
                    </div>
                    {ticket.slaCategory && (
                      <div className="text-xs text-gray-500 mt-2 inline-flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        SLA: {ticket.slaCategory}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-red-500/20 mt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-red-500/20 disabled:hover:from-gray-700 disabled:hover:to-gray-800"
                >Previous</button>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="text-white font-medium">Page {page}</span>
                  <span>of</span>
                  <span className="text-white font-medium">{totalPages}</span>
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-red-500/20 disabled:hover:from-gray-700 disabled:hover:to-gray-800"
                >Next</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
