import React, { useState, useEffect } from "react";
import "./styles.css";

const mockTasks = [
  {
    id: "T001",
    title: "Schedule Maintenance for Truck A",
    description: "Oil change and tire rotation required.",
    status: "Pending",
    assignedTo: "John Doe",
    dueDate: "2024-01-10",
  },
  {
    id: "T002",
    title: "Assign Driver to Van B",
    description: "Driver needed for delivery route #12.",
    status: "In Progress",
    assignedTo: "Jane Smith",
    dueDate: "2024-01-12",
  },
  {
    id: "T003",
    title: "Inspect Car C",
    description: "Inspection for unusual engine noise.",
    status: "Completed",
    assignedTo: "Alex Brown",
    dueDate: "2024-01-05",
  },
];

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    // Simulate fetching tasks from an API
    const fetchTasks = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
      setTasks(mockTasks);
    };
    fetchTasks();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prevTask) => ({
      ...prevTask,
      [name]: value,
    }));
  };

  const addTask = () => {
    if (!newTask.title || !newTask.description || !newTask.assignedTo || !newTask.dueDate) {
      setError("Please fill in all fields.");
      return;
    }
    const newTaskData = {
      id: `T00${tasks.length + 1}`,
      ...newTask,
      status: "Pending",
    };
    setTasks((prevTasks) => [...prevTasks, newTaskData]);
    setNewTask({ title: "", description: "", assignedTo: "", dueDate: "" });
    setError("");
  };

  const updateTaskStatus = (id, newStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  return (
    <div className="task-manager-container">
      <h2>Task Manager</h2>
      <div className="task-input-container">
        <h3>Add New Task</h3>
        {error && <div className="error-message">{error}</div>}
        <input
          type="text"
          name="title"
          placeholder="Task Title"
          value={newTask.title}
          onChange={handleInputChange}
        />
        <textarea
          name="description"
          placeholder="Task Description"
          value={newTask.description}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="assignedTo"
          placeholder="Assigned To"
          value={newTask.assignedTo}
          onChange={handleInputChange}
        />
        <input
          type="date"
          name="dueDate"
          value={newTask.dueDate}
          onChange={handleInputChange}
        />
        <button onClick={addTask}>Add Task</button>
      </div>
      <div className="task-list">
        <h3>Task List</h3>
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <h4>{task.title}</h4>
            <p>{task.description}</p>
            <p>
              <strong>Assigned To:</strong> {task.assignedTo}
            </p>
            <p>
              <strong>Due Date:</strong> {new Date(task.dueDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Status:</strong> {task.status}
            </p>
            {task.status !== "Completed" && (
              <button
                onClick={() =>
                  updateTaskStatus(
                    task.id,
                    task.status === "Pending" ? "In Progress" : "Completed"
                  )
                }
              >
                Mark as {task.status === "Pending" ? "In Progress" : "Completed"}
              </button>
            )}
            <button onClick={() => deleteTask(task.id)} className="delete-button">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskManager;