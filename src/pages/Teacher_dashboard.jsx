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
  // Sidebar navigation items
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

  // Sample courses
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

  // Sample upcoming classes
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
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-purple-700">Educat Teacher</h2>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm transition ${
                item.active
                  ? "bg-purple-50 text-purple-700 font-semibold"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center font-bold text-purple-700">
              {userName[0]}
            </div>
            <div>
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-gray-500">Teacher</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-red-500 text-sm hover:underline"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 flex flex-col">

        {/* Header */}
        <DashboardHeaderTeacher userName={userName} />

        {/* Welcome Section */}
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-gray-500 mt-2">
            Manage courses, students, and live classes from your dashboard.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
            <BookOpen className="text-purple-600 w-6 h-6" />
            <div>
              <p className="text-gray-400 text-sm">Courses Created</p>
              <h3 className="text-2xl font-bold">{courses.length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
            <Users className="text-blue-600 w-6 h-6" />
            <div>
              <p className="text-gray-400 text-sm">Total Students</p>
              <h3 className="text-2xl font-bold">320</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
            <FileText className="text-orange-500 w-6 h-6" />
            <div>
              <p className="text-gray-400 text-sm">Assessments to Review</p>
              <h3 className="text-2xl font-bold">8</h3>
            </div>
          </div>
        </div>

        {/* Upcoming Live Classes */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">Upcoming Live Classes</h2>
          <div className="space-y-4">
            {classes.map((cls, index) => (
              <div
                key={index}
                className="bg-white p-5 rounded-xl shadow flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">{cls.title}</h3>
                  <p className="text-sm text-gray-500">{cls.course}</p>
                  <p className="text-xs text-gray-400">
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
          <h2 className="text-xl font-bold mb-6">My Courses</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow flex flex-col">
                <h3 className="font-bold text-lg">{course.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{course.students} Students</p>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-5">
                  <button className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Play size={16} /> View
                  </button>
                  <button className="border px-4 py-2 rounded-lg">Edit</button>
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