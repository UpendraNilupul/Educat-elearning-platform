import { useState, useEffect } from 'react';
import api from '../api';

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

const convert12to24 = (time12h) => {
  if (!time12h) return '';
  const parts = time12h.split(' ');
  if (parts.length < 2) return time12h; // not 12-hour format or already 24-hour
  const [time, modifier] = parts;
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
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
    courseName: item.course_title || item.courseName || `Course ${item.c_id || item.course_id}`
  };
};

const VirtualClassroom = () => {
  // State for managing the modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  
  // State for holding the scheduled classes
  const [scheduledClasses, setScheduledClasses] = useState([]);

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseError, setCourseError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoadingCourses(true);
      setCourseError('');

      try {
        const teacherId = localStorage.getItem('userId');
      const courseEndpoint = teacherId ? `/courses?teacherId=${teacherId}` : '/courses';

      const [coursesRes, liveClassesRes] = await Promise.all([
          api.get(courseEndpoint),
          api.get('/teacher/liveclasses')
        ]);

        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
        setScheduledClasses(Array.isArray(liveClassesRes.data) ? liveClassesRes.data.map(normalizeLiveClass) : []);
      } catch (err) {
        console.error('Error loading live classes or courses:', err);
        setCourseError('Unable to load live classes or courses. Please refresh the page.');
      } finally {
        setLoadingCourses(false);
      }
    };

    loadData();
  }, []);

  const findCourseTitle = (courseId, fallback) => {
    const course = courses.find((item) => String(item.id) === String(courseId));
    return course ? course.title || course.name : fallback || 'Unknown Course';
  };

  const handleScheduleClick = () => {
    setEditingClass(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (cls) => {
    setEditingClass(cls);
    setIsModalOpen(true);
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheduled class?')) {
      return;
    }

    try {
      await api.delete(`/teacher/liveclasses/${id}`);
      setScheduledClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting live class:', err);
      window.alert('Unable to delete this class. Please try again.');
    }
  };

  const handleSaveClass = async (formData) => {
    const payload = {
      c_id: formData.course_id,
      title: formData.title,
      scheduled_date: formData.date,
      start_time: formData.time,
      duration_minutes: Number(formData.duration),
      meeting_link: formData.link,
      status: 'scheduled'
    };

    try {
      const response = editingClass
        ? await api.put(`/teacher/liveclasses/${editingClass.id}`, payload)
        : await api.post('/teacher/liveclasses', payload);

      const normalized = normalizeLiveClass(response.data);
      normalized.courseName = findCourseTitle(normalized.course_id, normalized.courseName);

      setScheduledClasses((prev) => {
        if (editingClass) {
          return prev.map((c) => (c.id === editingClass.id ? normalized : c));
        }
        return [normalized, ...prev];
      });
    } catch (err) {
      console.error('Error saving live class:', err);
      const errMsg = err.response?.data?.error || 'Unable to save the class. Please try again.';
      window.alert(errMsg);
    }
  };

  return (
    <div className="p-8 w-full bg-gray-50 min-h-screen">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Virtual Classroom</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your upcoming live sessions</p>
        </div>
        <button 
          onClick={handleScheduleClick}
          className="bg-purple-700 hover:bg-purple-800 text-white font-medium py-2.5 px-5 rounded-md transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Schedule Class
        </button>
      </div>

      {courseError && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3">
          {courseError}
        </div>
      )}

      {/* --- UPCOMING CLASSES GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scheduledClasses.length === 0 ? (
          <div className="col-span-full flex justify-center items-center p-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            No live classes scheduled yet.
          </div>
        ) : (
          scheduledClasses.map((cls) => (
            <div key={cls.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded w-max mb-3">
                {cls.courseName}
              </span>
              <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{cls.title}</h3>
              
              <div className="mt-auto pt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span role="img" aria-label="date">📅</span> {cls.scheduled_date}
                </div>
                <div className="flex items-center gap-2">
                  <span role="img" aria-label="time">⏰</span> {cls.time} ({cls.duration})
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                <a 
                  href={cls.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-purple-700 hover:bg-purple-800 text-white font-medium text-xs px-3.5 py-2 rounded-md transition-colors flex items-center gap-1 shadow-sm"
                >
                  Join Meeting
                </a>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEditClick(cls)}
                    className="text-purple-600 hover:text-purple-800 font-medium text-xs border border-purple-200 hover:bg-purple-50 px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClass(cls.id)}
                    className="text-red-500 hover:text-red-700 font-medium text-xs border border-red-100 hover:bg-red-50 px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- RENDER MODAL --- */}
      {isModalOpen && (
        <ScheduleModal 
          onClose={() => setIsModalOpen(false)} 
          editingClass={editingClass} 
          onSave={handleSaveClass}
          courses={courses}
          loadingCourses={loadingCourses}
        />
      )}
    </div>
  );
};

export default VirtualClassroom;

const ScheduleModal = ({ onClose, editingClass, onSave, courses, loadingCourses }) => {
  // Get today's local date (YYYY-MM-DD)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // State for the form inputs
  const [formData, setFormData] = useState({
    course_id: editingClass ? editingClass.course_id || editingClass.c_id || '' : '',
    title: editingClass ? editingClass.title : '',
    date: editingClass ? editingClass.scheduled_date || editingClass.date || '' : '',
    time: editingClass ? (editingClass.time.includes('AM') || editingClass.time.includes('PM') ? convert12to24(editingClass.time) : editingClass.time) : '',
    duration: editingClass ? (editingClass.duration || editingClass.duration_minutes || '60').toString().replace(' mins', '').replace(' min', '').trim() : '60',
    link: editingClass ? editingClass.link : ''
  });

  const [dateError, setDateError] = useState(() => {
    const initialDate = editingClass ? editingClass.scheduled_date || editingClass.date || '' : '';
    if (initialDate && initialDate < todayStr) {
      return 'Please select today or a future date.';
    }
    return '';
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'date') {
      if (value && value < todayStr) {
        setDateError('Please select today or a future date.');
      } else {
        setDateError('');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.date < todayStr) {
      setDateError('Please select today or a future date.');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {editingClass ? "Edit Live Class" : "Schedule Live Class"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
            <select 
              name="course_id" 
              value={formData.course_id} 
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              required
            >
              <option value="" disabled>-- Select a course --</option>
              {loadingCourses ? (
                <option value="" disabled>Loading your courses...</option>
              ) : courses.length === 0 ? (
                <option value="" disabled>No courses found</option>
              ) : (
                courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title || course.name || `Course ${course.id}`}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Topic Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Title</label>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Intro to Routing"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              required
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                name="date"
                min={todayStr}
                value={formData.date}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                  dateError ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {dateError && (
                <p className="text-red-500 text-xs mt-1 font-medium">{dateError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input 
                type="time" 
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Duration & Link Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <select 
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              >
                <option value="30">30 min</option>
                <option value="60">1 hr</option>
                <option value="90">1.5 hr</option>
                <option value="120">2 hr</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (Zoom/Meet)</label>
              <input 
                type="url" 
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://zoom.us/j/..."
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100 mt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!!dateError}
              className={`font-medium px-6 py-2 rounded-md transition-colors ${
                dateError 
                  ? 'bg-purple-300 text-white cursor-not-allowed' 
                  : 'bg-purple-700 hover:bg-purple-800 text-white'
              }`}
            >
              {editingClass ? "Save Changes" : "Save Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};