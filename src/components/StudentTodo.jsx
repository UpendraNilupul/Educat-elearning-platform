import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Trash2, Plus, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

const StudentTodo = ({ userId = 1 }) => {
    const [todos, setTodos] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
        : 'http://localhost:3000';

    const fetchTodos = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/student/${userId}/todos`);
            const data = await response.json();
            setTodos(data);
        } catch (error) {
            console.error('Error fetching todos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTodos();
    }, [userId]);

    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        if (dueDate) {
            const parts = dueDate.split('-');
            const inputYear = parseInt(parts[0], 10);
            if (parts[0].length > 4 || inputYear > 2100) {
                alert("Please select a valid year (up to 2100).");
                return;
            }
        }

        setIsAdding(true);
        try {
            const response = await fetch(`${API_BASE}/api/student/${userId}/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: newTask, due_date: dueDate || null }),
            });
            if (response.ok) {
                setNewTask('');
                setDueDate('');
                fetchTodos();
            }
        } catch (error) {
            console.error('Error adding todo:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            const response = await fetch(`${API_BASE}/api/student/todos/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_completed: !currentStatus }),
            });
            if (response.ok) {
                setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
            }
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${API_BASE}/api/student/todos/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setTodos(todos.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-950">My To-Do List</h2>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    {todos.filter(t => !t.is_completed).length} Pending
                </span>
            </div>

            {/* Add Todo Form */}
            <form onSubmit={handleAddTodo} className="flex flex-col gap-3 mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="What needs to be done?"
                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all text-sm"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <input
                        type="date"
                        className="w-full pl-4 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-xs text-gray-600"
                        value={dueDate}
                        max="2100-12-31"
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                    <button type="submit" className="bg-purple-600 text-white px-5 py-2 rounded-xl hover:bg-purple-700 transition-colors font-bold text-sm flex items-center justify-center gap-1 shadow-md whitespace-nowrap min-w-[100px] cursor-pointer">
                        <Plus className="w-4 h-4" /> Add Task
                    </button>
                </div>
            </form>

            {/* Todo List */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center h-20 text-gray-400 text-sm italic">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tasks...
                    </div>
                ) : todos.length > 0 ? (
                    todos.map((todo) => (
                        <div
                            key={todo.id}
                            className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all ${todo.is_completed ? 'bg-gray-50/50 border-gray-100 opacity-75' : 'bg-white border-gray-100 hover:border-purple-100 hover:shadow-sm'
                                }`}
                        >
                            <button
                                onClick={() => handleToggle(todo.id, todo.is_completed)}
                                className={`mt-0.5 transition-colors ${todo.is_completed ? 'text-green-500' : 'text-gray-300 hover:text-purple-400'}`}
                            >
                                {todo.is_completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium transition-all ${todo.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                    {todo.task}
                                </p>
                                {todo.due_date && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <CalendarIcon className="w-3 h-3 text-gray-400" />
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${new Date(todo.due_date) < new Date() && !todo.is_completed ? 'text-red-400' : 'text-gray-400'
                                            }`}>
                                            {new Date(todo.due_date).toLocaleDateString(undefined, { Month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => handleDelete(todo.id)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                        <p className="text-gray-400 text-sm italic">All caught up!</p>
                        <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">Add a task to get started.</p>
                    </div>
                )}
            </div>

            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default StudentTodo;
