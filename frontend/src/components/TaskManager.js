import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTaskStatus, deleteTask, allocateTasks } from '../services/api';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    if (!newTask.title) {
      setError('Task title is required.');
      return;
    }

    try {
      setError('');
      setMessage('');
      const res = await createTask(newTask);
      if (res && res.task) {
        setTasks((prev) => [...prev, res.task]);
        setMessage(`Task "${res.task.title}" created successfully!`);
      } else {
        // Local fallback
        const mockTask = {
          id: Date.now(),
          task_code: `T-${tasks.length + 1001}`,
          ...newTask,
          status: 'Pending',
        };
        setTasks((prev) => [...prev, mockTask]);
        setMessage('Task created locally.');
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
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'Pending' ? 'In Progress' : 'Completed';
    try {
      await updateTaskStatus(taskId, nextStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      );
      setMessage(`Task status updated to ${nextStatus}.`);
    } catch (err) {
      // Local fallback update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      );
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setMessage('Task deleted.');
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const handleAutoAllocate = async () => {
    try {
      setAllocating(true);
      setError('');
      setMessage('');
      const res = await allocateTasks({});
      if (res && res.allocation) {
        setMessage(`Auto-allocated ${res.allocation.length} task(s) to optimal fleet vehicles.`);
        await loadTasks();
      }
    } catch (err) {
      setError(`Auto-allocation error: ${err.message}`);
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="task-manager-view">
      <div className="view-header">
        <div>
          <h2>Logistics Task Allocation</h2>
          <p>Create, track, and automatically allocate dispatch orders based on vehicle battery, proximity, and urgency.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={loadTasks}>
            ↻ Refresh Tasks
          </button>
          <button
            className="btn btn-accent"
            onClick={handleAutoAllocate}
            disabled={allocating}
          >
            {allocating ? 'Optimizing Allocation...' : '⚡ Auto-Allocate Tasks'}
          </button>
        </div>
      </div>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      {/* Task Creation Form */}
      <div className="form-card">
        <h3 style={{ marginBottom: '14px', color: '#0f172a' }}>Create New Dispatch Task</h3>
        <form onSubmit={handleAddTask}>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Task Title *</label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Express Delivery to South Hub"
                value={newTask.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Priority Level</label>
              <select
                name="priority"
                value={newTask.priority}
                onChange={handleInputChange}
              >
                <option value="1">1 - Low Urgency</option>
                <option value="2">2 - Standard Logistics</option>
                <option value="3">3 - Critical Priority</option>
              </select>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={newTask.dueDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Target Latitude</label>
              <input
                type="number"
                step="0.0001"
                name="latitude"
                value={newTask.latitude}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Target Longitude</label>
              <input
                type="number"
                step="0.0001"
                name="longitude"
                value={newTask.longitude}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Task Description / Cargo Notes</label>
            <textarea
              name="description"
              rows="2"
              placeholder="Package dimensions, temperature requirements, delivery instructions..."
              value={newTask.description}
              onChange={handleInputChange}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            + Add Task to Queue
          </button>
        </form>
      </div>

      {/* Task Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Task Code</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Assigned Vehicle</th>
              <th>Assigned Driver / Contact</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && tasks.length === 0 ? (
              <tr>
                <td colSpan="8" className="loading">Loading task manifest...</td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>
                  No tasks currently queued.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td><strong>{task.task_code || `T-${task.id}`}</strong></td>
                  <td>
                    <strong>{task.title}</strong>
                    {task.description && (
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        backgroundColor:
                          task.priority === 3 ? '#fee2e2' : task.priority === 2 ? '#fef3c7' : '#e0f2fe',
                        color:
                          task.priority === 3 ? '#991b1b' : task.priority === 2 ? '#92400e' : '#075985',
                      }}
                    >
                      {task.priority === 3 ? 'Critical' : task.priority === 2 ? 'Medium' : 'Standard'}
                    </span>
                  </td>
                  <td>
                    {task.assigned_vehicle_code ? (
                      <span className="badge badge-in-use">
                        🚗 {task.assigned_vehicle_code}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Unassigned</span>
                    )}
                  </td>
                  <td>{task.assigned_to || 'Unassigned'}</td>
                  <td>{task.due_date || 'N/A'}</td>
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
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          onClick={() => handleStatusChange(task.id, task.status)}
                        >
                          {task.status === 'Pending' ? 'Start' : 'Complete'}
                        </button>
                      )}
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
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
