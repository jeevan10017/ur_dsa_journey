import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  createQuestion,
  updateQuestion,
  getQuestion,
} from "../../services/firestore";
import RichTextEditor from "./RichTextEditor";
import CodeEditor from "./CodeEditor";
import {
  Plus,
  Save,
  ChevronLeft,
  X,
  BookOpen,
  Code,
  FileText,
  Settings,
  Mail,
  MailX,
} from "lucide-react";
import toast from "react-hot-toast";
import Select from "react-select";
import {
  scheduleEmailReminder,
  createUserProfileIfNotExists,
  getUserPreferences,
} from "../../services/emailService";
import DSADriveLoader from "../common/DSADriveLoader";
// import { addQuestionHistory } from '../../services/firestore';
import { TOPICS } from "../../utils/constants";

const QuestionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "medium",
    code: "",
    notes: "",
    reminder: "none", 
    topics: [],
    questionLink: "",
    testCases: [{ input: "", output: "" }],
  });

  // Load user preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (user?.uid) {
        try {
          setPreferencesLoading(true);
          const preferences = await getUserPreferences(user.uid);
          setUserPreferences(preferences);
          
          // Don't change the default reminder setting based on preferences
          // Keep it as "none" until user explicitly changes it
          console.log("User preferences loaded:", preferences);
        } catch (error) {
          console.error("Error loading user preferences:", error);
          toast.error("Failed to load user preferences");
        } finally {
          setPreferencesLoading(false);
        }
      }
    };

    loadUserPreferences();
  }, [user]);

  // Load question data for editing
  useEffect(() => {
    if (isEditing && id && !preferencesLoading && user?.uid) {
      const loadQuestion = async () => {
        setLoading(true);
        try {
          const { question, error } = await getQuestion(id);
          if (error) {
            console.error("Error loading question:", error);
            toast.error("Failed to load question: " + error);
            navigate("/dashboard");
          } else if (question) {
            // Check if user owns this question
            if (question.userId !== user.uid) {
              toast.error("You do not have permission to edit this question");
              navigate("/dashboard");
              return;
            }

            // Set form data with loaded question
            setFormData({
              title: question.title || "",
              description: question.description || "",
              difficulty: question.difficulty || "medium",
              code: question.code || "",
              notes: question.notes || "",
              reminder: question.reminder || "none", 
              topics: Array.isArray(question.topics) ? question.topics : [],
              questionLink: question.questionLink || "",
              testCases:
                Array.isArray(question.testCases) &&
                question.testCases.length > 0
                  ? question.testCases.map((tc) => {
                      if (typeof tc === "object" && tc !== null) {
                        return {
                          input: tc.input || "",
                          output: tc.output || "",
                        };
                      }
                      return { input: String(tc || ""), output: "" };
                    })
                  : [{ input: "", output: "" }],
            });
            setInitialLoadComplete(true);
          } else {
            toast.error("Question not found");
            navigate("/dashboard");
          }
        } catch (err) {
          console.error("Error loading question:", err);
          toast.error("Failed to load question");
          navigate("/dashboard");
        } finally {
          setLoading(false);
        }
      };
      loadQuestion();
    } else if (!isEditing) {
      setInitialLoadComplete(true);
    }
  }, [id, isEditing, user, navigate, preferencesLoading]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRichTextChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index][field] = value;
    setFormData({ ...formData, testCases: newTestCases });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: "", output: "" }],
    });
  };

  const removeTestCase = (index) => {
    if (formData.testCases.length > 1) {
      const newTestCases = formData.testCases.filter((_, i) => i !== index);
      setFormData({ ...formData, testCases: newTestCases });
    }
  };

  const handleTopicsChange = (selectedOptions) => {
    setFormData({
      ...formData,
      topics: selectedOptions
        ? selectedOptions.map((option) => option.value)
        : [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setLoading(true);

    try {
      // Ensure user profile exists before creating questions/reminders
      console.log("Ensuring user profile exists for user:", user.uid);
      await createUserProfileIfNotExists(user.uid);

      const questionData = {
        title: formData.title.trim(),
        description: formData.description,
        difficulty: formData.difficulty,
        code: formData.code,
        notes: formData.notes,
        reminder: formData.reminder,
        topics: formData.topics,
        questionLink: formData.questionLink.trim(),
        testCases: formData.testCases.filter(
          (tc) => tc.input.trim() || tc.output.trim()
        ),
        updatedAt: new Date(),
      };

      let questionId;

      if (isEditing) {
        const { error } = await updateQuestion(id, questionData);
        if (error) {
          toast.error("Failed to update question: " + error);
          return;
        }
        questionId = id;
        console.log("Question updated successfully:", questionId);
      } else {
        const { id: newId, error } = await createQuestion(user.uid, {
          ...questionData,
          createdAt: new Date(),
        });
        if (error) {
          toast.error("Failed to add question: " + error);
          return;
        }
        questionId = newId;
        console.log("Question created successfully:", questionId);
      }

      // Schedule email reminders only if user has email reminders enabled and reminder is not 'none'
      if (
        userPreferences?.emailReminders &&
        formData.reminder &&
        formData.reminder !== "none"
      ) {
        try {
          console.log("Scheduling email reminder:", {
            userId: user.uid,
            questionId,
            reminderInterval: formData.reminder,
            userEmailReminders: userPreferences.emailReminders,
          });

          await scheduleEmailReminder(user.uid, questionId, formData.reminder);
          console.log("Email reminder scheduled successfully");
          toast.success(
            isEditing
              ? "Question updated and reminder scheduled!"
              : "Question added and reminder scheduled!"
          );
        } catch (emailError) {
          console.error("Error scheduling email reminder:", emailError);
          toast.error(
            "Question saved but failed to schedule email reminder: " +
              emailError.message
          );
        }
      } else {
        console.log("Skipping email reminder scheduling:", {
          emailRemindersEnabled: userPreferences?.emailReminders,
          reminderInterval: formData.reminder,
          reason: !userPreferences?.emailReminders
            ? "Email reminders disabled"
            : formData.reminder === "none"
            ? "Reminder set to none"
            : "No reminder selected",
        });
        toast.success(
          isEditing
            ? "Question updated successfully!"
            : "Question added successfully!"
        );
      }

      // Navigate to the question detail page
      navigate(`/question/${questionId}`);
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error(
        "An error occurred while saving: " + (error.message || error)
      );
    } finally {
      setLoading(false);
    }
  };

  const topicOptions = TOPICS.map((topic) => ({ value: topic, label: topic }));
  const selectedTopics = formData.topics.map((topic) => ({
    value: topic,
    label: topic,
  }));

  // Show loading while preferences are being loaded or question is being loaded
  if (preferencesLoading || (isEditing && !initialLoadComplete && !loading)) {
   return <DSADriveLoader />;
  }

  // Custom styles for react-select to support dark mode
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "transparent",
      borderColor: state.isFocused
        ? "rgb(236 72 153)" 
        : "rgb(209 213 219)", 
      boxShadow: state.isFocused ? "0 0 0 2px rgba(236, 72, 153, 0.2)" : "none",
      "&:hover": {
        borderColor: "rgb(236 72 153)",
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "var(--select-bg)",
      border: "1px solid var(--select-border)",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "rgb(236 72 153)"
        : state.isFocused
        ? "var(--select-option-hover)"
        : "transparent",
      color: state.isSelected ? "white" : "var(--select-text)",
      "&:hover": {
        backgroundColor: state.isSelected
          ? "rgb(236 72 153)"
          : "var(--select-option-hover)",
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "rgb(236 72 153)",
      borderRadius: "6px",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "white",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "white",
      "&:hover": {
        backgroundColor: "rgb(219 39 119)",
        color: "white",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--select-placeholder)",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "var(--select-text)",
    }),
    input: (provided) => ({
      ...provided,
      color: "var(--select-text)",
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900">
      <style jsx>{`
        :root {
          --select-bg: white;
          --select-border: rgb(209 213 219);
          --select-text: rgb(17 24 39);
          --select-placeholder: rgb(107 114 128);
          --select-option-hover: rgb(243 244 246);
        }

        .dark {
          --select-bg: rgb(31 41 55);
          --select-border: rgb(75 85 99);
          --select-text: rgb(243 244 246);
          --select-placeholder: rgb(156 163 175);
          --select-option-hover: rgb(55 65 81);
        }
      `}</style>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gradient-to-r from-gray-950 via-gray-950 to-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? "Edit Question" : "Create New Question"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEditing
                  ? "Update your coding question"
                  : "Add a new coding problem to your collection"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isEditing ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                {isEditing ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {isEditing ? "Update Question" : "Save Question"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white dark:bg-gradient-to-r from-slate-900 to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4  ">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Basic Information
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Question Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                  placeholder="Enter a descriptive title for your question"
                />
              </div>

              {/* Topics and Question Link - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Topics & Tags
                  </label>
                  <Select
                    isMulti
                    options={topicOptions}
                    value={selectedTopics}
                    onChange={handleTopicsChange}
                    styles={selectStyles}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select relevant topics..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="questionLink"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Question Link
                  </label>
                  <input
                    type="url"
                    id="questionLink"
                    value={formData.questionLink}
                    onChange={(e) =>
                      setFormData({ ...formData, questionLink: e.target.value })
                    }
                    className="w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                    placeholder="https://leetcode.com/problems/..."
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Problem Description *
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) =>
                      handleRichTextChange("description", value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout for Test Cases and Code */}
          <div className="grid grid-cols-1 xl:grid-cols-7 gap-8">
            {/* Test Cases Section */}
            <div className="bg-white dark:bg-gradient-to-r from-slate-900 to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden xl:col-span-2">
              <div className="px-6 py-4 ">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Test Cases
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {formData.testCases.map((testCase, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Test Case {index + 1}
                        </span>
                        {formData.testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTestCase(index)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Input
                          </label>
                          <textarea
                            value={testCase.input}
                            onChange={(e) =>
                              handleTestCaseChange(
                                index,
                                "input",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none font-mono"
                            rows={3}
                            placeholder="[1,2,3,4]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Expected Output
                          </label>
                          <textarea
                            value={testCase.output}
                            onChange={(e) =>
                              handleTestCaseChange(
                                index,
                                "output",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none font-mono"
                            rows={3}
                            placeholder="10"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTestCase}
                    className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Test Case
                  </button>
                </div>
              </div>
            </div>

            {/* Code Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-gradient-to-r from-slate-900 to-gray-900 xl:col-span-5">
              <div className="px-6 py-4 ">
                <div className="flex items-center space-x-2">
                  <Code className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Solution Code
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <CodeEditor
                  value={formData.code}
                  onChange={(value) => handleRichTextChange("code", value)}
                />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-gradient-to-r from-slate-900 to-gray-900 overflow-hidden">
            <div className="px-6 py-4 ">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notes & Hints
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <RichTextEditor
                  value={formData.notes}
                  onChange={(value) => handleRichTextChange("notes", value)}
                />
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 dark:bg-gradient-to-r from-slate-900 to-gray-900 overflow-hidden">
            <div className="px-6 py-4 ">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Question Settings
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Difficulty Level
                  </label>
                  <div className="space-y-3">
                    {[
                      {
                        value: "easy",
                        label: "Easy",
                        color: "text-green-600 dark:text-green-400",
                      },
                      {
                        value: "medium",
                        label: "Medium",
                        color: "text-yellow-600 dark:text-yellow-400",
                      },
                      {
                        value: "hard",
                        label: "Hard",
                        color: "text-red-600 dark:text-red-400",
                      },
                    ].map((level) => (
                      <label key={level.value} className="flex items-center">
                        <input
                          type="radio"
                          name="difficulty"
                          value={level.value}
                          checked={formData.difficulty === level.value}
                          onChange={handleChange}
                          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-gray-600"
                        />
                        <span
                          className={`ml-3 text-sm font-medium ${level.color}`}
                        >
                          {level.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <label
                      htmlFor="reminder"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Reminder Schedule
                    </label>
                    {userPreferences?.emailReminders ? (
                      <Mail
                        className="h-4 w-4 text-green-500"
                        title="Email reminders enabled"
                      />
                    ) : (
                      <MailX
                        className="h-4 w-4 text-red-500"
                        title="Email reminders disabled"
                      />
                    )}
                  </div>

                  {userPreferences?.emailReminders ? (
                    <select
                      id="reminder"
                      name="reminder"
                      value={formData.reminder}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                    >
                      <option value="none">No Reminder</option>
                      <option value="7_days">After 7 Days</option>
                      <option value="14_days">After 2 Weeks</option>
                      <option value="30_days">After 1 Month</option>
                    </select>
                  ) : (
                    <div className="w-full px-4 py-3 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <MailX className="h-4 w-4" />
                        <span className="text-sm">
                          Email reminders disabled in profile
                        </span>
                      </div>
                      <p className="text-xs mt-1">
                        Enable email reminders in your profile to use reminder
                        schedules
                      </p>
                    </div>
                  )}

                  {userPreferences?.emailReminders && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Reminders will be sent to your registered email address
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm;
