import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function TicketDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchTicket = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/tickets/${id}`)
      setTicket(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()
  }, [id])

  const postComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    try {
      await axios.post(`/tickets/${id}/comments`, { body: comment })
      setComment('')
      fetchTicket()
    } catch (err) {
      console.error(err)
      alert('Failed to post comment')
    }
  }

  const updateStatus = async (newStatus) => {
    setActionLoading(true)
    try {
      await axios.put(`/tickets/${id}/status`, { status: newStatus })
      fetchTicket()
    } catch (err) {
      console.error(err)
      alert('Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const updatePriority = async (newPriority) => {
    setActionLoading(true)
    try {
      await axios.put(`/tickets/${id}/priority`, { priority: newPriority })
      fetchTicket()
    } catch (err) {
      console.error(err)
      alert('Failed to update priority')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-red-100 text-red-600',
    }
    return colors[priority] || 'bg-gray-100 text-gray-600'
  }

  const canManageTicket = user && (user.role === 'it_staff' || user.role === 'manager')

  if (loading && !ticket) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg muted">Loading ticket...</div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="card text-center py-8">
        <div className="text-lg muted mb-4">Ticket not found</div>
        <button onClick={() => navigate(-1)} className="cta-primary">
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="text-sm muted hover:text-primary mb-2">
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-2">{ticket.title}</h1>
        <div className="flex items-center gap-3 text-sm muted">
          <span>Ticket #{ticket.id}</span>
          <span>•</span>
          <span>Created by {ticket.creator?.name || 'Unknown'}</span>
          <span>•</span>
          <span>{new Date(ticket.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Status and Priority Badges */}
      <div className="flex gap-3 mb-6">
        <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusBadge(ticket.status)}`}>
          {ticket.status.replace('_', ' ').toUpperCase()}
        </span>
        <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityBadge(ticket.priority)}`}>
          {ticket.priority.toUpperCase()} Priority
        </span>
        {ticket.slaCategory && (
          <span className="px-3 py-1 rounded text-sm bg-indigo-100 text-indigo-800">
            SLA: {ticket.slaCategory}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h3 className="font-semibold mb-3">Description</h3>
            <div className="text-gray-700 whitespace-pre-wrap">{ticket.description}</div>
          </div>

          {/* Comments */}
          <div className="card">
            <h3 className="font-semibold mb-4">Comments ({ticket.comments?.length || 0})</h3>
            {ticket.comments && ticket.comments.length === 0 && (
              <div className="text-center py-8 muted">No comments yet</div>
            )}
            <div className="space-y-4">
              {ticket.comments?.map((c) => (
                <div key={c.id} className="border-l-4 border-gray-200 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{c.author?.name || 'User'}</span>
                    <span className="text-sm muted">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-gray-700">{c.body}</div>
                </div>
              ))}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={postComment} className="mt-6 border-t pt-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
                placeholder="Add a comment..."
              />
              <div className="mt-3 flex justify-end">
                <button className="cta-primary" type="submit" disabled={!comment.trim()}>
                  Post Comment
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Metadata & Actions */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="card">
            <h3 className="font-semibold mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="muted">Status</div>
                <div className="font-medium">{ticket.status.replace('_', ' ')}</div>
              </div>
              <div>
                <div className="muted">Priority</div>
                <div className="font-medium">{ticket.priority}</div>
              </div>
              <div>
                <div className="muted">Assigned To</div>
                <div className="font-medium">{ticket.assignee?.name || 'Unassigned'}</div>
              </div>
              {ticket.department && (
                <div>
                  <div className="muted">Department</div>
                  <div className="font-medium">{ticket.department}</div>
                </div>
              )}
              {ticket.dueAt && (
                <div>
                  <div className="muted">Due Date</div>
                  <div className="font-medium">
                    {new Date(ticket.dueAt).toLocaleString()}
                  </div>
                </div>
              )}
              {ticket.closedAt && (
                <div>
                  <div className="muted">Closed At</div>
                  <div className="font-medium">
                    {new Date(ticket.closedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions Card (IT/Manager only) */}
          {canManageTicket && (
            <div className="card">
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm muted mb-1 block">Update Status</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={ticket.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm muted mb-1 block">Update Priority</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={ticket.priority}
                    onChange={(e) => updatePriority(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Card */}
          <div className="card">
            <h3 className="font-semibold mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <div>
                  <div className="font-medium">Created</div>
                  <div className="muted">{new Date(ticket.createdAt).toLocaleString()}</div>
                </div>
              </div>
              {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                  <div>
                    <div className="font-medium">Last Updated</div>
                    <div className="muted">{new Date(ticket.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {ticket.closedAt && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                  <div>
                    <div className="font-medium">Closed</div>
                    <div className="muted">{new Date(ticket.closedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

