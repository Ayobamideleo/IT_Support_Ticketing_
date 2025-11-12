import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { useAuth } from '../context/AuthContext'
import BackButton from '../components/BackButton'

function formatDate(d){
  if(!d) return ''
  try { return new Date(d).toLocaleString() } catch(e){ return d }
}

export default function EmployeeDashboard(){
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [issueType, setIssueType] = useState('software')

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/tickets/my')
      setTickets(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets')
    } finally { setLoading(false) }
  }

  useEffect(()=>{ fetchTickets() }, [])

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

  const handleCreate = async (e) => {
    e.preventDefault(); setError('')
    try{
      await axios.post('/tickets', { title, description, issueType })
      setTitle(''); setDescription(''); setIssueType('software')
      fetchTickets()
    }catch(err){ setError(err.response?.data?.message || 'Failed to create ticket') }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const issueTypeBadge = (type) => {
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
    return <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${t.color}`}>{t.label}</span>
  }

  const priorityBadge = (p) => {
    if(p==='high') return <span className="badge badge-high">HIGH</span>
    if(p==='low') return <span className="badge badge-low">LOW</span>
    return <span className="badge badge-medium">MEDIUM</span>
  }

  const statusBadge = (s) => {
    if(!s || s==='open') return <span className="status-open">Open</span>
    if(s==='in_progress') return <span className="status-in_progress">In progress</span>
    if(s==='resolved') return <span className="status-resolved">Resolved</span>
    return <span className="status-open">{s}</span>
  }

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Employee Menu</p>
                  <p className="text-gray-300 text-xs">Your Quick Actions</p>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="relative p-3 bg-gradient-to-b from-gray-900 to-black">
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
            <div className="mb-2"><BackButton fallback="/welcome" /></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-red-400 to-gray-300 bg-clip-text text-transparent mb-2">Employee Dashboard</h1>
            <p className="text-gray-400">Welcome {user?.name}! Submit and track your support requests.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-red-500/20">
          <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">Create new ticket</h3>
          <p className="text-gray-400 text-sm mb-4">Describe the issue clearly so IT can help faster.</p>
          {error && <div className="bg-red-950 border border-red-600 text-red-400 px-3 py-2 rounded-lg mb-3 text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <input 
              className="w-full p-3 rounded-xl bg-gray-900 border border-red-500/20 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" 
              placeholder="Title" 
              value={title} 
              onChange={e=>setTitle(e.target.value)} 
              required 
            />
            <textarea 
              className="w-full p-3 rounded-xl bg-gray-900 border border-red-500/20 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" 
              placeholder="Description" 
              value={description} 
              onChange={e=>setDescription(e.target.value)} 
              rows={5} 
            />
            <div>
              <label className="block text-gray-400 text-sm mb-2">Issue Type</label>
              <select 
                className="w-full p-3 rounded-xl bg-gray-900 border border-red-500/20 text-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" 
                value={issueType} 
                onChange={e=>setIssueType(e.target.value)}
              >
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="networking">Networking</option>
                <option value="access_control">Access Control</option>
                <option value="email">Email</option>
                <option value="printer">Printer</option>
                <option value="phone">Phone</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg shadow-red-500/20">Create ticket</button>
          </form>
        </div>

        <div className="col-span-2">
          <div className="mb-6 flex items-center justify-between bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-red-500/20">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">My tickets</h3>
            <div className="text-gray-400 text-sm">{loading ? 'Refreshing...' : `${tickets.length} tickets`}</div>
          </div>

          <div className="space-y-4">
            {tickets.length===0 && !loading && <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-center text-gray-400 border border-red-500/20">You have no tickets yet. Create one on the left.</div>}
            {tickets.map(t => (
              <div key={t.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-300 border border-red-500/20 hover:border-red-500/40">
                <div className="flex items-start justify-between gap-4">
                  <div style={{flex:1}}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xl font-bold text-gray-200">{t.title}</div>
                      <div>{statusBadge(t.status)}</div>
                    </div>
                    {t.issueType && (
                      <div className="mb-3">{issueTypeBadge(t.issueType)}</div>
                    )}
                    <div className="text-gray-400 mt-3">{t.description}</div>
                    <div className="text-sm text-gray-500 mt-4 flex items-center gap-2">
                      <span>Created: {formatDate(t.createdAt)}</span>
                      <span className="mx-2 text-red-500/50">•</span>
                      <span>Assignee: {t.assignee?.name || (t.assignedTo || '—')}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <a 
                      href={`/tickets/${t.id}`} 
                      className="inline-block px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg shadow-red-500/20"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
