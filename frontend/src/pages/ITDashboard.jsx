import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from '../api/axios'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import SLAIndicator from '../components/SLAIndicator'
import FilterBar from '../components/FilterBar'

export default function ITDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentTab, setCurrentTab] = useState('all')
  const [filters, setFilters] = useState({ q: '', status: '', issueType: '', department: '' })
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 })
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const fetchTickets = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      })
      const res = await axios.get(`/tickets?${params}`)
      setTickets(res.data.results || [])
      setPagination(prev => ({ ...prev, total: res.data.total || 0 }))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [pagination.page, filters, currentTab])

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
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const assignToMe = async (ticketId) => {
    try {
      await axios.put(`/tickets/${ticketId}/assign`, { assignedTo: user.id })
      fetchTickets()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign')
    }
  }

  const updateStatus = async (ticketId, status) => {
    try {
      await axios.put(`/tickets/${ticketId}/status`, { status })
      fetchTickets()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status')
    }
  }

  const updatePriority = async (ticketId, priority) => {
    try {
      await axios.put(`/tickets/${ticketId}/priority`, { priority })
      fetchTickets()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update priority')
    }
  }

  const displayTickets = currentTab === 'mine' 
    ? tickets.filter(t => t.assignedTo === user.id)
    : tickets

  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const rowStart = (pagination.page - 1) * pagination.limit

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">IT Staff Menu</p>
                  <p className="text-gray-300 text-xs">Quick Actions & Tools</p>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="relative p-3 space-y-1 bg-gradient-to-b from-gray-900 to-black">
              <Link
                to="/it/accounts"
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
                  <p className="font-semibold text-white group-hover:text-red-400 transition-colors">User Accounts</p>
                  <p className="text-xs text-gray-400 mt-0.5">Manage employee accounts</p>
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
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-transparent to-red-600/20 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-red-500/20 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-red-400 to-gray-300 bg-clip-text text-transparent mb-2">IT Staff Dashboard</h1>
                <p className="text-gray-400">Welcome {user?.name}. Assign and manage tickets below.</p>
              </div>
              <button 
                onClick={fetchTickets}
                className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 flex items-center gap-2 shadow-lg border border-gray-600/30 transition-all duration-300 hover:scale-105"
                title="Refresh tickets"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-600 text-red-400 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

      <div className="mb-6 flex gap-2">
        <button 
          onClick={() => setCurrentTab('all')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${currentTab === 'all' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20' : 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-300 hover:from-gray-700 hover:to-gray-800 border border-red-500/20'}`}
        >
          All Tickets
        </button>
        <button 
          onClick={() => setCurrentTab('mine')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${currentTab === 'mine' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20' : 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-300 hover:from-gray-700 hover:to-gray-800 border border-red-500/20'}`}
        >
          My Assigned Tickets
        </button>
      </div>

      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-x-auto border border-red-500/20">
            <table className="min-w-full divide-y divide-red-500/20">
              <thead className="bg-gradient-to-r from-red-950 to-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">No.</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">SLA</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-br from-gray-900 to-black divide-y divide-red-500/10">
                {displayTickets.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-gray-400">No tickets found</td>
                  </tr>
                ) : (
                  displayTickets.map((ticket, idx) => (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-gradient-to-r hover:from-red-950/30 hover:to-gray-800/30 cursor-pointer transition-all duration-300 border-b border-red-500/5"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-400">{rowStart + idx + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-200 max-w-xs truncate">{ticket.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {ticket.creator?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {ticket.assignee?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SLAIndicator dueDate={ticket.dueAt} status={ticket.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-2">
                          {ticket.assignedTo !== user.id && (
                            <button 
                              onClick={() => assignToMe(ticket.id)}
                              className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 text-xs font-semibold shadow-lg shadow-red-500/20 transition-all duration-300"
                            >
                              Assign to me
                            </button>
                          )}
                          <select 
                            value={ticket.status} 
                            onChange={(e) => updateStatus(ticket.id, e.target.value)}
                            className="px-2 py-1 bg-gray-800 border border-red-500/30 rounded-lg text-xs text-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="open">Open</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          <select 
                            value={ticket.priority} 
                            onChange={(e) => updatePriority(ticket.id, e.target.value)}
                            className="px-2 py-1 bg-gray-800 border border-red-500/30 rounded-lg text-xs text-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 rounded-xl hover:from-red-600 hover:to-red-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-red-500/20"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 rounded-xl text-gray-300 font-semibold">
                  Page {pagination.page} of {totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= totalPages}
                  className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 rounded-xl hover:from-red-600 hover:to-red-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-red-500/20"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}
