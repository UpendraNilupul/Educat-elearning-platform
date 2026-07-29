import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon, Video, Clock, ChevronRight, X, Trash2 } from 'lucide-react';

const StudentCalendar = ({ studentId = 1 }) => {
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [clickedDate, setClickedDate] = useState(null);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/student/${studentId}/calendar`);
            const data = await response.json();
            setEvents(data);
        } catch (error) {
            console.error('Error fetching calendar events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [studentId]);

    const handleDayClick = (value) => {
        setClickedDate(value);
        setDate(value);
        setIsModalOpen(true);
    };

    const handleSaveEvent = async () => {
        if (!newTaskTitle.trim()) return;

        const dateObj = new Date(clickedDate);
        dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
        const formattedDate = dateObj.toISOString().split('T')[0];

        try {
            const res = await fetch(`http://localhost:3000/api/student/${studentId}/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: newTaskTitle, due_date: formattedDate }),
            });
            
            if (!res.ok) throw new Error('Failed to save event');

            setIsModalOpen(false);
            setNewTaskTitle('');
            
            // Instantly refresh the calendar UI
            const calendarRes = await fetch(`http://localhost:3000/api/student/${studentId}/calendar`);
            const newData = await calendarRes.json();
            setEvents(newData);
            
        } catch (error) {
            console.error('Error saving calendar event:', error);
        }
    };

    const getEventsForDate = (calendarDate) => {
        if (!events || events.length === 0) return [];
        
        return events.filter(event => {
            const eventDate = new Date(event.scheduled_date);
            return eventDate.getDate() === calendarDate.getDate() &&
                   eventDate.getMonth() === calendarDate.getMonth() &&
                   eventDate.getFullYear() === calendarDate.getFullYear();
        });
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        
        try {
            const response = await fetch(`http://localhost:3000/api/student/todos/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                fetchEvents();
            }
        } catch (error) {
            console.error('Error deleting calendar event:', error);
        }
    };

    // Function to show dots on days with events
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dayEvents = getEventsForDate(date);
            if (dayEvents.length > 0) {
                return (
                    <div className="flex justify-center mt-1">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                    </div>
                );
            }
        }
        return null;
    };

    // Filter events for the selected day
    const selectedDayEvents = getEventsForDate(date);

    return (
        <div className="flex flex-col lg:flex-row gap-8 mb-10">
            {/* Left Column: Calendar Component */}
            <div className="lg:w-1/2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-50 rounded-xl">
                            <CalendarIcon className="w-6 h-6 text-brand-purple" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Class Calendar</h2>
                    </div>
                </div>
                
                <div className="flex justify-center student-calendar-container flex-1 items-center">
                    <Calendar 
                        onChange={setDate} 
                        value={date} 
                        tileContent={tileContent}
                        onClickDay={handleDayClick}
                        className="border-none shadow-none font-sans"
                    />
                </div>
            </div>

            {/* Right Column: Events & To-Do List */}
            <div className="lg:w-1/2 flex flex-col gap-6">
                {/* Top Item: Events Grey Card */}
                <div className="flex-1 min-h-[500px] bg-gray-50/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200/50">
                        <h3 className="font-bold text-gray-900">
                            Events for {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </h3>
                        {selectedDayEvents.length > 0 && (
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'Event' : 'Events'}
                            </span>
                        )}
                    </div>

                    <div className="space-y-4 pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-20 text-gray-400 text-sm italic">
                                Loading schedule...
                            </div>
                        ) : selectedDayEvents.length > 0 ? (
                            selectedDayEvents.map((event, index) => (
                                <div key={event.id || index} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            {event.type === 'class' ? (
                                                <>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`w-2 h-2 rounded-full bg-${event.theme_color || 'purple'}-500`}></span>
                                                        <h4 className="font-bold text-gray-900 line-clamp-1">{event.course_title}</h4>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium ml-4">{event.event_title}</p>
                                                    
                                                    <div className="flex items-center gap-4 mt-3 ml-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                                {event.start_time?.substring(0, 5)}
                                                            </span>
                                                        </div>
                                                        {event.meeting_link && (
                                                            <a 
                                                                href={event.meeting_link} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 text-brand-purple hover:underline"
                                                            >
                                                                <Video className="w-3.5 h-3.5" />
                                                                <span className="text-[11px] font-bold uppercase tracking-wider">Join Class</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </>
                                            ) : event.type === 'assignment' || event.type === 'quiz' ? (
                                                <>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`w-2 h-2 rounded-full bg-${event.theme_color || 'purple'}-500`}></span>
                                                        <h4 className="font-bold text-gray-900 line-clamp-1">{event.course_title}</h4>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium ml-4">{event.event_title}</p>
                                                    <div className="flex items-center gap-2 ml-4 mt-1">
                                                        <span className={`text-[10px] font-bold ${event.type === 'assignment' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'} px-2 py-0.5 rounded-md uppercase tracking-wider`}>
                                                            {event.type === 'assignment' ? 'Assignment Due' : 'Quiz Scheduled'}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`w-2 h-2 rounded-full ${event.is_completed ? 'bg-gray-400' : 'bg-orange-500'}`}></span>
                                                        <h4 className={`font-bold text-gray-900 line-clamp-1 ${event.is_completed ? 'line-through text-gray-400' : ''}`}>
                                                            {event.event_title}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4 mt-1">
                                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                            Personal Task
                                                        </span>
                                                        {event.is_completed && (
                                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {event.type === 'class' || event.type === 'assignment' || event.type === 'quiz' ? (
                                            <div className="p-2 rounded-lg bg-white border border-gray-100 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleDeleteEvent(event.id)}
                                                className="p-2 rounded-lg bg-red-50 text-red-500 border border-red-100 self-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-center">
                                <p className="text-gray-400 text-sm italic">No events scheduled for this day.</p>
                                <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">Enjoy your break!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx="true">{`
                .react-calendar {
                    width: 100%;
                    max-width: 400px;
                    border: none;
                    font-family: inherit;
                }
                .react-calendar__navigation button {
                    color: #4a0b59;
                    font-weight: 700;
                    font-size: 1.1rem;
                }
                .react-calendar__navigation button:enabled:hover,
                .react-calendar__navigation button:enabled:focus {
                    background-color: #f3e8f5;
                    border-radius: 12px;
                }
                .react-calendar__month-view__weekdays {
                    text-transform: uppercase;
                    font-weight: 800;
                    font-size: 0.65rem;
                    color: #9ca3af;
                }
                .react-calendar__tile {
                    color: #4b5563;
                    font-weight: 600;
                    padding: 0.75em 0.5em;
                    border-radius: 12px;
                }
                .react-calendar__tile--now {
                    background: #f3e8f5 !important;
                    color: #4a0b59 !important;
                }
                .react-calendar__tile--active {
                    background: #4a0b59 !important;
                    color: white !important;
                    box-shadow: 0 4px 12px rgba(74, 11, 89, 0.3);
                }
                .react-calendar__tile:enabled:hover,
                .react-calendar__tile:enabled:focus {
                    background-color: #f9fafb;
                    border-radius: 12px;
                }
                .react-calendar__tile--hasActive {
                    background: #4a0b59 !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f9fafb;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
            {/* New Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-[500px] rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">New event</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Event title <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    autoFocus
                                    placeholder="What's happening?"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-purple outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                                <div className="w-full px-5 py-4 bg-gray-100 border border-transparent rounded-2xl text-gray-600 font-bold flex items-center gap-3">
                                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                                    {clickedDate?.toLocaleDateString(undefined, { 
                                        weekday: 'short', 
                                        month: 'long', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 bg-gray-50 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveEvent}
                                disabled={!newTaskTitle.trim()}
                                className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentCalendar;
