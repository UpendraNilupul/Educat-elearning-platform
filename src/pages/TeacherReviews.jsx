import React, { useState, useEffect, useMemo } from 'react';
import { Star, MessageSquare, User, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import api from '../api';

const feedbackQuestions = [
  { id: 'q1', text: "1. How clear was the teacher's explanation during the class?" },
  { id: 'q2', text: "2. How engaging was the lesson?" },
  { id: 'q3', text: "3. Did the teacher answer students' questions effectively?" },
  { id: 'q4', text: "4. How useful were the class materials?" },
  { id: 'q5', text: "5. Would you recommend this class to other students?" },
  { id: 'q6', text: "6. How difficult was today's lesson?" },
  { id: 'q7', text: "7. How satisfied are you with the class overall?" },
  { id: 'q8', text: "8. Was the class conducted on time?" },
  { id: 'q9', text: "9. How confident do you feel about the topic after this class?" },
  { id: 'q10', text: "10. Which aspect of the class was the best?" }
];

const TeacherReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReview, setExpandedReview] = useState(null);
  const [selectedClass, setSelectedClass] = useState('All Classes');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const response = await api.get(`/teachers/${userId}/reviews`);
        if (response.data.success) {
          setReviews(response.data.reviews);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const uniqueClasses = useMemo(() => {
    const classes = new Set(reviews.map(r => r.course_name).filter(Boolean));
    return ['All Classes', ...Array.from(classes)];
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (selectedClass === 'All Classes') return reviews;
    return reviews.filter(r => r.course_name === selectedClass);
  }, [reviews, selectedClass]);

  const stats = useMemo(() => {
    if (filteredReviews.length === 0) return { average: 0, total: 0 };
    const totalRating = filteredReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
    return { average: (totalRating / filteredReviews.length).toFixed(1), total: filteredReviews.length };
  }, [filteredReviews]);

  const handleMarkAsRead = async (reviewId, isCurrentlyRead) => {
      if (isCurrentlyRead) return; // Do nothing if it's already read
      
      try {
          await api.put(`/reviews/${reviewId}/read`);
          // Update local state to instantly remove the bold styling
          setReviews(prevReviews => prevReviews.map(r => 
              r.id === reviewId ? { ...r, is_read: 1 } : r
          ));
      } catch (error) {
          console.error("Failed to mark as read", error);
      }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-purple-600 font-bold">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Reviews</h1>
          <p className="text-gray-500 mt-2">See what your students are saying about your classes.</p>
        </div>
        
        {/* Class Filter Dropdown */}
        <div className="relative min-w-[250px]">
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-purple-500 font-medium shadow-sm transition-colors cursor-pointer"
          >
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-yellow-50 rounded-xl">
            <Star className="text-yellow-500 w-8 h-8 fill-yellow-500" />
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Average Rating</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-gray-900">{stats.average}</h3>
              <span className="text-sm font-bold text-gray-500 mb-1">/ 5.0</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-purple-50 rounded-xl">
            <MessageSquare className="text-purple-600 w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Reviews</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Recent Feedback {selectedClass !== 'All Classes' && `for ${selectedClass}`}</h2>
        </div>
        
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="text-gray-300 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Reviews Yet</h3>
            <p className="text-sm text-gray-500 max-w-sm">When students leave feedback on your classes, it will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((review) => {
              let surveyResponses = review.survey_responses;
              if (typeof surveyResponses === 'string') {
                try { surveyResponses = JSON.parse(surveyResponses); } catch(e) {}
              }

              const isRead = !!review.is_read;

              return (
                <div key={review.id} className={`p-6 transition-colors ${isRead ? 'bg-white' : 'bg-purple-50/30'} hover:bg-gray-50`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${isRead ? 'bg-gray-100 text-gray-500' : 'bg-purple-200 text-purple-700'}`}>
                        {review.student_name ? review.student_name.charAt(0).toUpperCase() : <User size={20} />}
                      </div>
                      <div>
                        <h4 className={`text-sm ${isRead ? 'font-medium text-gray-700' : 'font-extrabold text-gray-900'}`}>{review.student_name || 'Anonymous Student'}</h4>
                        <p className={`text-xs ${isRead ? 'text-gray-500' : 'font-semibold text-purple-600'}`}>{review.course_name || 'Course'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={16} 
                          className={star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200"} 
                        />
                      ))}
                    </div>
                  </div>
                  <div className="ml-13 mt-2">
                    <h5 className={`text-sm mb-1 ${isRead ? 'text-gray-600 font-medium' : 'text-gray-900 font-bold'}`}>{review.title}</h5>
                    <p className={`text-sm ${isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{review.description}</p>
                    
                    {/* Survey Responses Section */}
                    {surveyResponses && Object.keys(surveyResponses).length > 0 && (
                      <div className="mt-4">
                        <button 
                          onClick={() => {
                              handleMarkAsRead(review.id, isRead);
                              setExpandedReview(expandedReview === review.id ? null : review.id);
                          }}
                          className={`flex items-center gap-2 text-sm font-bold transition-colors ${isRead ? 'text-purple-600 hover:text-purple-700' : 'text-purple-700 hover:text-purple-900'}`}
                        >
                          <ClipboardList size={16} />
                          {expandedReview === review.id ? 'Hide Survey Answers' : 'View Survey Answers'}
                          {expandedReview === review.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        {expandedReview === review.id && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                            {feedbackQuestions.map((q) => (
                              <div key={q.id} className="text-sm border-b border-gray-50 pb-2">
                                <p className="text-gray-500 mb-1 line-clamp-1" title={q.text}>{q.text}</p>
                                <p className="font-bold text-gray-900">{surveyResponses[q.id] || 'Not answered'}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherReviews;
