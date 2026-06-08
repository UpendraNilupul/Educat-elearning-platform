import { useState, useEffect } from 'react';

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

const VirtualClassroom = () => {
  // State for managing the modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  
  // State for holding the scheduled classes
  const [scheduledClasses, setScheduledClasses] = useState([]);

  // Fetch classes when component mounts
  useEffect(() => {
    // TODO: Replace this mock data with an actual axios.get() to your Express backend
    // Example: axios.get('/api/virtual-classes/teacher/1').then(res => setScheduledClasses(res.data))
    
    const mockData = [
      {
        id: 1,
        title: "Introduction to React Hooks",
        courseName: "Full-Stack Web Development",
        date: "2026-06-12",
        time: "10:00 AM",
        duration: "60 mins",
        link: "https://zoom.us/j/123456789"
      },
      {
        id: 2,
        title: "Database Indexing Strategies",
        courseName: "Advanced Data Science",
        date: "2026-06-15",
        time: "02:30 PM",
        duration: "90 mins",
        link: "https://meet.google.com/abc-defg-hij"
      }
    ];
    setScheduledClasses(mockData);
  }, []);

  const handleScheduleClick = () => {
    setEditingClass(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (cls) => {
    setEditingClass(cls);
    setIsModalOpen(true);
  };

  const handleDeleteClass = (id) => {
    if (window.confirm("Are you sure you want to delete this scheduled class?")) {
      setScheduledClasses(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSaveClass = (formData) => {
    const courseMap = {
      '1': 'Full-Stack Web Development',
      '2': 'Advanced Data Science'
    };
    const courseName = courseMap[formData.course_id] || 'Other Course';
    
    // Format time to 12-hour format for presentation
    const timeFormatted = formData.time.includes('AM') || formData.time.includes('PM') 
      ? formData.time 
      : convert24to12(formData.time);

    // Format duration
    const durationFormatted = formData.duration.includes('min') 
      ? formData.duration 
      : `${formData.duration} mins`;

    const updatedData = {
      ...formData,
      time: timeFormatted,
      duration: durationFormatted,
      courseName
    };

    if (editingClass) {
      // Editing
      setScheduledClasses(prev =>
        prev.map(c =>
          c.id === editingClass.id
            ? { ...c, ...updatedData }
            : c
        )
      );
    } else {
      // Creating new
      const newClass = {
        id: Date.now(),
        ...updatedData
      };
      setScheduledClasses(prev => [...prev, newClass]);
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
                  <span role="img" aria-label="date">📅</span> {cls.date}
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
        />
      )}
    </div>
  );
};

export default VirtualClassroom;

const ScheduleModal = ({ onClose, editingClass, onSave }) => {
  // State for the form inputs
  const [formData, setFormData] = useState({
    course_id: editingClass ? (editingClass.course_id || (editingClass.courseName === 'Full-Stack Web Development' ? '1' : '2')) : '',
    title: editingClass ? editingClass.title : '',
    date: editingClass ? editingClass.date : '',
    time: editingClass ? (editingClass.time.includes('AM') || editingClass.time.includes('PM') ? convert12to24(editingClass.time) : editingClass.time) : '',
    duration: editingClass ? (editingClass.duration.replace(' mins', '').replace(' min', '').trim()) : '60',
    link: editingClass ? editingClass.link : ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
              {/* Replace with dynamic courses from database */}
              <option value="1">Full-Stack Web Development</option>
              <option value="2">Advanced Data Science</option>
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
                value={formData.date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                required
              />
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
              className="bg-purple-700 hover:bg-purple-800 text-white font-medium px-6 py-2 rounded-md transition-colors"
            >
              {editingClass ? "Save Changes" : "Save Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};