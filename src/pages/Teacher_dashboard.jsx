// Force Vite HMR reload
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, FileText, Award, Megaphone, Video,
  Users, Calendar, Edit2, Menu, X, MessageSquare, Bell
} from "lucide-react";
import TeachersCourse from "./TeachersCourse";
import TeacherChat from "./Teacher_Chat";
import api from '../api'; // 🌟 THE FIX: Import the API instance


const TeacherDashboard = ({ userName = "Teacher", userPicture = "", onLogout }) => {
  const navigate = useNavigate();
  const teacherId = parseInt(localStorage.getItem('userId'));

  const [activeTab, setActiveTab] = useState("Overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const navItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Course Management", icon: BookOpen },
    { name: "Assessments", icon: FileText },
    { name: "Certification", icon: Award },
    { name: "Marketing", icon: Megaphone },
    { name: "Virtual Classroom", icon: Video },
  ];

  const [courses, setCourses] = useState([]);

  // Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const id = localStorage.getItem('userId');
        // 🌟 THE FIX: Use api.get() and let it handle the base URL
        const endpoint = id ? `/courses?teacherId=${id}` : '/courses';
        const response = await api.get(endpoint);
        const data = response.data;
        
        setCourses(data.map(course => ({
          ...course, students: course.students || 0, modules: course.modules || 0, progress: course.progress || 0, chapters: course.chapters || []
        })));
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);



  const classes = [
    { title: "React Live Session", course: "Full Stack Web Development", date: "Oct 25", time: "10:00 AM" },
    { title: "Figma Design Workshop", course: "UI/UX Design", date: "Oct 27", time: "2:00 PM" },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 font-sans relative overflow-hidden">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center justify-between px-4 z-40 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#4a0b59] tracking-wide">Educat</h2>
        <div className="flex items-center space-x-2">
          <button className="relative p-2 text-gray-400 hover:text-[#4a0b59] transition-colors">
            <Bell size={22} />
            <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button onClick={toggleSidebar} className="p-2 text-gray-600 hover:text-[#4a0b59]">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isSidebarOpen && <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-[#4a0b59] tracking-wide">Educat Teacher</h2>
          <button className="lg:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6" /></button>
        </div>

        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          {[
            { name: "Overview", icon: LayoutDashboard },
            { name: "Course Management", icon: BookOpen },
            { name: "Assessments", icon: FileText },
            { name: "Certification", icon: Award },
            { name: "Marketing", icon: Megaphone },
            { name: "Virtual Classroom", icon: Video },
            { name: "Messages", icon: MessageSquare },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveTab(item.name);
                setIsSidebarOpen(false);
              }}
              className={`flex items-center text-left gap-4 w-full px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.name
                  ? "bg-[#4a0b59] text-white font-semibold shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:shadow-sm"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-5 border-t bg-gray-50 rounded-tl-xl rounded-tr-xl mt-auto">
          <div className="flex items-center gap-3 mb-3">
            {userPicture ? (
              <img
                src={userPicture.startsWith('http') ? userPicture : `http://localhost:3000/uploads/profiles/${userPicture}`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-purple-100 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center font-bold text-purple-700 text-lg shrink-0">
                {userName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold truncate">{userName}</p>
                <button onClick={() => { navigate(`/teacher-profile-edit/${teacherId}`); setIsSidebarOpen(false); }} className="text-gray-400 hover:text-[#4a0b59] transition-colors p-1 shrink-0">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">Teacher</p>
            </div>
          </div>
          <button onClick={() => { if (onLogout) onLogout(); navigate('/'); }} className="text-red-500 text-sm text-left hover:text-red-600 font-medium transition-colors px-1">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 flex flex-col gap-8 mt-16 lg:mt-0">
        
        {activeTab === "Assessments" && (
          <div className="animate-in fade-in duration-500">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
              <p className="text-gray-500 mt-2">Manage assignments and quizzes across your courses.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter(course => {
                let hasAssessment = false;
                course.chapters?.forEach(ch => {
                  if ((ch.assignments?.length > 0) || (ch.quizzes?.length > 0)) {
                    hasAssessment = true;
                  }
                });
                return hasAssessment;
              }).map(course => {
                let assignCount = 0;
                let quizCount = 0;
                course.chapters?.forEach(ch => {
                  assignCount += (ch.assignments?.length || 0);
                  quizCount += (ch.quizzes?.length || 0);
                });

                return (
                  <div key={course.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col group">
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors uppercase tracking-tight">{course.title}</h3>
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">COURSE ID: {course.id}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{course.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                       <div className="bg-purple-50 p-3 rounded-xl border border-purple-100/50">
                          <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Assignments</p>
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-purple-600" />
                            <span className="text-lg font-black text-purple-900">{assignCount}</span>
                          </div>
                       </div>
                       <div className="bg-blue-50 p-3 rounded-xl border border-blue-100/50">
                          <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Quizzes</p>
                          <div className="flex items-center gap-2">
                            <Award size={16} className="text-blue-600" />
                            <span className="text-lg font-black text-blue-900">{quizCount}</span>
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedCourse(course);
                        setActiveTab("Course Management");
                      }}
                      className="mt-auto w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-md group-hover:translate-x-1"
                    >
                      Manage Assessments
                    </button>
                  </div>
                );
              })}

              {courses.filter(course => {
                let hasAssessment = false;
                course.chapters?.forEach(ch => {
                  if ((ch.assignments?.length > 0) || (ch.quizzes?.length > 0)) hasAssessment = true;
                });
                return hasAssessment;
              }).length === 0 && (
                <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="text-gray-300 w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No Assessments Found</h3>
                  <p className="text-xs text-gray-500 max-w-xs">You haven't created any assignments or quizzes yet. Go to Course Management to get started.</p>
                  <button 
                    onClick={() => {
                      setSelectedCourse(null);
                      setActiveTab("Course Management");
                    }}
                    className="mt-6 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-md"
                  >
                    Go to Course Management
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Overview" && (
          <div className="animate-in fade-in duration-500 flex flex-col gap-8">
            {/* Welcome Section */}
            <div className="mt-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-snug">
                Welcome back, {userName} 👋
              </h1>
              <p className="text-gray-500 mt-2 text-base lg:text-lg max-w-2xl">
                Manage courses, students, and live classes from your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="bg-white p-6 lg:p-7 rounded-2xl shadow-lg flex items-center gap-5 hover:shadow-xl transition-shadow duration-300">
                <div className="p-3 bg-purple-50 rounded-xl"><BookOpen className="text-purple-600 w-6 h-6" /></div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Courses</p>
                  <h3 className="text-2xl lg:text-3xl font-bold">{courses.length}</h3>
                </div>
              </div>

              <div className="bg-white p-6 lg:p-7 rounded-2xl shadow-lg flex items-center gap-5 hover:shadow-xl transition-shadow duration-300">
                <div className="p-3 bg-blue-50 rounded-xl"><Users className="text-blue-600 w-6 h-6" /></div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Students</p>
                  <h3 className="text-2xl lg:text-3xl font-bold">320</h3>
                </div>
              </div>

              <div className="bg-white p-6 lg:p-7 rounded-2xl shadow-lg flex items-center gap-5 hover:shadow-xl transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
                <div className="p-3 bg-orange-50 rounded-xl"><FileText className="text-orange-500 w-6 h-6" /></div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Reviews</p>
                  <h3 className="text-2xl lg:text-3xl font-bold">8</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl lg:text-2xl font-bold">Live Classes</h2>
                  <button className="text-sm text-purple-600 font-semibold hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {classes.map((cls, index) => (
                    <div key={index} className="bg-white p-5 rounded-2xl shadow-md flex justify-between items-center hover:shadow-lg transition-shadow duration-300 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-purple-50 transition-colors">
                          <Video className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{cls.title}</h3>
                          <p className="text-xs text-gray-500">{cls.course}</p>
                          <p className="text-xs text-purple-600 mt-1 font-medium">{cls.date} • {cls.time}</p>
                        </div>
                      </div>
                      <Calendar className="text-gray-300 w-5 h-5" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-6">Recent Courses</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.slice(0, 3).map((course) => (
                    <div key={course.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{course.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 mb-4">{course.students} Students enrolled</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "Course Management" && (
          <TeachersCourse 
            courses={courses} 
            setCourses={setCourses} 
            selectedCourse={selectedCourse} 
            setSelectedCourse={setSelectedCourse} 
          />
        )}
        
        {activeTab === "Messages" && <TeacherChat />}
      </main>
    </div>
  );
};

export default TeacherDashboard;