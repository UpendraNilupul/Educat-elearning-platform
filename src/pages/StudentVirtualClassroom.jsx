import React, { useState, useEffect } from 'react';
import api from '../api';
import { Video, Calendar, Clock, VideoOff, User, ExternalLink, Loader2 } from 'lucide-react';

// Time formatting helpers
const convert24to12 = (time24h) => {
  if (!time24h) return '';
  const [hoursStr, minutes] = time24h.split(':');
  let hours = parseInt(hoursStr, 10);
  const modifier = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${String(hours).padStart(2, '0')}:${minutes} ${modifier}`;
};

const normalizeLiveClass = (item) => {
  if (!item) return {};
  
  // Safely format date to YYYY-MM-DD
  let dateStr = '';
  if (item.scheduled_date) {
    const d = new Date(item.scheduled_date);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else {
      dateStr = String(item.scheduled_date).substring(0, 10);
    }
  }

  // Safely format duration
  const dur = item.duration_minutes || item.duration || 60;
  const durationStr = dur >= 60 ? `${dur / 60} hr` : `${dur} min`;

  // Start time: convert 24h format to 12h format for display
  let timeStr = item.start_time || item.time || '';
  if (timeStr && !timeStr.includes('AM') && !timeStr.includes('PM')) {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      timeStr = `${parts[0]}:${parts[1]}`;
    }
    timeStr = convert24to12(timeStr);
  }

  return {
    id: item.id,
    course_id: item.c_id || item.course_id,
    title: item.title,
    scheduled_date: dateStr,
    time: timeStr,
    duration: durationStr,
    duration_minutes: dur,
    link: item.meeting_link || item.link || '',
    courseName: item.course_title || item.courseName || `Course ${item.c_id || item.course_id}`,
    theme_color: item.theme_color || 'purple',
    teacher_name: item.teacher_name || 'Instructor'
  };
};

const getColorScheme = (color) => {
  const schemes = {
    purple: {
      bg: 'bg-purple-50 text-purple-700 border-purple-100',
      badge: 'bg-purple-50 text-purple-700',
      button: 'bg-purple-700 hover:bg-purple-800 text-white focus:ring-purple-500 shadow-purple-100',
      icon: 'text-purple-600'
    },
    orange: {
      bg: 'bg-orange-50 text-orange-700 border-orange-100',
      badge: 'bg-orange-50 text-orange-700',
      button: 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500 shadow-orange-100',
      icon: 'text-orange-600'
    },
    blue: {
      bg: 'bg-blue-50 text-blue-700 border-blue-100',
      badge: 'bg-blue-50 text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-blue-100',
      icon: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50 text-green-700 border-green-100',
      badge: 'bg-green-50 text-green-700',
      button: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-green-100',
      icon: 'text-green-600'
    },
    red: {
      bg: 'bg-red-50 text-red-700 border-red-100',
      badge: 'bg-red-50 text-red-700',
      button: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-red-100',
      icon: 'text-red-600'
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      badge: 'bg-indigo-50 text-indigo-700',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 shadow-indigo-100',
      icon: 'text-indigo-600'
    }
  };
  return schemes[color] || schemes.purple;
};

const StudentVirtualClassroom = () => {
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLiveClasses = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/student/liveclasses');
        if (Array.isArray(response.data)) {
          setScheduledClasses(response.data.map(normalizeLiveClass));
        } else {
          setScheduledClasses([]);
        }
      } catch (err) {
        console.error('Error loading student live classes:', err);
        setError('Unable to load live classes. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveClasses();
  }, []);

  return (
    <div className="w-full bg-gray-50 min-h-screen pt-6">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Virtual Classroom</h1>
          <p className="text-gray-500 text-sm mt-1">View and join your upcoming live sessions scheduled by your teachers</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-purple bg-purple-50 px-3 py-1.5 rounded-full w-fit">
          <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse"></span>
          Live Classes Portal
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-6 py-4 font-medium shadow-sm animate-in fade-in">
          {error}
        </div>
      )}

      {/* --- LOADING STATE --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin text-brand-purple mb-4" />
          <p className="text-sm font-semibold tracking-wider uppercase">Loading scheduled classes...</p>
        </div>
      ) : scheduledClasses.length === 0 ? (
        /* --- EMPTY STATE --- */
        <div className="bg-white rounded-3xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-5 bg-purple-50 rounded-full mb-6">
            <VideoOff className="w-10 h-10 text-brand-purple" />
          </div>
          <h3 className="text-gray-950 font-black text-2xl">No upcoming live classes</h3>
          <p className="text-gray-500 text-base mt-2 max-w-md">
            You don't have any scheduled live sessions at the moment. Keep an eye on this space or check your calendar for updates!
          </p>
        </div>
      ) : (
        /* --- CLASSES GRID --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {scheduledClasses.map((cls) => {
            const colors = getColorScheme(cls.theme_color);
            return (
              <div 
                key={cls.id} 
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider ${colors.badge}`}>
                    {cls.courseName}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400 font-bold bg-gray-50 px-2.5 py-1.5 rounded-xl">
                    <User className="w-3.5 h-3.5" />
                    <span>{cls.teacher_name}</span>
                  </div>
                </div>

                <h3 className="font-extrabold text-xl text-gray-950 mb-4 line-clamp-2 group-hover:text-brand-purple transition-colors">
                  {cls.title}
                </h3>
                
                <div className="space-y-3 pt-2 pb-6 text-sm text-gray-600 border-t border-gray-50 mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-800">{cls.scheduled_date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-800">
                      {cls.time} <span className="text-gray-400 font-bold ml-1">({cls.duration})</span>
                    </span>
                  </div>
                </div>

                <a 
                  href={cls.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`w-full mt-4 font-bold py-3.5 px-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-md active:scale-[0.98] ${colors.button}`}
                >
                  <Video className="w-4 h-4" />
                  Join Meeting
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentVirtualClassroom;
