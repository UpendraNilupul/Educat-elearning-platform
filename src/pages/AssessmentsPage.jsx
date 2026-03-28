import React, { useState } from 'react';

const AssessmentsPage = () => {
  const [activeTab, setActiveTab] = useState('pending');

  const pendingAssessments = [
    {
      id: 1,
      title: 'Algebra Mid-Term',
      subject: 'Mathematics',
      dueDate: 'Oct 28, 2026',
      timeLimit: '45 mins',
      type: 'Quiz',
    },
    {
      id: 2,
      title: 'Chemistry Basics',
      subject: 'Science',
      dueDate: 'Nov 02, 2026',
      timeLimit: '60 mins',
      type: 'Assignment',
    },
  ];

  const completedAssessments = [
    {
      id: 1,
      title: 'Physics Lab 1',
      subject: 'Science',
      completedDate: 'Oct 15, 2026',
      score: '85/100',
      status: 'Passed',
    },
    {
      id: 2,
      title: 'English Essay',
      subject: 'Humanities',
      completedDate: 'Oct 10, 2026',
      score: '92/100',
      status: 'Passed',
    },
  ];

  return (
    <div className="p-8 w-full min-h-screen bg-gray-50">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Assessments</h1>
        <p className="text-gray-600 mt-2">
          Track your pending tasks and completed quizzes
        </p>
      </header>

      {/* Tabs UI */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2 mr-6 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'pending'
              ? 'border-b-2 border-purple-600 text-purple-700 font-semibold'
              : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
          }`}
        >
          Pending Assessments
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2 mr-6 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'completed'
              ? 'border-b-2 border-purple-600 text-purple-700 font-semibold'
              : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {activeTab === 'pending' ? (
          pendingAssessments.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                  {item.subject}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-3">
                  {item.title}
                </h3>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Due: {item.dueDate}</p>
                  <p>Time Limit: {item.timeLimit}</p>
                </div>
              </div>
              <button className="w-full bg-purple-600 text-white py-2 rounded-lg mt-4 hover:bg-purple-700 transition">
                Start Assessment
              </button>
            </div>
          ))
        ) : (
          completedAssessments.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                  {item.subject}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-3">
                  {item.title}
                </h3>
                <div className="mt-4">
                  <p className="text-2xl font-extrabold text-green-600">
                    {item.score}
                  </p>
                </div>
              </div>
              <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg mt-4 hover:bg-gray-200 transition">
                Review Answers
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssessmentsPage;
