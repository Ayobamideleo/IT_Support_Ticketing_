import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { DEPARTMENTS } from '../constants/departments';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';

export default function ManageAccounts() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ role: '', status: '', q: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: pagination.limit });
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, v);
      });
      const res = await axios.get(`/users?${params}`);
      setUsers(res.data.results || []);
      setPagination(prev => ({ ...prev, total: res.data.total || 0 }));
    } catch (err) {
      const baseMsg = err.response?.data?.message || 'Failed to load users';
      if (err.response?.data?.errors?.length) {
        const details = err.response.data.errors.map(e => `${e.path}: ${e.message}`).join('; ');
        setError(`${baseMsg} - ${details}`);
      } else {
        setError(baseMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/users/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/users', formData);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'employee', department: '' });
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await axios.put(`/users/${userId}/status`, { isVerified: !currentStatus });
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`/users/${userId}`);
      setShowDeleteModal(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleResendVerification = async (userId) => {
    try {
      await axios.post(`/users/${userId}/resend`);
      alert('Verification email sent successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Department', 'Last Login'];
    const rows = users.map(u => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      u.isVerified ? 'Active' : 'Inactive',
      u.department || 'N/A',
      u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : 'Never'
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const formatDate = (value) => {
    if (!value) return 'Never';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return 'Never';
    }
  };

  const handleStatCardClick = (statusValue) => {
    setFilters(prev => ({ ...prev, status: statusValue }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const pageBgStyle = {
    backgroundImage: `
      linear-gradient(135deg, rgba(16,185,129,0.14), rgba(14,165,233,0.14)),
      radial-gradient(circle at 18% 20%, rgba(16,185,129,0.20), transparent 38%),
      radial-gradient(circle at 82% 8%, rgba(14,165,233,0.24), transparent 34%)
    `
  };

  const rowStart = (pagination.page - 1) * pagination.limit;

  return (
    <div className="min-h-screen pb-12" style={pageBgStyle}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2"><BackButton fallback="/manager" /></div>
              <h1 className="text-3xl font-bold text-slate-900">Manage Accounts</h1>
              <p className="text-slate-600">Create, update, and govern access in one place.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Account
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded shadow-sm">
              {error}
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleStatCardClick('')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStatCardClick(''); }}
                className={`bg-white rounded-xl shadow-sm p-4 border ${filters.status === '' ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-slate-100'} cursor-pointer transition hover:shadow-md`}
              >
                <div className="text-sm text-slate-500">Total Users</div>
                <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleStatCardClick('active')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStatCardClick('active'); }}
                className={`bg-white rounded-xl shadow-sm p-4 border ${filters.status === 'active' ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-slate-100'} cursor-pointer transition hover:shadow-md`}
              >
                <div className="text-sm text-slate-500">Active</div>
                <div className="text-3xl font-bold text-emerald-600">{stats.active}</div>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleStatCardClick('inactive')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStatCardClick('inactive'); }}
                className={`bg-white rounded-xl shadow-sm p-4 border ${filters.status === 'inactive' ? 'border-amber-200 ring-2 ring-amber-100' : 'border-slate-100'} cursor-pointer transition hover:shadow-md`}
              >
                <div className="text-sm text-slate-500">Inactive</div>
                <div className="text-3xl font-bold text-amber-600">{stats.inactive}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
                <div className="text-sm text-slate-500">Verified %</div>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}%` : '0%'}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="employee">Employee</option>
                <option value="it_staff">IT Staff</option>
                <option value="manager">Manager</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={() => {
                  setFilters({ role: '', status: '', q: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-2 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No users found</td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rowStart + idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={u.id === user.id || user.role !== 'manager'}
                          className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="employee">Employee</option>
                          <option value="it_staff">IT Staff</option>
                          <option value="manager">Manager</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={u.isVerified}
                            onChange={() => handleStatusToggle(u.id, u.isVerified)}
                            disabled={u.id === user.id || (user.role === 'it_staff' && u.role === 'manager')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {u.isVerified ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        { (user.role === 'manager' || (user.role === 'it_staff' && u.role !== 'manager')) ? (
                          <select
                            defaultValue={u.department || ''}
                            onChange={async (e) => {
                              const newVal = e.target.value;
                              if ((u.department || '') === newVal) return; // no change
                              try {
                                await axios.put(`/users/${u.id}/department`, { department: newVal || null });
                                fetchUsers();
                              } catch (err) {
                                setError(err.response?.data?.message || 'Failed to update department');
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded w-40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">No Department</option>
                            {DEPARTMENTS.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        ) : (
                          <span>{u.department || 'N/A'}</span>
                        ) }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(u.lastLoginAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {!u.isVerified && (user.role === 'manager' || (user.role === 'it_staff' && u.role !== 'manager')) && (
                            <button
                              onClick={() => handleResendVerification(u.id)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                              title="Resend Verification"
                            >
                              Resend
                            </button>
                          )}
                          {u.id !== user.id && (user.role === 'manager' || (user.role === 'it_staff' && u.role !== 'manager')) && (
                            <button
                              onClick={() => setShowDeleteModal(u)}
                              className="text-red-600 hover:text-red-800 font-medium"
                              title="Delete User"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="text-sm text-slate-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 bg-white border border-slate-200 rounded">
                    Page {pagination.page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= totalPages}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Create New Account</h2>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="it_staff">IT Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department (Optional)</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', email: '', password: '', role: 'employee', department: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete <strong>{showDeleteModal.name}</strong> ({showDeleteModal.email})?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteUser(showDeleteModal.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
