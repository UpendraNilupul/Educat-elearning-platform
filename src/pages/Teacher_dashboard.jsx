import React, { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Award,
  Megaphone,
  Video,
  Users,
  Calendar
} from "lucide-react";
import DashboardHeaderTeacher from "../components/DashboardHeader"; // Your header component
import TeachersCourse from "./TeachersCourse";

const TeacherDashboard = ({ userName = "Teacher", onLogout }) => {
  const [activeTab, setActiveTab] = useState("Overview");

  const navItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Course Management", icon: BookOpen },
    { name: "Assessments", icon: FileText },
    { name: "Certification", icon: Award },
    { name: "Marketing", icon: Megaphone },
    { name: "Virtual Classroom", icon: Video },
  ];

  const [courses, setCourses] = useState([
    {
      id: 1,
      title: "Full Stack Web Development",
      students: 120,
      modules: 14,
      progress: 70,
      chapters: [
        {
          id: 101,
          title: "Chapter 1: Introduction to Web Dev",
          isVisible: true,
          resources: [
            { id: 1001, title: "Course Syllabus", type: "pdf", url: "#" },
            { id: 1002, title: "Intro Video Link", type: "link", url: "https://youtube.com" }
          ]
        },
        {
          id: 102,
          title: "Chapter 2: HTML & CSS Basics",
          isVisible: true,
          resources: [
            { id: 1003, title: "HTML Cheat Sheet", type: "pdf", url: "#" }
          ]
        }
      ]
    },
    {
      id: 2,
      title: "UI/UX Design Masterclass",
      students: 85,
      modules: 10,
      progress: 45,
      chapters: []
    },
  ]);

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
              onClick={() => {
                setActiveTab(item.name);
              }}
              className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.name
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

        {activeTab === "Overview" && (
          <div className="animate-in fade-in duration-500 flex flex-col gap-8">
            {/* Welcome Section */}
            <div className="mt-4">
              <h1 className="text-4xl font-extrabold text-gray-900 leading-snug">
                Welcome back, {userName} 👋
              </h1>
              <p className="text-gray-500 mt-3 text-lg max-w-2xl">
                Manage courses, students, and live classes from your dashboard.
              </p>
            </div>

            {/* Stats Section */}
            <div className="grid md:grid-cols-3 gap-8">
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
            <div>
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

            {/* Recent Courses (Overview) */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Recent Courses</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4">{course.students} Students enrolled</p>
                    <div className="mt-auto">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "Course Management" && (
          <TeachersCourse courses={courses} setCourses={setCourses} />
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;