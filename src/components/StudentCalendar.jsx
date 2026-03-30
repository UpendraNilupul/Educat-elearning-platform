import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon, Video, Clock, ChevronRight } from 'lucide-react';

const StudentCalendar = ({ studentId = 1 }) => {
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Using studentId prop
                const response = await fetch(`http://localhost:3000/api/student/${studentId}/calendar`);
                const data = await response.json();
                setEvents(data);
            } catch (error) {
                console.error('Error fetching calendar events:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [studentId]);

    // Function to show dots on days with events
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = date.toISOString().split('T')[0];
            const hasEvent = events.some(event => event.scheduled_date === dateStr);
            if (hasEvent) {
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
    const selectedDateStr = date.toISOString().split('T')[0];
    const selectedDayEvents = events.filter(event => event.scheduled_date === selectedDateStr);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 rounded-xl">
                        <CalendarIcon className="w-6 h-6 text-brand-purple" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Class Calendar</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Calendar Section */}
                <div className="flex justify-center student-calendar-container">
                    <Calendar 
                        onChange={setDate} 
                        value={date} 
                        tileContent={tileContent}
                        className="border-none shadow-none font-sans"
                    />
                </div>

                {/* Event Details Section */}
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                        <h3 className="font-bold text-gray-900">
                            Events for {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </h3>
                        {selectedDayEvents.length > 0 && (
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'Class' : 'Classes'}
                            </span>
                        )}
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-20 text-gray-400 text-sm italic">
                                Loading schedule...
                            </div>
                        ) : selectedDayEvents.length > 0 ? (
                            selectedDayEvents.map((event) => (
                                <div key={event.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-2 h-2 rounded-full bg-${event.theme_color || 'purple'}-500`}></span>
                                                <h4 className="font-bold text-gray-900 line-clamp-1">{event.course_title}</h4>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium ml-4">{event.event_title}</p>
                                            
                                            <div className="flex items-center gap-4 mt-3 ml-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                        {event.start_time.substring(0, 5)}
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
                                        </div>
                                        <div className="p-2 rounded-lg bg-white border border-gray-100 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-center">
                                <p className="text-gray-400 text-sm italic">No classes scheduled for this day.</p>
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
        </div>
    );
};

export default StudentCalendar;
