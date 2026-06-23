import React, { useState, useEffect } from 'react';
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
  const [stats, setStats] = useState({ average: 0, total: 0 });
  const [expandedReview, setExpandedReview] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const response = await api.get(`/teachers/${userId}/reviews`);
        if (response.data.success) {
          const fetchedReviews = response.data.reviews;
          setReviews(fetchedReviews);
          
          if (fetchedReviews.length > 0) {
            const totalRating = fetchedReviews.reduce((sum, review) => sum + Number(review.rating), 0);
            setStats({
              average: (totalRating / fetchedReviews.length).toFixed(1),
              total: fetchedReviews.length
            });
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-purple-600 font-bold">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Reviews</h1>
        <p className="text-gray-500 mt-2">See what your students are saying about your classes.</p>
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
          <h2 className="text-xl font-bold text-gray-800">Recent Feedback</h2>
        </div>
        
        {reviews.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="text-gray-300 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Reviews Yet</h3>
            <p className="text-sm text-gray-500 max-w-sm">When students leave feedback on your classes, it will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => {
              let surveyResponses = review.survey_responses;
              if (typeof surveyResponses === 'string') {
                try { surveyResponses = JSON.parse(surveyResponses); } catch(e) {}
              }

              return (
                <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold shrink-0">
                        {review.student_name ? review.student_name.charAt(0).toUpperCase() : <User size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{review.student_name || 'Anonymous Student'}</h4>
                        <p className="text-xs text-purple-600 font-semibold">{review.course_name || 'Course'}</p>
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
                    <h5 className="font-bold text-gray-800 text-sm mb-1">{review.title}</h5>
                    <p className="text-gray-600 text-sm">{review.description}</p>
                    
                    {/* Survey Responses Section */}
                    {surveyResponses && Object.keys(surveyResponses).length > 0 && (
                      <div className="mt-4">
                        <button 
                          onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                          className="flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors"
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
