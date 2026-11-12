import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTaskStatus, deleteTask, allocateTasks } from '../services/api';

const TaskManager = ({ showToast }) => {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 2,
    latitude: 28.6139,
    longitude: 77.2090,
    assignedTo: '',
    dueDate: '2026-11-20',
  });

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await getTasks();
      if (res && res.tasks) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.warn('Backend unavailable, using initial demo tasks:', err.message);
      setTasks([
        { id: 1, task_code: 'T-1001', title: 'Express Parcel Delivery to Sector 18', priority: 3, status: 'In Progress', assigned_vehicle_code: 'V102', assigned_to: 'Jane Smith', due_date: '2026-11-15' },
        { id: 2, task_code: 'T-1002', title: 'Warehouse Bulk Restock', priority: 2, status: 'Pending', assigned_vehicle_code: null, assigned_to: 'Unassigned', due_date: '2026-11-16' },
        { id: 3, task_code: 'T-1003', title: 'Customer Hardware Return Pickup', priority: 1, status: 'Pending', assigned_vehicle_code: null, assigned_to: 'Unassigned', due_date: '2026-11-17' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      const res = await createTask(newTask);
      if (res && res.task) {
        setTasks((prev) => [...prev, res.task]);
        if (showToast) showToast(`Task "${res.task.title}" queued for dispatch.`);
      } else {
        const mockTask = {
          id: Date.now(),
          task_code: `T-${tasks.length + 1001}`,
          ...newTask,
          status: 'Pending',
        };
        setTasks((prev) => [...prev, mockTask]);
        if (showToast) showToast('Task registered locally.');
      }
      setNewTask({
        title: '',
        description: '',
        priority: 2,
        latitude: 28.6139,
        longitude: 77.2090,
        assignedTo: '',
        dueDate: '2026-11-20',
      });
      setShowAddForm(false);
    } catch (err) {
      if (showToast) showToast(`Error: ${err.message}`);
    }
  };

  const handleStatusChange = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'Pending' ? 'In Progress' : 'Completed';
    try {
      await updateTaskStatus(taskId, nextStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      );
      if (showToast) showToast(`Task updated to ${nextStatus}.`);
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      );
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (showToast) showToast('Task removed from dispatch queue.');
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const handleAutoAllocate = async () => {
    try {
      setAllocating(true);
      const res = await allocateTasks({});
      if (res && res.allocation) {
        if (showToast) {
          showToast(`Algorithmically assigned ${res.allocation.length} order(s) to optimal vehicles.`);
        }
        await loadTasks();
      }
    } catch (err) {
      if (showToast) showToast(`Allocation Error: ${err.message}`);
    } finally {
      setAllocating(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.task_code && t.task_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.assigned_to && t.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="task-manager-view">
      <div className="view-header">
        <div>
          <h2>Logistics Task Dispatch</h2>
          <p>Order manifest, intelligent route pairing, and algorithmic task allocation.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Close Form' : '+ New Task'}
          </button>
          <button
            className="btn btn-accent"
            onClick={handleAutoAllocate}
            disabled={allocating}
          >
            {allocating ? 'Optimizing Fleet...' : '⚡ Auto-Allocate Tasks'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="apple-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Pending', 'In Progress', 'Completed'].map((tab) => (
            <button
              key={tab}
              className={`btn ${statusFilter === tab ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.84rem' }}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search orders, code, or driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 34px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-secondary)',
              fontSize: '0.88rem',
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '8px', color: '#86868b' }}>
            🔍
          </span>
        </div>
      </div>

      {/* Slide-down New Task Form */}
      {showAddForm && (
        <div className="form-card" style={{ animation: 'dynamicIslandIn 0.3s ease' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>New Dispatch Order</h3>
          <form onSubmit={handleAddTask}>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Task Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Critical Medical Delivery to Central Hospital"
                  value={newTask.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Priority Tier</label>
                <select name="priority" value={newTask.priority} onChange={handleInputChange}>
                  <option value="1">1 - Standard Logistics</option>
                  <option value="2">2 - High Urgency</option>
                  <option value="3">3 - Critical Emergency</option>
                </select>
              </div>

              <div className="form-group">
                <label>Delivery Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={newTask.dueDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Destination Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  name="latitude"
                  value={newTask.latitude}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Destination Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  name="longitude"
                  value={newTask.longitude}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label>Cargo Specifications & Instructions</label>
              <textarea
                name="description"
                rows="2"
                placeholder="Cargo weight, temperature requirements, delivery contact..."
                value={newTask.description}
                onChange={handleInputChange}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Confirm & Add to Dispatch Manifest
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Manifest Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Destination & Details</th>
              <th>Priority</th>
              <th>Assigned Unit</th>
              <th>Assigned Driver</th>
              <th>Target Window</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && tasks.length === 0 ? (
              <tr>
                <td colSpan="8" className="loading">Retrieving logistics manifest...</td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#86868b' }}>
                  No orders match current criteria.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--apple-blue)' }}>
                      {task.task_code || `T-${task.id}`}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: '600',
                        fontSize: '0.78rem',
                        backgroundColor:
                          task.priority === 3 ? 'var(--apple-red-light)' : task.priority === 2 ? 'var(--apple-orange-light)' : 'var(--apple-blue-light)',
                        color:
                          task.priority === 3 ? 'var(--apple-red)' : task.priority === 2 ? 'var(--apple-orange)' : 'var(--apple-blue)',
                      }}
                    >
                      {task.priority === 3 ? '● Critical' : task.priority === 2 ? '● Medium' : '● Standard'}
                    </span>
                  </td>
                  <td>
                    {task.assigned_vehicle_code ? (
                      <span className="badge badge-in-use">
                        🚚 {task.assigned_vehicle_code}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.86rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.9rem' }}>{task.assigned_to || 'Unassigned'}</td>
                  <td style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>{task.due_date || 'N/A'}</td>
                  <td>
                    <span className={`badge badge-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {task.status !== 'Completed' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleStatusChange(task.id, task.status)}
                        >
                          {task.status === 'Pending' ? 'Start' : 'Done'}
                        </button>
                      )}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.78rem', color: 'var(--apple-red)' }}
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskManager;
