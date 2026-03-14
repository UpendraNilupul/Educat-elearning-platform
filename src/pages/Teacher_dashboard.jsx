import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  FolderTree,
  FileText,
  Award,
  Megaphone,
  Video,
  Users,
  Calendar,
  Play,
} from "lucide-react";
import DashboardHeaderTeacher from "../components/DashboardHeader"; // Your header component

const TeacherDashboard = ({ userName = "Teacher", onLogout }) => {
  const navItems = [
    { name: "Overview", icon: LayoutDashboard, active: true },
    { name: "Course Management", icon: BookOpen },
    { name: "Content Upload", icon: Upload },
    { name: "Course Structure", icon: FolderTree },
    { name: "Assessments", icon: FileText },
    { name: "Certification", icon: Award },
    { name: "Marketing", icon: Megaphone },
    { name: "Virtual Classroom", icon: Video },
  ];

  const courses = [
    {
      title: "Full Stack Web Development",
      students: 120,
      modules: 14,
      progress: 70,
    },
    {
      title: "UI/UX Design Masterclass",
      students: 85,
      modules: 10,
      progress: 45,
    },
  ];

  const classes = [
    {
      title: "React Live Session",
      course: "Full Stack Web Development",
      date: "Oct 25",
      time: "10:00 AM",
    },
    {
      title: "Figma Design Workshop",
      course: "UI/UX Design",
      date: "Oct 27",
      time: "2:00 PM",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-extrabold text-purple-700 tracking-wide">
            Educat Teacher
          </h2>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                item.active
                  ? "bg-purple-50 text-purple-700 font-semibold shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:shadow-sm"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-5 border-t bg-gray-50 rounded-tl-xl rounded-tr-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center font-bold text-purple-700 text-lg">
              {userName[0]}
            </div>
            <div>
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-xs text-gray-500">Teacher</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-red-500 text-sm hover:underline hover:text-red-600 font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10 flex flex-col gap-8">

        {/* Header */}
        <DashboardHeaderTeacher userName={userName} />

        {/* Welcome Section */}
        <div className="mb-8 mt-4">
          <h1 className="text-4xl font-extrabold text-gray-900 leading-snug">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-gray-500 mt-3 text-lg max-w-2xl">
            Manage courses, students, and live classes from your dashboard.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <div className="bg-white p-7 rounded-2xl shadow-lg flex items-center gap-5 hover:shadow-xl transition-shadow duration-300">
            <BookOpen className="text-purple-600 w-7 h-7" />
            <div>
              <p className="text-gray-400 text-sm">Courses Created</p>
              <h3 className="text-3xl font-bold">{courses.length}</h3>
            </div>
          </div>

          <div className="bg-white p-7 rounded-2xl shadow-lg flex items-center gap-5 hover:shadow-xl transition-shadow duration-300">
            <Users className="text-blue-600 w-7 h-7" />
            <div>
              <p className="text-gray-400 text-sm">Total Students</p>
              <h3 className="text-3xl font-bold">320</h3>
            </div>
          </div>

          <div className="bg-white p-7 rounded-2xl shadow-lg flex items-center gap-5 hover:shadow-xl transition-shadow duration-300">
            <FileText className="text-orange-500 w-7 h-7" />
            <div>
              <p className="text-gray-400 text-sm">Assessments to Review</p>
              <h3 className="text-3xl font-bold">8</h3>
            </div>
          </div>
        </div>

        {/* Upcoming Live Classes */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Upcoming Live Classes</h2>
          <div className="space-y-5">
            {classes.map((cls, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-md flex justify-between items-center hover:shadow-lg transition-shadow duration-300"
              >
                <div>
                  <h3 className="font-semibold text-lg">{cls.title}</h3>
                  <p className="text-sm text-gray-500">{cls.course}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {cls.date} • {cls.time}
                  </p>
                </div>
                <Calendar className="text-gray-400 w-6 h-6" />
              </div>
            ))}
          </div>
        </div>

        {/* My Courses */}
        <div>
          <h2 className="text-2xl font-bold mb-6">My Courses</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {courses.map((course, index) => (
              <div key={index} className="bg-white p-7 rounded-2xl shadow-md flex flex-col hover:shadow-lg transition-shadow duration-300">
                <h3 className="font-bold text-lg">{course.title}</h3>
                <p className="text-sm text-gray-500 mt-2">{course.students} Students</p>

                {/* Progress Bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 mt-6">
                  <button className="bg-gray-900 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors">
                    <Play size={16} /> View
                  </button>
                  <button className="border px-5 py-2 rounded-xl hover:bg-gray-100 transition-colors">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default TeacherDashboard;