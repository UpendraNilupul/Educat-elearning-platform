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
  EyeOff
} from "lucide-react";

const TeachersCourse = ({ courses, setCourses }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({ 
    title: "", 
    category: "",
    description: "",
    thumbnail: "",
    type: "Class",
    price: 0,
    duration: "",
    level: "Beginner",
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
  const [resourceData, setResourceData] = useState({ title: "", type: "pdf", url: "" });

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setExpandedChapters(course.chapters?.map(c => c.id) || []);
  };

  const handleBackToDashboard = () => setSelectedCourse(null);

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => 
      prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]
    );
  };

  const submitChapter = (e) => {
    e.preventDefault();
    if (!chapterTitle.trim()) return;
    setCourses(courses.map(course => {
      if (course.id === selectedCourse.id) {
        if (editingChapterId) {
          // Edit existing chapter
          const updatedChapters = (course.chapters || []).map(c => 
            c.id === editingChapterId ? { ...c, title: chapterTitle } : c
          );
          const updatedCourse = { ...course, chapters: updatedChapters };
          setSelectedCourse(updatedCourse);
          return updatedCourse;
        } else {
          // Add new chapter
          const newChap = { id: Date.now(), title: chapterTitle, isVisible: true, resources: [] };
          const updatedCourse = { ...course, chapters: [...(course.chapters || []), newChap] };
          setSelectedCourse(updatedCourse);
          setExpandedChapters([...expandedChapters, newChap.id]);
          return updatedCourse;
        }
      }
      return course;
    }));
    setChapterTitle("");
    setEditingChapterId(null);
    setIsChapterModalOpen(false);
  };

  const submitResource = (e) => {
    e.preventDefault();
    if (!resourceData.title.trim()) return;
    setCourses(courses.map(course => {
      if (course.id === selectedCourse.id) {
        const updatedChapters = (course.chapters || []).map(c => 
          c.id === activeChapterId ? { ...c, resources: [...(c.resources || []), { id: Date.now(), ...resourceData }] } : c
        );
        const updatedCourse = { ...course, chapters: updatedChapters };
        setSelectedCourse(updatedCourse);
        return updatedCourse;
      }
      return course;
    }));
    setResourceData({ title: "", type: "pdf", url: "" });
    setIsResourceModalOpen(false);
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
        return updatedCourse;
      }
      return course;
    }));
  };

  const handleToggleChapterVisibility = (chapterId) => {
    setCourses(courses.map(course => {
      if (course.id === selectedCourse.id) {
        const updatedChapters = (course.chapters || []).map(c => 
          c.id === chapterId ? { ...c, isVisible: c.isVisible === false ? true : false } : c
        );
        const updatedCourse = { ...course, chapters: updatedChapters };
        setSelectedCourse(updatedCourse);
        return updatedCourse;
      }
      return course;
    }));
  };

  const handleDeleteChapter = (chapterId) => {
    if (window.confirm("Are you sure you want to delete this chapter and all its resources?")) {
      setCourses(courses.map(course => {
        if (course.id === selectedCourse.id) {
          const updatedCourse = { ...course, chapters: course.chapters.filter(c => c.id !== chapterId) };
          setSelectedCourse(updatedCourse);
          return updatedCourse;
        }
        return course;
      }));
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
      title: "", 
      category: "",
      description: "",
      thumbnail: "",
      type: "Class",
      price: 0,
      duration: "",
      level: "Beginner",
      students: 0, 
      modules: 0, 
      progress: 0 
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setFormData({ 
      title: course.title || "", 
      category: course.category || "",
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      type: course.type || "Class",
      price: course.price || 0,
      duration: course.duration || "",
      level: course.level || "Beginner",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCourse) {
      setCourses(courses.map(c => c.id === editingCourse.id ? { ...c, ...formData } : c));
    } else {
      setCourses([...courses, { id: Date.now(), ...formData }]);
    }
    handleCloseModal();
  };

  const handleDeleteCourse = (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      setCourses(courses.filter(c => c.id !== id));
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
              <Plus size={18} /> Add Chapter
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
                    <div className="p-5 flex flex-col gap-3">
                      {chapter.resources?.map(res => (
                        <div key={res.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors group">
                          {res.type === 'pdf' ? (
                            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                              <File size={20} />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                              <LinkIcon size={20} />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="text-gray-800 font-medium group-hover:text-purple-600 transition-colors">{res.title}</h4>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">{res.type}</p>
                          </div>
                          <a href={res.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-purple-600 transition-colors px-2 font-medium text-sm">
                            Open
                          </a>
                        </div>
                      ))}
                      <button 
                        onClick={() => { setActiveChapterId(chapter.id); setIsResourceModalOpen(true); }}
                        className="mt-2 flex items-center gap-2 text-purple-600 text-sm font-semibold hover:bg-purple-50 self-start px-4 py-2 rounded-lg transition-colors"
                      >
                        <Plus size={16} /> Add Resource
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {(!selectedCourse.chapters || selectedCourse.chapters.length === 0) && (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <FolderTree className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No chapters added yet. Start by adding your first chapter.</p>
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

                {/* Progress Bar */}
                <div className="mt-2 mb-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-2 font-medium">
                    <span>Avg. Completion</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  placeholder="e.g. Advanced React Patterns"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Programming"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  placeholder="Briefly describe the course..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image URL</label>
                <input
                  type="url"
                  name="thumbnail"
                  value={formData.thumbnail}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="0 for free"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. 4 Weeks or 12 Hours"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modules</label>
                  <input
                    type="number"
                    name="modules"
                    min="0"
                    value={formData.modules}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
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
      {/* Chapter Modal */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => {setIsChapterModalOpen(false); setEditingChapterId(null);}} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">{editingChapterId ? 'Edit Chapter' : 'Add Chapter'}</h2>
            <form onSubmit={submitChapter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Title</label>
                <input type="text" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} required className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Chapter 1: Introduction" />
              </div>
              <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">{editingChapterId ? 'Save Changes' : 'Create Chapter'}</button>
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
                  <option value="pdf">PDF Document</option>
                  <option value="link">External Link</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link</label>
                <input type="url" value={resourceData.url} onChange={(e) => setResourceData({...resourceData, url: e.target.value})} required className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://..." />
              </div>
              <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">Add Resource</button>
            </form>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default TeachersCourse;
