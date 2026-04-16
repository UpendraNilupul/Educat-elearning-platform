import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  FolderTree,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  File,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Edit2,
  Eye,
  EyeOff,
  ClipboardList,
  Calendar as CalendarIcon
} from "lucide-react";
import api from '../api'; // 🌟 THE FIX: Import your Axios instance

const TeachersCourse = ({ courses, setCourses, selectedCourse, setSelectedCourse }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({ 
    name: "",
    title: "", 
    type: "Class",
    status: "not_active",
    is_published: false,
    theme_color: "purple",
    thumbnail_url: "",
    students: 0, 
    modules: 0, 
    progress: 0 
  });

  const [expandedChapters, setExpandedChapters] = useState([]);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [resourceData, setResourceData] = useState({ title: "", type: "pdf", url: "", file: null, isVisible: true });

  const [expandedLessons, setExpandedLessons] = useState([]);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState("");

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [assignmentData, setAssignmentData] = useState({ 
    title: "", 
    description: "", 
    deadline: "", 
    publish_at: "",
    max_marks: 100, 
    files: [], 
    existingAttachments: []
  });
  const [assignmentErrors, setAssignmentErrors] = useState({});
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  React.useEffect(() => {
    if (!isAssignmentModalOpen) {
      setAssignmentErrors({});
      return;
    }
    const errors = {};
    const now = new Date();
    if (assignmentData.deadline) {
      const deadline = new Date(assignmentData.deadline);
      if (deadline <= now) {
        errors.deadline = "Deadline must be in the future";
      }
    }
    if (assignmentData.publish_at && assignmentData.publish_at.trim() !== "") {
      const publishAt = new Date(assignmentData.publish_at);
      if (publishAt <= now) {
        errors.publish_at = "Publish date must be in the future";
      }
      if (assignmentData.deadline) {
        const deadline = new Date(assignmentData.deadline);
        if (publishAt >= deadline) {
          errors.publish_at = "Publish date must be before deadline";
        }
      }
    }

    // Require at least one file for new assignments, or ensure at least one exists for edits
    const hasNewFiles = assignmentData.files && assignmentData.files.length > 0;
    const hasExistingFiles = assignmentData.existingAttachments && assignmentData.existingAttachments.length > 0;
    
    if (!hasNewFiles && !hasExistingFiles) {
        errors.files = "At least one attachment is required";
    }

    setAssignmentErrors(errors);
  }, [assignmentData.deadline, assignmentData.publish_at, assignmentData.files, assignmentData.existingAttachments, isAssignmentModalOpen]);
  
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [quizData, setQuizData] = useState({
    number: 1,
    time_limit: "00:30:00",
    publish_at: "",
    questions: []
  });

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setExpandedChapters([]);
  };

  const handleBackToDashboard = () => {
    setSelectedCourse(null);
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => 
      prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]
    );
  };

  const toggleLesson = (lessonId) => {
    setExpandedLessons(prev => 
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    );
  };

  const submitChapter = async (e) => {
    e.preventDefault();
    if (!chapterTitle.trim()) return;

    try {
      if (editingChapterId) {
        await api.put(`/modules/${editingChapterId}`, { title: chapterTitle });

        setCourses(courses.map(course => {
          if (course.id === selectedCourse.id) {
            const updatedChapters = (course.chapters || []).map(c => 
              c.id === editingChapterId ? { ...c, title: chapterTitle } : c
            );
            const updatedCourse = { ...course, chapters: updatedChapters };
            setSelectedCourse(updatedCourse);
            return updatedCourse;
          }
          return course;
        }));
      } else {
        const response = await api.post('/modules', { 
            title: chapterTitle, 
            c_id: selectedCourse.id, 
            isVisible: true 
        });
        const newChap = response.data;

        setCourses(courses.map(course => {
          if (course.id === selectedCourse.id) {
            const updatedChapters = [...(course.chapters || []), newChap];
            const updatedCourse = { 
                ...course, 
                chapters: updatedChapters, 
                modules: updatedChapters.length 
            };
            setSelectedCourse(updatedCourse);
            setExpandedChapters([...expandedChapters, newChap.id]);
            return updatedCourse;
          }
          return course;
        }));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving chapter');
    }

    setChapterTitle("");
    setEditingChapterId(null);
    setIsChapterModalOpen(false);
  };

  const submitLesson = async (e) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;

    try {
      if (editingLessonId) {
        await api.put(`/lessons/${editingLessonId}`, { title: lessonTitle });

        setCourses(courses.map(course => {
          if (course.id === selectedCourse.id) {
            const updatedChapters = (course.chapters || []).map(c => 
              c.id === activeModuleId ? { 
                ...c, 
                lessons: (c.lessons || []).map(l => l.id === editingLessonId ? { ...l, title: lessonTitle } : l)
              } : c
            );
            const updatedCourse = { ...course, chapters: updatedChapters };
            setSelectedCourse(updatedCourse);
            return updatedCourse;
          }
          return course;
        }));
      } else {
        const response = await api.post(`/modules/${activeModuleId}/lessons`, { title: lessonTitle });
        const newLesson = response.data;

        setCourses(courses.map(course => {
          if (course.id === selectedCourse.id) {
            const updatedChapters = (course.chapters || []).map(c => 
              c.id === activeModuleId ? { ...c, lessons: [...(c.lessons || []), newLesson] } : c
            );
            const updatedCourse = { ...course, chapters: updatedChapters };
            setSelectedCourse(updatedCourse);
            setExpandedLessons([...expandedLessons, newLesson.id]);
            return updatedCourse;
          }
          return course;
        }));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving lesson');
    }

    setLessonTitle("");
    setActiveModuleId(null);
    setEditingLessonId(null);
    setIsLessonModalOpen(false);
  };

  const submitResource = async (e) => {
    e.preventDefault();
    if (!resourceData.title.trim()) return;

    try {
      if (editingResourceId) {
        await api.put(`/resources/${editingResourceId}`, { 
          title: resourceData.title, 
          url: resourceData.url,
          isVisible: resourceData.isVisible
        });

        setCourses(courses.map(course => {
          if (course.id === selectedCourse.id) {
            const updatedChapters = (course.chapters || []).map(c => ({
              ...c,
              lessons: (c.lessons || []).map(l => 
                l.id === activeLessonId ? { 
                  ...l, 
                  resources: (l.resources || []).map(r => r.id === editingResourceId ? { ...r, title: resourceData.title, url: resourceData.url } : r) 
                } : l
              )
            }));
            const updatedCourse = { ...course, chapters: updatedChapters };
            setSelectedCourse(updatedCourse);
            return updatedCourse;
          }
          return course;
        }));
      } else {
        let response;
        if (resourceData.type === 'pdf') {
          const formData = new FormData();
          formData.append('title', resourceData.title);
          formData.append('type', resourceData.type);
          if (resourceData.file) {
            formData.append('file', resourceData.file);
          }
          response = await api.post(`/lessons/${activeLessonId}/resources`, formData);
        } else {
          response = await api.post(`/lessons/${activeLessonId}/resources`, { 
            title: resourceData.title, 
            type: resourceData.type, 
            url: resourceData.url 
          });
        }
        
        const newResource = response.data;

        setCourses(courses.map(course => {
          if (course.id === selectedCourse.id) {
            const updatedChapters = (course.chapters || []).map(c => ({
              ...c,
              lessons: (c.lessons || []).map(l => 
                l.id === activeLessonId ? { ...l, resources: [...(l.resources || []), newResource] } : l
              )
            }));
            const updatedCourse = { ...course, chapters: updatedChapters };
            setSelectedCourse(updatedCourse);
            return updatedCourse;
          }
          return course;
        }));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving resource');
    }

    setResourceData({ title: "", type: "pdf", url: "", file: null, isVisible: true });
    setEditingResourceId(null);
    setIsResourceModalOpen(false);
  };

  const handleToggleLessonVisibility = async (chapterId, lessonId) => {
    const chapter = selectedCourse.chapters.find(c => c.id === chapterId);
    const lesson = chapter?.lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    const newVisibility = lesson.isVisible === false ? true : false;
    try {
      await api.put(`/lessons/${lessonId}`, { isVisible: newVisibility });
      
      setCourses(courses.map(course => {
        if (course.id === selectedCourse.id) {
          const updatedChapters = course.chapters.map(c => 
            c.id === chapterId ? {
              ...c, lessons: c.lessons.map(l => l.id === lessonId ? { ...l, isVisible: newVisibility } : l)
            } : c
          );
          const updatedCourse = { ...course, chapters: updatedChapters };
          setSelectedCourse(updatedCourse);
          return updatedCourse;
        }
        return course;
      }));
    } catch (err) { console.error(err); }
  };

  const handleDeleteLesson = async (chapterId, lessonId) => {
    if (window.confirm("Are you sure you want to delete this lesson and all its resources?")) {
      try {
        await api.delete(`/lessons/${lessonId}`);
        setCourses(courses.map(course => {
          if (course.id === selectedCourse.id) {
            const updatedChapters = course.chapters.map(c => 
              c.id === chapterId ? {
                ...c, lessons: c.lessons.filter(l => l.id !== lessonId)
              } : c
            );
            const updatedCourse = { ...course, chapters: updatedChapters };
            setSelectedCourse(updatedCourse);
            return updatedCourse;
          }
          return course;
        }));
      } catch (err) { console.error(err); }
    }
  };

  const handleOpenEditLesson = (chapterId, lesson) => {
    setActiveModuleId(chapterId);
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setIsLessonModalOpen(true);
  };

  const handleToggleResourceVisibility = async (chapterId, lessonId, resourceId) => {
    const chapter = selectedCourse.chapters.find(c => c.id === chapterId);
    const lesson = chapter?.lessons.find(l => l.id === lessonId);
    const resource = lesson?.resources.find(r => r.id === resourceId);
    if (!resource) return;
    const newVisibility = resource.isVisible === false ? true : false;
    try {
      await api.put(`/resources/${resourceId}`, { isVisible: newVisibility });
      setCourses(courses.map(course => {
        if (course.id === selectedCourse.id) {
          const updatedChapters = course.chapters.map(c => 
            c.id === chapterId ? {
              ...c, lessons: c.lessons.map(l => 
                l.id === lessonId ? {
                  ...l, resources: l.resources.map(r => r.id === resourceId ? { ...r, isVisible: newVisibility } : r)
                } : l
              )
            } : c
          );
          const updatedCourse = { ...course, chapters: updatedChapters };
          setSelectedCourse(updatedCourse);
          return updatedCourse;
        }
        return course;
      }));
    } catch (err) { console.error(err); }
  };

  const handleDeleteResource = async (chapterId, lessonId, resourceId) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await api.delete(`/resources/${resourceId}`);
        setCourses(courses.map(course => {
          if (course.id === selectedCourse.id) {
            const updatedChapters = course.chapters.map(c => 
              c.id === chapterId ? {
                ...c, lessons: c.lessons.map(l => 
                  l.id === lessonId ? {
                    ...l, resources: l.resources.filter(r => r.id !== resourceId)
                  } : l
                )
              } : c
            );
            const updatedCourse = { ...course, chapters: updatedChapters };
            setSelectedCourse(updatedCourse);
            return updatedCourse;
          }
          return course;
        }));
      } catch (err) { console.error(err); }
    }
  };

  const handleOpenEditResource = (lessonId, resource) => {
    setActiveLessonId(lessonId);
    setEditingResourceId(resource.id);
    setResourceData({ title: resource.title, type: resource.type, url: resource.url, isVisible: resource.isVisible });
    setIsResourceModalOpen(true);
  };
  
  // ============================
  // ASSIGNMENT LOGIC (MERGED)
  // ============================
  const submitAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentData.title.trim() || !assignmentData.deadline || Object.keys(assignmentErrors).length > 0) return;

    setIsSavingAssignment(true);
    try {
        const formData = new FormData();
        formData.append('title', assignmentData.title);
        formData.append('description', assignmentData.description);
        formData.append('deadline', assignmentData.deadline);
        formData.append('publish_at', assignmentData.publish_at);
        formData.append('max_marks', assignmentData.max_marks);
        if (assignmentData.files && assignmentData.files.length > 0) {
            Array.from(assignmentData.files).forEach(file => {
                formData.append('attachments', file);
            });
        }

        const url = editingAssignmentId 
            ? `/assignments/${editingAssignmentId}`
            : `/modules/${activeModuleId}/assignments`;
        
        // 🌟 COMBINED FIX: Use api.post / api.put depending on mode
        const response = await (editingAssignmentId ? api.put(url, formData) : api.post(url, formData));
        const result = response.data;

        // Update local state
        setCourses(courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedChapters = (course.chapters || []).map(c => {
                    if (c.id === activeModuleId) {
                        if (editingAssignmentId) {
                            return {
                                ...c,
                                assignments: (c.assignments || []).map(a => 
                                    a.id === editingAssignmentId 
                                        ? { ...a, ...assignmentData, attachments: [...assignmentData.existingAttachments, ...(result.newAttachments || [])] } 
                                        : a
                                )
                            };
                        } else {
                            // Backend now returns the full assignment object in 'result'
                            return { 
                                ...c, 
                                assignments: [result, ...(c.assignments || [])] 
                            };
                        }
                    }
                    return c;
                });
                const updatedCourse = { ...course, chapters: updatedChapters };
                setSelectedCourse(updatedCourse);
                return updatedCourse;
            }
            return course;
        }));

        setIsAssignmentModalOpen(false);
        setEditingAssignmentId(null);
        setAssignmentData({ title: "", description: "", deadline: "", publish_at: "", max_marks: 100, files: [], existingAttachments: [] });
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Error saving assignment: ' + err.message);
    } finally {
        setIsSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (aId, moduleId) => {
    if (window.confirm("Are you sure you want to delete this assignment? All submissions will be lost.")) {
        try {
            await api.delete(`/assignments/${aId}`);

            setCourses(courses.map(course => {
                if (course.id === selectedCourse.id) {
                    const updatedChapters = (course.chapters || []).map(c => 
                        c.id === moduleId ? { ...c, assignments: (c.assignments || []).filter(a => a.id !== aId) } : c
                    );
                    const updatedCourse = { ...course, chapters: updatedChapters };
                    setSelectedCourse(updatedCourse);
                    return updatedCourse;
                }
                return course;
            }));
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error deleting assignment');
        }
    }
  };

  const handleRemoveExistingAttachment = async (attId, aId) => {
    try {
        await api.delete(`/attachments/${attId}`);

        setAssignmentData(prev => ({
            ...prev,
            existingAttachments: prev.existingAttachments.filter(att => att.id !== attId)
        }));
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Error removing attachment');
    }
  };

  // ============================
  // QUIZ LOGIC (MERGED)
  // ============================
  const addQuizQuestion = () => {
    setQuizData(prev => ({
        ...prev,
        questions: [...prev.questions, { 
            question: "", 
            type: "single", 
            marks: 1, 
            options: [{ answer: "", correct: true }] 
        }]
    }));
  };

  const updateQuizQuestion = (index, field, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[index][field] = value;
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const removeQuizQuestion = (index) => {
    setQuizData({ ...quizData, questions: quizData.questions.filter((_, i) => i !== index) });
  };

  const addQuizOption = (qIndex) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[qIndex].options.push({ answer: "", correct: false });
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const updateQuizOption = (qIndex, oIndex, field, value) => {
    const updatedQuestions = [...quizData.questions];
    if (field === 'correct' && updatedQuestions[qIndex].type === 'single') {
        updatedQuestions[qIndex].options.forEach((opt, i) => opt.correct = (i === oIndex));
    } else {
        updatedQuestions[qIndex].options[oIndex][field] = value;
    }
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const removeQuizOption = (qIndex, oIndex) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[qIndex].options = updatedQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const handleEditQuiz = async (qzId, moduleId) => {
    try {
        const response = await api.get(`/quizzes/${qzId}`);
        const data = response.data;

        setEditingQuizId(qzId);
        setActiveModuleId(moduleId);
        setQuizData({
            number: data.number,
            time_limit: data.time_limit,
            publish_at: data.publish_at ? new Date(data.publish_at).toISOString().slice(0, 16) : "",
            questions: data.questions.map(q => ({
                id: q.id,
                question: q.question,
                type: q.type,
                marks: q.marks,
                options: q.options.map(o => ({
                    id: o.id,
                    answer: o.answer,
                    correct: !!o.correct
                }))
            }))
        });
        setIsQuizModalOpen(true);
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Error fetching quiz details');
    }
  };

  const handleDeleteQuiz = async (qzId, moduleId) => {
    if (window.confirm("Are you sure you want to delete this quiz? All submissions will be lost.")) {
        try {
            await api.delete(`/quizzes/${qzId}`);

            setCourses(courses.map(course => {
                if (course.id === selectedCourse.id) {
                    const updatedChapters = (course.chapters || []).map(c => 
                        c.id === moduleId ? { ...c, quizzes: (c.quizzes || []).filter(q => q.id !== qzId) } : c
                    );
                    const updatedCourse = { ...course, chapters: updatedChapters };
                    setSelectedCourse(updatedCourse);
                    return updatedCourse;
                }
                return course;
            }));
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error deleting quiz');
        }
    }
  };

  const submitQuiz = async (e) => {
    e.preventDefault();
    if (quizData.questions.length === 0) {
        alert("Please add at least one question.");
        return;
    }

    setIsSavingQuiz(true);
    try {
        let quizId = editingQuizId;

        // 1. Create or Update Quiz Metadata
        const quizPayload = { 
            number: quizData.number, 
            time_limit: quizData.time_limit, 
            publish_at: quizData.publish_at || null
        };

        if (editingQuizId) {
            await api.put(`/quizzes/${editingQuizId}`, quizPayload);
        } else {
            const resp = await api.post(`/modules/${activeModuleId}/quizzes`, quizPayload);
            const newQuiz = resp.data;
            quizId = newQuiz.id;
        }

        // 2. Handle Questions (Simplest approach for MVP: if it has an ID, update it; if not, create it)
        // Note: For a more robust implementation, we should also handle deleted questions.
        for (let q of quizData.questions) {
            if (q.id) {
                // Update existing question
                await api.put(`/questions/${q.id}`, { 
                    type: q.type, 
                    marks: q.marks, 
                    question: q.question, 
                    options: q.options 
                });
            } else {
                // Create new question
                const qResp = await api.post(`/courses/${selectedCourse.id}/questions`, { 
                    ...q, 
                    t_id: selectedCourse.teacher_id || 1 
                });
                const qId = qResp.data.id;

                // Link to quiz
                await api.post(`/quizzes/${quizId}/questions`, { qId });
            }
        }

        // Update local state
        setCourses(courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedChapters = (course.chapters || []).map(c => {
                    if (c.id === activeModuleId) {
                        if (editingQuizId) {
                            return { 
                                ...c, 
                                quizzes: (c.quizzes || []).map(q => q.id === editingQuizId ? { ...q, ...quizPayload, id: q.id } : q) 
                            };
                        } else {
                            return { ...c, quizzes: [{ id: quizId, ...quizPayload }, ...(c.quizzes || [])] };
                        }
                    }
                    return c;
                });
                const updatedCourse = { ...course, chapters: updatedChapters };
                setSelectedCourse(updatedCourse);
                return updatedCourse;
            }
            return course;
        }));

        setIsQuizModalOpen(false);
        setEditingQuizId(null);
        setQuizData({ number: 1, time_limit: "00:30:00", publish_at: "", questions: [] });
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Error saving quiz: ' + err.message);
    } finally {
        setIsSavingQuiz(false);
    }
  };

  const handleMoveChapterUp = (chapterIndex) => {
    if (chapterIndex === 0) return;
    setCourses(courses.map(course => {
      if (course.id === selectedCourse.id) {
        const newChapters = [...(course.chapters || [])];
        const temp = newChapters[chapterIndex];
        newChapters[chapterIndex] = newChapters[chapterIndex - 1];
        newChapters[chapterIndex - 1] = temp;
        const updatedCourse = { ...course, chapters: newChapters };
        setSelectedCourse(updatedCourse);
        
        api.put(`/courses/${course.id}/modules/reorder`, { moduleIds: newChapters.map(c => c.id) })
           .catch(err => console.error("Failed to reorder modules", err));

        return updatedCourse;
      }
      return course;
    }));
  };

  const handleMoveChapterDown = (chapterIndex) => {
    if (chapterIndex === (selectedCourse.chapters?.length || 0) - 1) return;
    setCourses(courses.map(course => {
      if (course.id === selectedCourse.id) {
        const newChapters = [...(course.chapters || [])];
        const temp = newChapters[chapterIndex];
        newChapters[chapterIndex] = newChapters[chapterIndex + 1];
        newChapters[chapterIndex + 1] = temp;
        const updatedCourse = { ...course, chapters: newChapters };
        setSelectedCourse(updatedCourse);
        
        api.put(`/courses/${course.id}/modules/reorder`, { moduleIds: newChapters.map(c => c.id) })
           .catch(err => console.error("Failed to reorder modules", err));

        return updatedCourse;
      }
      return course;
    }));
  };

  const handleMoveLessonUp = (moduleIndex, lessonIndex) => {
    if (lessonIndex === 0) return;
    setCourses(courses.map(course => {
      if (course.id === selectedCourse.id) {
        const newChapters = [...(course.chapters || [])];
        const newLessons = [...(newChapters[moduleIndex].lessons || [])];
        const temp = newLessons[lessonIndex];
        newLessons[lessonIndex] = newLessons[lessonIndex - 1];
        newLessons[lessonIndex - 1] = temp;
        newChapters[moduleIndex] = { ...newChapters[moduleIndex], lessons: newLessons };
        const updatedCourse = { ...course, chapters: newChapters };
        setSelectedCourse(updatedCourse);
        
        api.put(`/modules/${newChapters[moduleIndex].id}/lessons/reorder`, { lessonIds: newLessons.map(l => l.id) })
           .catch(err => console.error("Failed to reorder lessons", err));

        return updatedCourse;
      }
      return course;
    }));
  };

  const handleMoveLessonDown = (moduleIndex, lessonIndex) => {
    if (lessonIndex === (selectedCourse.chapters[moduleIndex].lessons?.length || 0) - 1) return;
    setCourses(courses.map(course => {
      if (course.id === selectedCourse.id) {
        const newChapters = [...(course.chapters || [])];
        const newLessons = [...(newChapters[moduleIndex].lessons || [])];
        const temp = newLessons[lessonIndex];
        newLessons[lessonIndex] = newLessons[lessonIndex + 1];
        newLessons[lessonIndex + 1] = temp;
        newChapters[moduleIndex] = { ...newChapters[moduleIndex], lessons: newLessons };
        const updatedCourse = { ...course, chapters: newChapters };
        setSelectedCourse(updatedCourse);
        
        api.put(`/modules/${newChapters[moduleIndex].id}/lessons/reorder`, { lessonIds: newLessons.map(l => l.id) })
           .catch(err => console.error("Failed to reorder lessons", err));

        return updatedCourse;
      }
      return course;
    }));
  };

  const handleMoveResourceUp = (moduleIndex, lessonIndex, resourceIndex) => {
    if (resourceIndex === 0) return;
    setCourses(courses.map(course => {
      if (course.id === selectedCourse.id) {
        const newChapters = [...(course.chapters || [])];
        const newLessons = [...(newChapters[moduleIndex].lessons || [])];
        const newResources = [...(newLessons[lessonIndex].resources || [])];
        const temp = newResources[resourceIndex];
        newResources[resourceIndex] = newResources[resourceIndex - 1];
        newResources[resourceIndex - 1] = temp;
        newLessons[lessonIndex] = { ...newLessons[lessonIndex], resources: newResources };
        newChapters[moduleIndex] = { ...newChapters[moduleIndex], lessons: newLessons };
        const updatedCourse = { ...course, chapters: newChapters };
        setSelectedCourse(updatedCourse);
        
        api.put(`/lessons/${newLessons[lessonIndex].id}/resources/reorder`, { resourceIds: newResources.map(r => r.id) })
           .catch(err => console.error("Failed to reorder resources", err));

        return updatedCourse;
      }
      return course;
    }));
  };

  const handleMoveResourceDown = (moduleIndex, lessonIndex, resourceIndex) => {
    if (resourceIndex === (selectedCourse.chapters[moduleIndex].lessons[lessonIndex].resources?.length || 0) - 1) return;
    setCourses(courses.map(course => {
      if (course.id === selectedCourse.id) {
        const newChapters = [...(course.chapters || [])];
        const newLessons = [...(newChapters[moduleIndex].lessons || [])];
        const newResources = [...(newLessons[lessonIndex].resources || [])];
        const temp = newResources[resourceIndex];
        newResources[resourceIndex] = newResources[resourceIndex + 1];
        newResources[resourceIndex + 1] = temp;
        newLessons[lessonIndex] = { ...newLessons[lessonIndex], resources: newResources };
        newChapters[moduleIndex] = { ...newChapters[moduleIndex], lessons: newLessons };
        const updatedCourse = { ...course, chapters: newChapters };
        setSelectedCourse(updatedCourse);
        
        api.put(`/lessons/${newLessons[lessonIndex].id}/resources/reorder`, { resourceIds: newResources.map(r => r.id) })
           .catch(err => console.error("Failed to reorder resources", err));

        return updatedCourse;
      }
      return course;
    }));
  };

  const handleToggleChapterVisibility = async (chapterId) => {
    const chapter = selectedCourse.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const newVisibility = chapter.isVisible === false ? true : false;

    try {
      await api.put(`/modules/${chapterId}`, { isVisible: newVisibility });

      setCourses(courses.map(course => {
        if (course.id === selectedCourse.id) {
          const updatedChapters = (course.chapters || []).map(c => 
            c.id === chapterId ? { ...c, isVisible: newVisibility } : c
          );
          const updatedCourse = { ...course, chapters: updatedChapters };
          setSelectedCourse(updatedCourse);
          return updatedCourse;
        }
        return course;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (window.confirm("Are you sure you want to delete this chapter and all its resources?")) {
      try {
        await api.delete(`/modules/${chapterId}`);

        setCourses(courses.map(course => {
          if (course.id === selectedCourse.id) {
            const updatedChapters = course.chapters.filter(c => c.id !== chapterId);
            const updatedCourse = { 
                ...course, 
                chapters: updatedChapters,
                modules: updatedChapters.length 
            };
            setSelectedCourse(updatedCourse);
            return updatedCourse;
          }
          return course;
        }));
      } catch (err) {
        console.error(err);
        alert('Error deleting chapter');
      }
    }
  };

  const handleOpenEditChapter = (chapter) => {
    setEditingChapterId(chapter.id);
    setChapterTitle(chapter.title);
    setIsChapterModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setFormData({ 
      name: "",
      title: "", 
      type: "Class",
      status: "not_active",
      is_published: false,
      theme_color: "purple",
      thumbnail_url: "",
      students: 0, 
      modules: 0, 
      progress: 0 
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setFormData({ 
      name: course.name || "",
      title: course.title || "", 
      type: course.type || "Class",
      status: course.status || "not_active",
      is_published: course.is_published || false,
      theme_color: course.theme_color || "purple",
      thumbnail_url: course.thumbnail_url || "",
      students: course.students || 0, 
      modules: course.modules || 0, 
      progress: course.progress || 0 
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        // Edit Course
        const response = await api.put(`/courses/${editingCourse.id}`, formData);
        const updatedCourse = response.data;
        
        setCourses(courses.map(c => String(c.id) === String(updatedCourse.id) ? { ...c, ...updatedCourse, id: c.id } : c));
      } else {
        // Create Course
        const payload = {
          ...formData,
          userId: localStorage.getItem('userId')
        };
        const response = await api.post('/courses', payload);
        const newCourse = response.data;
        
        setCourses([...courses, newCourse]);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error submitting course:", error);
      alert(error.response?.data?.message || "Failed to submit course");
    }
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await api.delete(`/courses/${id}`);
        setCourses(courses.filter(c => String(c.id) !== String(id)));
      } catch (error) {
        console.error("Error deleting course:", error);
        alert(error.response?.data?.message || "Failed to delete course");
      }
    }
  };

  return (
    <React.Fragment>
      {selectedCourse ? (
        <div className="animate-in fade-in flex flex-col gap-6">
          <button 
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors self-start font-medium"
          >
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <div className="flex justify-between items-end border-b pb-6">
            <div>
              <span className="text-purple-600 font-semibold mb-1 block">Course Structure</span>
              <h1 className="text-3xl font-extrabold text-gray-900">{selectedCourse.title}</h1>
            </div>
            <button 
              onClick={() => {
                setEditingChapterId(null);
                setChapterTitle("");
                setIsChapterModalOpen(true);
              }}
              className="bg-purple-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition shadow-md"
            >
              <Plus size={18} /> Add Module
            </button>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            {selectedCourse.chapters?.map((chapter, index) => {
              const isExpanded = expandedChapters.includes(chapter.id);
              return (
                <div key={chapter.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <button 
                      onClick={() => toggleChapter(chapter.id)}
                      className={`flex-1 flex items-center gap-3 text-left ${chapter.isVisible === false ? 'opacity-50' : ''}`}
                    >
                      <h3 className={`text-lg font-bold ${chapter.isVisible === false ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{chapter.title}</h3>
                      {chapter.isVisible === false && <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded font-medium">Hidden from Students</span>}
                    </button>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleChapterVisibility(chapter.id); }}
                        className={`p-2 rounded-lg transition-colors mr-1 ${chapter.isVisible === false ? 'text-gray-400 hover:bg-gray-200' : 'text-purple-600 hover:bg-purple-100'}`}
                        title={chapter.isVisible === false ? "Show Chapter to Students" : "Hide Chapter from Students"}
                      >
                        {chapter.isVisible === false ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <div className="flex bg-white shadow-sm border rounded-lg overflow-hidden mr-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveChapterUp(index); }}
                          disabled={index === 0}
                          className={`p-2 transition-colors border-r ${index === 0 ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'}`}
                          title="Move Up"
                        >
                          <ArrowUp size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveChapterDown(index); }}
                          disabled={index === (selectedCourse.chapters?.length || 0) - 1}
                          className={`p-2 transition-colors ${index === (selectedCourse.chapters?.length || 0) - 1 ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'}`}
                          title="Move Down"
                        >
                          <ArrowDown size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditChapter(chapter); }}
                        className="p-2 text-gray-500 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors"
                        title="Edit Chapter"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteChapter(chapter.id); }}
                        className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                        title="Delete Chapter"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>
                      <button 
                        onClick={() => toggleChapter(chapter.id)}
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-5 flex flex-col gap-3 bg-white">
                      {chapter.lessons?.map((lesson, lessonIndex) => {
                        const isLessonExpanded = expandedLessons.includes(lesson.id);
                        return (
                          <div key={lesson.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleLesson(lesson.id)}>
                              <h4 className={`font-semibold ${lesson.isVisible === false ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{lesson.title}</h4>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleLessonVisibility(chapter.id, lesson.id); }}
                                  className={`p-1.5 rounded-md transition-colors mr-1 ${lesson.isVisible === false ? 'text-gray-400 hover:bg-gray-200' : 'text-purple-600 hover:bg-purple-100'}`}
                                >
                                  {lesson.isVisible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <div className="flex bg-white shadow-sm border rounded-md overflow-hidden mr-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMoveLessonUp(index, lessonIndex); }}
                                    disabled={lessonIndex === 0}
                                    className={`p-1.5 transition-colors border-r ${lessonIndex === 0 ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}
                                    title="Move Up"
                                  >
                                    <ArrowUp size={14} strokeWidth={2.5} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMoveLessonDown(index, lessonIndex); }}
                                    disabled={lessonIndex === (chapter.lessons?.length || 0) - 1}
                                    className={`p-1.5 transition-colors ${lessonIndex === (chapter.lessons?.length || 0) - 1 ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}
                                    title="Move Down"
                                  >
                                    <ArrowDown size={14} strokeWidth={2.5} />
                                  </button>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenEditLesson(chapter.id, lesson); }}
                                  className="p-1.5 text-gray-500 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-colors"
                                  title="Edit Lesson"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteLesson(chapter.id, lesson.id); }}
                                  className="p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors mr-2"
                                  title="Delete Lesson"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button className="text-gray-500 border-l pl-2 border-gray-300">
                                  {isLessonExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </div>
                            </div>
                            {isLessonExpanded && (
                              <div className="p-4 bg-white flex flex-col gap-2">
                                {lesson.resources?.map((res, resIndex) => (
                                  <div key={res.id} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 border border-transparent transition-colors group ${res.isVisible === false ? 'opacity-60' : ''}`}>
                                    <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 flex-1 cursor-pointer">
                                      {res.type === 'pdf' ? (
                                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0 transition-colors group-hover:bg-red-100">
                                          <File size={16} />
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 transition-colors group-hover:bg-blue-100">
                                          <LinkIcon size={16} />
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <p className={`text-sm font-medium transition-colors ${res.isVisible === false ? 'text-gray-400 line-through' : 'text-gray-800 group-hover:text-purple-600'}`}>{res.title}</p>
                                      </div>
                                    </a>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleResourceVisibility(chapter.id, lesson.id, res.id); }}
                                        className={`p-1 rounded bg-white border ${res.isVisible === false ? 'text-gray-400 hover:bg-gray-100' : 'text-purple-600 hover:bg-purple-50'}`}
                                        title={res.isVisible === false ? "Show Resource" : "Hide Resource"}
                                      >
                                        {res.isVisible === false ? <EyeOff size={12} /> : <Eye size={12} />}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveResourceUp(index, lessonIndex, resIndex); }}
                                        disabled={resIndex === 0}
                                        className={`p-1 rounded bg-white border ${resIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                                      >
                                        <ArrowUp size={12} strokeWidth={2.5} />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveResourceDown(index, lessonIndex, resIndex); }}
                                        disabled={resIndex === (lesson.resources?.length || 0) - 1}
                                        className={`p-1 rounded bg-white border ${resIndex === (lesson.resources?.length || 0) - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                                      >
                                        <ArrowDown size={12} strokeWidth={2.5} />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenEditResource(lesson.id, res); }}
                                        className="p-1 rounded bg-white border text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                                        title="Edit"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteResource(chapter.id, lesson.id, res.id); }}
                                        className="p-1 rounded bg-white border text-gray-500 hover:bg-red-50 hover:text-red-600"
                                        title="Delete"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                    <a href={res.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-purple-600 transition-colors px-2 font-medium text-xs border-l pl-3">
                                      Open
                                    </a>
                                  </div>
                                ))}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setActiveLessonId(lesson.id); setIsResourceModalOpen(true); }}
                                  className="mt-2 flex items-center gap-2 text-purple-600 text-xs font-semibold hover:bg-purple-50 self-start px-3 py-1.5 rounded-md transition-colors"
                                >
                                  <Plus size={14} /> Add Resource
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button 
                        onClick={() => { setActiveModuleId(chapter.id); setIsLessonModalOpen(true); }}
                        className="mt-2 flex items-center gap-2 text-blue-600 text-sm font-semibold hover:bg-blue-50 self-start px-4 py-2 rounded-lg transition-colors border border-blue-100"
                      >
                        <Plus size={16} /> Add Lesson
                      </button>
                      
                      <div className="mt-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                <ClipboardList size={18} className="text-purple-500" /> Assignments
                            </h4>
                            <button 
                                onClick={() => { setActiveModuleId(chapter.id); setIsAssignmentModalOpen(true); }}
                                className="text-xs font-bold text-purple-600 hover:text-purple-700"
                            >
                                + Create Assignment
                            </button>
                        </div>
                        {(chapter.assignments || []).length === 0 ? (
                            <p className="text-gray-400 text-xs italic">No assignments added yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {chapter.assignments.map(assign => (
                                    <div key={assign.id} className="border rounded-xl p-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all relative group/assign">
                                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/assign:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    setEditingAssignmentId(assign.id);
                                                    setActiveModuleId(chapter.id);
                                                    setAssignmentData({
                                                        title: assign.title || "",
                                                        description: assign.description || "",
                                                        deadline: (assign.deadline && !isNaN(new Date(assign.deadline))) ? new Date(assign.deadline).toISOString().slice(0, 16) : "",
                                                        publish_at: (assign.publish_at && !isNaN(new Date(assign.publish_at))) ? new Date(assign.publish_at).toISOString().slice(0, 16) : "",
                                                        max_marks: assign.max_marks || 100,
                                                        files: [],
                                                        existingAttachments: assign.attachments || []
                                                    });
                                                    setIsAssignmentModalOpen(true);
                                                }}
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                                title="Edit Assignment"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteAssignment(assign.id, chapter.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                title="Delete Assignment"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-start mb-2 pr-12">
                                            <h5 className="font-bold text-gray-800">{assign.title}</h5>
                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold h-fit">
                                                {assign.max_marks} Marks
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{assign.description}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-4">
                                            <CalendarIcon size={12} />
                                            <span>Deadline: {new Date(assign.deadline).toLocaleDateString()}</span>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/teacher/assignments/${assign.id}/submissions`)}
                                            className="w-full bg-white border border-purple-200 text-purple-700 py-2 rounded-lg text-xs font-bold hover:bg-purple-50 transition-colors"
                                        >
                                            View Submissions
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        </div>
                        
                        <div className="mt-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                    <BookOpen size={18} className="text-blue-500" /> Quizzes
                                </h4>
                                <button 
                                    onClick={() => { setActiveModuleId(chapter.id); setIsQuizModalOpen(true); }}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                >
                                    + Create Quiz
                                </button>
                            </div>
                            
                            {(chapter.quizzes || []).length === 0 ? (
                                <p className="text-gray-400 text-xs italic">No quizzes added yet.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {chapter.quizzes.map(qz => (
                                        <div key={qz.id} className="border rounded-xl p-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all relative group/quiz">
                                            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/quiz:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEditQuiz(qz.id, chapter.id)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="Edit Quiz"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteQuiz(qz.id, chapter.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Delete Quiz"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-start mb-2 pr-12">
                                                <h5 className="font-bold text-gray-800">Quiz #{qz.number}</h5>
                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                                    {qz.time_limit}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1 text-[10px] text-gray-400">
                                                {qz.publish_at && (
                                                    <div className="flex items-center gap-1 text-blue-500 font-medium">
                                                        <CalendarIcon size={10} />
                                                        <span>Scheduled: {new Date(qz.publish_at).toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                      </div>
                   )}
                </div>
              );
            })}
            {(!selectedCourse.chapters || selectedCourse.chapters.length === 0) && (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <FolderTree className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No modules added yet. Start by adding your first module.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500 flex flex-col gap-8">
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Course Management</h1>
              <p className="text-gray-500 mt-2">Create, update, and manage your courses from here.</p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="bg-purple-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition-all shadow-md transform hover:scale-105"
            >
              <Plus size={20} /> Create New Course
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.map((course) => (
              <div key={course.id} className="bg-white p-7 rounded-2xl shadow-md flex flex-col hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-800 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{course.students} Students • {course.modules} Modules</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleViewCourse(course)}
                    className="flex-1 bg-purple-50 text-purple-700 px-4 py-2.5 rounded-xl hover:bg-purple-100 transition-colors font-semibold text-sm flex items-center justify-center gap-2 block"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleOpenEditModal(course)}
                    className="flex-1 bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    Edit 
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
                    title="Delete Course"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            {(!courses || courses.length === 0) && (
              <div className="col-span-full bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No courses found</h3>
                <p className="text-gray-500 mb-6 max-w-sm">You haven't created any courses yet. Click the button below to add your first course.</p>
                <button
                  onClick={handleOpenCreateModal}
                  className="bg-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition-all shadow-md"
                >
                  <Plus size={20} /> Create Course
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAssignmentModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingAssignmentId ? 'Edit Assignment' : 'Create Assignment'}</h2>
            <form onSubmit={submitAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Assignment Title</label>
                <input 
                  type="text" 
                  value={assignmentData.title}
                  onChange={e => setAssignmentData({...assignmentData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-100 focus:border-purple-600 outline-none transition-all"
                  placeholder="e.g. Weekly Quiz 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea 
                  value={assignmentData.description}
                  onChange={e => setAssignmentData({...assignmentData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-100 focus:border-purple-600 outline-none transition-all"
                  placeholder="Enter assignment instructions..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Deadline</label>
                  <input 
                    type="datetime-local" 
                    value={assignmentData.deadline}
                    onChange={e => setAssignmentData({...assignmentData, deadline: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                      assignmentErrors.deadline 
                        ? 'border-red-500 focus:ring-red-100 focus:border-red-600' 
                        : 'border-gray-200 focus:ring-purple-100 focus:border-purple-600'
                    }`}
                    required
                  />
                  {assignmentErrors.deadline && <p className="text-[10px] text-red-500 mt-1 font-medium">{assignmentErrors.deadline}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Max Marks</label>
                  <input 
                    type="number" 
                    value={assignmentData.max_marks}
                    onChange={e => setAssignmentData({...assignmentData, max_marks: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-100 focus:border-purple-600 outline-none transition-all"
                  />
                </div>
              </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Publish On (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={assignmentData.publish_at}
                    onChange={e => setAssignmentData({...assignmentData, publish_at: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                      assignmentErrors.publish_at 
                        ? 'border-red-500 focus:ring-red-100 focus:border-red-600' 
                        : 'border-gray-200 focus:ring-purple-100 focus:border-purple-600'
                    }`}
                  />
                  {assignmentErrors.publish_at && <p className="text-[10px] text-red-500 mt-1 font-medium">{assignmentErrors.publish_at}</p>}
                  {!assignmentErrors.publish_at && <p className="text-[10px] text-gray-400 mt-1 italic">Leave empty to publish immediately.</p>}
                </div>

                {/* Existing Attachments */}
                {editingAssignmentId && assignmentData.existingAttachments?.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Current Attachments</label>
                    <div className="space-y-2">
                      {assignmentData.existingAttachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2 text-purple-600 font-medium truncate">
                            <File size={14} />
                            <a href={att.file_url} target="_blank" rel="noreferrer" className="hover:underline truncate">
                              {att.file_url.split('/').pop()}
                            </a>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveExistingAttachment(att.id, editingAssignmentId)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {editingAssignmentId ? 'Add New Attachments' : 'Attachments (Required)'}
                  </label>
                  <input 
                    type="file" 
                    multiple
                    onChange={e => {
                        const newFiles = Array.from(e.target.files);
                        setAssignmentData(prev => ({
                            ...prev, 
                            files: [...prev.files, ...newFiles]
                        }));
                        // Reset input so the same file can be picked twice if needed, or just to clear selection
                        e.target.value = null;
                    }}
                    className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
                        assignmentErrors.files 
                        ? 'file:bg-red-50 file:text-red-700 hover:file:bg-red-100' 
                        : 'file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100'
                    }`}
                  />
                  {assignmentErrors.files && <p className="text-[10px] text-red-500 mt-1 font-medium">{assignmentErrors.files}</p>}
                  {assignmentData.files?.length > 0 && (
                      <div className="mt-2 space-y-1">
                          {assignmentData.files.map((f, i) => (
                              <div key={i} className="text-[10px] text-purple-600 font-medium truncate flex items-center justify-between bg-purple-50 p-2 rounded-lg border border-purple-100">
                                  <div className="flex items-center gap-2 truncate">
                                    <File size={12} /> {f.name}
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                        setAssignmentData(prev => ({
                                            ...prev,
                                            files: prev.files.filter((_, idx) => idx !== i)
                                        }));
                                    }}
                                    className="text-red-500 hover:text-red-700 p-0.5"
                                  >
                                    <X size={12} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
                </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsAssignmentModalOpen(false); setEditingAssignmentId(null); }} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
                <button 
                  type="submit" 
                  disabled={Object.keys(assignmentErrors).length > 0 || isSavingAssignment}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all shadow-md ${
                    (Object.keys(assignmentErrors).length > 0 || isSavingAssignment)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isSavingAssignment ? 'Saving...' : (editingAssignmentId ? 'Save Changes' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingCourse ? "Edit Course" : "Create New Course"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Internal reference name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Public facing title"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image URL</label>
                <input
                  type="url"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  >
                    <option value="Class">Class</option>
                    <option value="Certificate Course">Certificate Course</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
                  <select
                    name="theme_color"
                    value={formData.theme_color}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  >
                    <option value="purple">Purple</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                    <option value="red">Red</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="not_active">Not Active</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input
                    type="checkbox"
                    id="is_published"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                    Publish Course
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-md"
                >
                  {editingCourse ? "Save Changes" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Lesson Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => { setIsLessonModalOpen(false); setEditingLessonId(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">{editingLessonId ? "Edit Lesson" : "Add Lesson"}</h2>
            <form onSubmit={submitLesson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                <input type="text" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} required className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Lesson 1: Introduction" />
              </div>
              <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">{editingLessonId ? "Save Changes" : "Create Lesson"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Chapter Modal */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => {setIsChapterModalOpen(false); setEditingChapterId(null);}} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">{editingChapterId ? 'Edit Module' : 'Add Module'}</h2>
            <form onSubmit={submitChapter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module Title</label>
                <input type="text" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} required className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Module 1: Introduction" />
              </div>
              <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">{editingChapterId ? 'Save Changes' : 'Create Module'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => { setIsResourceModalOpen(false); setEditingResourceId(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">{editingResourceId ? "Edit Resource" : "Add Resource"}</h2>
            <form onSubmit={submitResource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Title</label>
                <input type="text" value={resourceData.title} onChange={(e) => setResourceData({...resourceData, title: e.target.value})} required className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Lecture Slides" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={resourceData.type} onChange={(e) => setResourceData({...resourceData, type: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                  <option value="pdf">PDF / Image</option>
                  <option value="link">External Link</option>
                </select>
              </div>
              
              {resourceData.type === 'pdf' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                  <input type="file" onChange={(e) => setResourceData({...resourceData, file: e.target.files[0]})} required={!editingResourceId} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" accept=".pdf,image/*" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link</label>
                  <input type="url" value={resourceData.url} onChange={(e) => setResourceData({...resourceData, url: e.target.value})} required className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://..." />
                </div>
              )}
              <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">{editingResourceId ? "Save Changes" : "Add Resource"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsQuizModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingQuizId ? 'Edit Quiz' : 'Create Quiz'}</h2>
            <form onSubmit={submitQuiz} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Quiz Number</label>
                  <input 
                    type="number" 
                    value={quizData.number}
                    onChange={e => setQuizData({...quizData, number: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Time Limit (HH:MM:SS)</label>
                  <input 
                    type="text" 
                    value={quizData.time_limit}
                    onChange={e => setQuizData({...quizData, time_limit: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    placeholder="00:30:00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="mt-4">
                  {/* Peer Review option removed */}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Publish On (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={quizData.publish_at}
                    onChange={e => setQuizData({...quizData, publish_at: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">Leave empty to publish immediately.</p>
                </div>
              </div>

              <div>
                 <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center justify-between">
                    Questions
                    <button type="button" onClick={addQuizQuestion} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100">+ Add Question</button>
                 </h3>
                 <div className="space-y-4">
                    {quizData.questions.map((q, qIdx) => (
                        <div key={qIdx} className="p-4 border rounded-xl bg-gray-50/30 relative group">
                            <button type="button" onClick={() => removeQuizQuestion(qIdx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                            </button>
                            <div className="space-y-3">
                                <input 
                                    type="text" 
                                    value={q.question} 
                                    onChange={e => updateQuizQuestion(qIdx, 'question', e.target.value)}
                                    placeholder="Enter question text..."
                                    className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none py-1 font-medium"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <select 
                                        value={q.type} 
                                        onChange={e => updateQuizQuestion(qIdx, 'type', e.target.value)}
                                        className="text-xs border rounded p-1"
                                    >
                                        <option value="single">Single Selection (Radio)</option>
                                        <option value="multiple">Multiple Selection (Checkboxes)</option>
                                    </select>
                                    <input 
                                        type="number" 
                                        value={q.marks} 
                                        onChange={e => updateQuizQuestion(qIdx, 'marks', e.target.value)}
                                        placeholder="Marks"
                                        className="text-xs border rounded p-1"
                                    />
                                </div>
                                <div className="space-y-2 mt-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Options</p>
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                            <input 
                                                type={q.type === 'single' ? 'radio' : 'checkbox'} 
                                                checked={opt.correct}
                                                onChange={e => updateQuizOption(qIdx, oIdx, 'correct', e.target.checked)}
                                                className="rounded-full text-blue-600"
                                            />
                                            <input 
                                                type="text" 
                                                value={opt.answer}
                                                onChange={e => updateQuizOption(qIdx, oIdx, 'answer', e.target.value)}
                                                placeholder={`Option ${oIdx + 1}`}
                                                className="flex-1 text-sm bg-white border rounded px-2 py-1"
                                            />
                                            {q.options.length > 1 && (
                                                <button type="button" onClick={() => removeQuizOption(qIdx, oIdx)} className="text-gray-300 hover:text-red-400">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addQuizOption(qIdx)} className="text-[10px] text-blue-500 hover:underline">+ Add Option</button>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setIsQuizModalOpen(false); setEditingQuizId(null); }} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
                <button 
                    type="submit" 
                    disabled={isSavingQuiz}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all shadow-md ${
                        isSavingQuiz ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {isSavingQuiz ? 'Saving...' : (editingQuizId ? 'Save Changes' : 'Create Quiz')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default TeachersCourse;