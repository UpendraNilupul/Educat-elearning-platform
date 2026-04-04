import React, { useState } from "react";
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

const TeachersCourse = ({ courses, setCourses }) => {
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

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [resourceData, setResourceData] = useState({ title: "", type: "pdf", url: "", file: null });

  const [expandedLessons, setExpandedLessons] = useState([]);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState("");

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({ 
    title: "", 
    description: "", 
    deadline: "", 
    max_marks: 100, 
    file: null 
  });

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setExpandedChapters(course.chapters?.map(c => c.id) || []);
    setExpandedLessons(course.chapters?.flatMap(c => c.lessons?.map(l => l.id) || []) || []);
  };

  const handleBackToDashboard = () => setSelectedCourse(null);

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
        const response = await fetch(`http://localhost:3000/api/modules/${editingChapterId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: chapterTitle })
        });
        if (!response.ok) throw new Error('Failed to update chapter');

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
        const response = await fetch('http://localhost:3000/api/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: chapterTitle, c_id: selectedCourse.id, isVisible: true })
        });
        if (!response.ok) throw new Error('Failed to add chapter');
        const newChap = await response.json();

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
      alert('Error saving chapter');
    }

    setChapterTitle("");
    setEditingChapterId(null);
    setIsChapterModalOpen(false);
  };

  const submitLesson = async (e) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/api/modules/${activeModuleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: lessonTitle })
      });
      if (!response.ok) throw new Error('Failed to add lesson');
      const newLesson = await response.json();

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
    } catch (err) {
      console.error(err);
      alert('Error adding lesson');
    }

    setLessonTitle("");
    setActiveModuleId(null);
    setIsLessonModalOpen(false);
  };

  const submitResource = async (e) => {
    e.preventDefault();
    if (!resourceData.title.trim()) return;

    try {
      let body;
      let headers = {};
      
      if (resourceData.type === 'pdf') {
        const formData = new FormData();
        formData.append('title', resourceData.title);
        formData.append('type', resourceData.type);
        if (resourceData.file) {
          formData.append('file', resourceData.file);
        }
        body = formData;
      } else {
        body = JSON.stringify({ 
          title: resourceData.title, 
          type: resourceData.type, 
          url: resourceData.url 
        });
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`http://localhost:3000/api/lessons/${activeLessonId}/resources`, {
        method: 'POST',
        headers,
        body
      });
      if (!response.ok) throw new Error('Failed to add resource');
      const newResource = await response.json();

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
    } catch (err) {
      console.error(err);
      alert('Error adding resource');
    }

    setResourceData({ title: "", type: "pdf", url: "", file: null });
    setIsResourceModalOpen(false);
  };
  
  const submitAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentData.title.trim() || !assignmentData.deadline) return;

    try {
        const formData = new FormData();
        formData.append('title', assignmentData.title);
        formData.append('description', assignmentData.description);
        formData.append('deadline', assignmentData.deadline);
        formData.append('max_marks', assignmentData.max_marks);
        if (assignmentData.file) {
            formData.append('attachment', assignmentData.file);
        }

        const response = await fetch(`http://localhost:3000/api/modules/${activeModuleId}/assignments`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to add assignment');
        const newAssignment = await response.json();

        // Update local state
        setCourses(courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedChapters = (course.chapters || []).map(c => 
                    c.id === activeModuleId ? { ...c, assignments: [newAssignment, ...(c.assignments || [])] } : c
                );
                const updatedCourse = { ...course, chapters: updatedChapters };
                setSelectedCourse(updatedCourse);
                return updatedCourse;
            }
            return course;
        }));

        setIsAssignmentModalOpen(false);
        setAssignmentData({ title: "", description: "", deadline: "", max_marks: 100, file: null });
    } catch (err) {
        console.error(err);
        alert('Error adding assignment');
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
        
        fetch(`http://localhost:3000/api/courses/${course.id}/modules/reorder`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ moduleIds: newChapters.map(c => c.id) })
        }).catch(err => console.error("Failed to reorder modules", err));

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
        
        fetch(`http://localhost:3000/api/courses/${course.id}/modules/reorder`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ moduleIds: newChapters.map(c => c.id) })
        }).catch(err => console.error("Failed to reorder modules", err));

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
        
        fetch(`http://localhost:3000/api/modules/${newChapters[moduleIndex].id}/lessons/reorder`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ lessonIds: newLessons.map(l => l.id) })
        }).catch(err => console.error("Failed to reorder lessons", err));

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
        
        fetch(`http://localhost:3000/api/modules/${newChapters[moduleIndex].id}/lessons/reorder`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ lessonIds: newLessons.map(l => l.id) })
        }).catch(err => console.error("Failed to reorder lessons", err));

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
        
        fetch(`http://localhost:3000/api/lessons/${newLessons[lessonIndex].id}/resources/reorder`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ resourceIds: newResources.map(r => r.id) })
        }).catch(err => console.error("Failed to reorder resources", err));

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
        
        fetch(`http://localhost:3000/api/lessons/${newLessons[lessonIndex].id}/resources/reorder`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ resourceIds: newResources.map(r => r.id) })
        }).catch(err => console.error("Failed to reorder resources", err));

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
      await fetch(`http://localhost:3000/api/modules/${chapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: newVisibility })
      });

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
        const response = await fetch(`http://localhost:3000/api/modules/${chapterId}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete chapter');

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
        const response = await fetch(`http://localhost:3000/api/courses/${editingCourse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const updatedCourse = await response.json();
          setCourses(courses.map(c => String(c.id) === String(updatedCourse.id) ? { ...c, ...updatedCourse, id: c.id } : c));
        } else {
          console.error("Failed to edit course");
        }
      } else {
        // Create Course
        const payload = {
          ...formData,
          userId: localStorage.getItem('userId')
        };
        const response = await fetch('http://localhost:3000/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const newCourse = await response.json();
          setCourses([...courses, newCourse]);
        } else {
          console.error("Failed to create course");
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error submitting course:", error);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        const response = await fetch(`http://localhost:3000/api/courses/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setCourses(courses.filter(c => String(c.id) !== String(id)));
        } else {
          console.error("Failed to delete course");
        }
      } catch (error) {
        console.error("Error deleting course:", error);
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
                              <h4 className="font-semibold text-gray-700">{lesson.title}</h4>
                              <div className="flex items-center gap-2">
                                <div className="flex bg-white shadow-sm border rounded-md overflow-hidden mr-2">
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
                                <button className="text-gray-500">
                                  {isLessonExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </div>
                            </div>
                            {isLessonExpanded && (
                              <div className="p-4 bg-white flex flex-col gap-2">
                                {lesson.resources?.map((res, resIndex) => (
                                  <div key={res.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 border border-transparent transition-colors group">
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
                                        <p className="text-sm text-gray-800 font-medium group-hover:text-purple-600 transition-colors">{res.title}</p>
                                      </div>
                                    </a>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
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
                                    <div key={assign.id} className="border rounded-xl p-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-bold text-gray-800">{assign.title}</h5>
                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                                                {assign.maxMarks} Marks
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
            {courses.map((course) => (
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
            
            {courses.length === 0 && (
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setIsAssignmentModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Assignment</h2>
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-100 focus:border-purple-600 outline-none transition-all"
                    required
                  />
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
                <label className="block text-sm font-bold text-gray-700 mb-1">Attachment (Optional)</label>
                <input 
                  type="file" 
                  onChange={e => setAssignmentData({...assignmentData, file: e.target.files[0]})}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAssignmentModalOpen(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-md">Create</button>
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
            <button onClick={() => setIsLessonModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add Lesson</h2>
            <form onSubmit={submitLesson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                <input type="text" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} required className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Lesson 1: Introduction" />
              </div>
              <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">Create Lesson</button>
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
            <button onClick={() => setIsResourceModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add Resource</h2>
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
                  <input type="file" onChange={(e) => setResourceData({...resourceData, file: e.target.files[0]})} required className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" accept=".pdf,image/*" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link</label>
                  <input type="url" value={resourceData.url} onChange={(e) => setResourceData({...resourceData, url: e.target.value})} required className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://..." />
                </div>
              )}
              <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">Add Resource</button>
            </form>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default TeachersCourse;
