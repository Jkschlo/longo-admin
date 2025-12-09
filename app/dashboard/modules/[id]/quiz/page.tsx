"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { authenticatedFetch } from "@/lib/api-client";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Circle,
  ClipboardList,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

// ---------------- Types ----------------
interface ModuleData {
  id: string;
  title: string;
  description: string | null;
}

interface Question {
  id: string;
  module_id: string;
  question_text: string;
  options: string[];
  correct_index: number | null;
  order_index: number;
  image_url?: string | null;
}

// ---------------- Component ----------------
export default function QuizBuilderPage() {
  const { id } = useParams();
  const router = useRouter();

  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal + form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string | null;
    questionText: string;
  }>({ id: null, questionText: "" });

  const [form, setForm] = useState({
    question_text: "",
    options: ["", "", "", ""],
    correct_index: 0,
    image_url: "",
  });

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // fetch module & quiz questions
  const fetchQuizData = async () => {
    setLoading(true);

    const [{ data: mod }, { data: qs }] = await Promise.all([
      supabase.from("modules").select("*").eq("id", id).single(),
      supabase
        .from("quiz_questions")
        .select("*")
        .eq("module_id", id)
        .order("order_index", { ascending: true }),
    ]);

    if (mod) setModuleData(mod);
    if (qs) setQuestions(qs);

    setLoading(false);
  };

  useEffect(() => {
    fetchQuizData();
  }, [id]);

  // ---------------- Reset Form ----------------
  const resetForm = () => {
    setForm({
      question_text: "",
      options: ["", "", "", ""],
      correct_index: 0,
      image_url: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setUploadError(null);
    setEditId(null);
  };

  // ---------------- Image Upload ----------------
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Reject GIF files
    if (file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif")) {
      setUploadError("GIF files are not allowed. Please use PNG or JPG images.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB");
      return;
    }

    setImageFile(file);
    setUploadError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setUploadingImage(true);
    setUploadError(null);

    try {
      console.log("Starting image upload...", { fileName: imageFile.name, size: imageFile.size });
      
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("folder", "quiz-questions");

      console.log("Calling authenticatedFetch...");
      
      let response: Response;
      try {
        // Use a simpler approach without AbortController for now
        response = await authenticatedFetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });
        console.log("Response received:", { status: response.status, ok: response.ok });
      } catch (fetchErr: any) {
        console.error("authenticatedFetch error:", fetchErr);
        throw new Error(`Failed to connect to server: ${fetchErr.message || "Network error"}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed with status:", response.status, errorText);
        let errorMessage = "Upload failed";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Upload result:", result);

      if (!result.url) {
        throw new Error("No URL returned from upload");
      }

      console.log("Upload successful, URL:", result.url);
      return result.url;
    } catch (err: any) {
      console.error("Upload error:", err);
      const errorMessage = err.message || "Image upload failed. Please try again.";
      setUploadError(errorMessage);
      return null;
    } finally {
      console.log("Upload process finished, resetting uploading state");
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, image_url: "" });
    setUploadError(null);
  };

  // ---------------- Create Question ----------------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploadError(null);

    try {
      // Upload image if a new one was selected (only if we have a file and no existing URL)
      let imageUrl = form.image_url || null;
      if (imageFile) {
        console.log("Uploading image...");
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          console.log("Image uploaded successfully:", uploadedUrl);
        } else {
          console.error("Image upload failed - but continuing without image");
          // Continue without image if upload fails (user can retry later)
          imageUrl = null;
        }
      }

      console.log("Creating question with imageUrl:", imageUrl);
      const { error } = await supabase.from("quiz_questions").insert({
        module_id: id,
        question_text: form.question_text.trim(),
        options: form.options.map((o) => o.trim()),
        correct_index: form.correct_index,
        order_index: questions.length, // next index
        image_url: imageUrl,
      });

      if (error) {
        console.error("Error creating question:", error);
        setUploadError(error.message || "Failed to create question. Please try again.");
        setSaving(false);
        return;
      }

      console.log("Question created successfully");
      await fetchQuizData();
      resetForm();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Unexpected error creating question:", err);
      setUploadError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  // ---------------- Edit Question ----------------
  const openEditModal = (q: Question) => {
    setForm({
      question_text: q.question_text,
      options: q.options.length ? q.options : ["", "", "", ""],
      correct_index: q.correct_index ?? 0,
      image_url: q.image_url || "",
    });
    setImageFile(null);
    setImagePreview(q.image_url || null);
    setUploadError(null);
    setEditId(q.id);
    setIsModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    setUploadError(null);

    try {
      // Upload image if a new one was selected
      let imageUrl = form.image_url || null;
      if (imageFile) {
        console.log("Uploading image...");
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          console.log("Image uploaded successfully:", uploadedUrl);
        } else {
          console.error("Image upload failed - but continuing without image");
          // Continue without image if upload fails (user can retry later)
          imageUrl = form.image_url || null;
        }
      }

      console.log("Updating question with imageUrl:", imageUrl);
      const { error } = await supabase
        .from("quiz_questions")
        .update({
          question_text: form.question_text.trim(),
          options: form.options.map((o) => o.trim()),
          correct_index: form.correct_index,
          image_url: imageUrl,
        })
        .eq("id", editId);

      if (error) {
        console.error("Error updating question:", error);
        setUploadError(error.message || "Failed to update question. Please try again.");
        setSaving(false);
        return;
      }

      console.log("Question updated successfully");
      await fetchQuizData();
      resetForm();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Unexpected error updating question:", err);
      setUploadError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  // ---------------- Delete Question ----------------
  const openDeleteConfirm = (q: Question) => {
    setDeleteConfirm({
      id: q.id,
      questionText: q.question_text,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;

    await supabase.from("quiz_questions").delete().eq("id", deleteConfirm.id);

    // reindex remaining questions
    const { data: remaining } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("module_id", id)
      .order("order_index");

    if (remaining) {
      const updates = remaining.map((q: any, i: number) => ({
        id: q.id,
        order_index: i,
      }));
      await supabase.from("quiz_questions").upsert(updates);
    }

    setDeleteConfirm({ id: null, questionText: "" });
    await fetchQuizData();
  };

  return (
    <div className="w-full max-w-[95%] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push(`/dashboard/modules`)}
          className="flex items-center gap-2 text-[#0A2C57] hover:text-[#6EC1E4] transition cursor-pointer font-medium"
        >
          <ArrowLeft size={20} /> Back to Content
        </button>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#6EC1E4] hover:bg-[#5bb7de] text-white px-5 py-2.5 rounded-lg font-semibold transition cursor-pointer shadow-sm hover:shadow-md"
        >
          <Plus size={18} /> Add Question
        </button>
      </div>

      {/* Module Info */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8 p-8 text-center">
          <p className="text-gray-500">Loading quiz...</p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#0A2C57] to-[#093075] text-white rounded-xl shadow-lg mb-8 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {moduleData?.title}
              </h1>
              <p className="text-white/80 text-sm">
                {moduleData?.description || "No module description"}
              </p>
            </div>
            <div className="ml-4 bg-white/10 rounded-lg p-4">
              <ClipboardList size={32} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <span className="text-sm text-white/70">
              {questions.length} {questions.length === 1 ? "Question" : "Questions"}
            </span>
          </div>
        </div>
      )}

      {/* Questions List */}
      {!loading && questions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl shadow-sm p-12 text-center">
          <ClipboardList size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Quiz Questions Yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first question to this quiz.</p>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-[#6EC1E4] hover:bg-[#5bb7de] text-white px-5 py-2.5 rounded-lg font-semibold transition cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus size={18} /> Add First Question
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#E8F4FA] text-[#0A2C57] rounded-lg font-bold text-sm">
                      {index + 1}
                    </div>
                    <h2 className="font-semibold text-lg text-[#0A2C57] flex-1">
                      {q.question_text}
                    </h2>
                  </div>
                  {q.image_url && (
                    <div className="mt-3 ml-11">
                      <div className="relative w-full max-w-[150px] rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={q.image_url}
                          alt="Question image"
                          width={150}
                          height={112}
                          className="w-full h-auto object-contain max-h-[112px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-2.5 hover:bg-[#E8F4FA] rounded-lg transition cursor-pointer"
                    title="Edit Question"
                  >
                    <Pencil
                      size={20}
                      className="text-gray-500 hover:text-[#6EC1E4]"
                    />
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(q)}
                    className="p-2.5 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Delete Question"
                  >
                    <Trash2
                      size={20}
                      className="text-red-500 hover:text-red-600"
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pl-11">
                {q.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                      i === q.correct_index
                        ? "bg-[#E8F4FA] border-[#6EC1E4] border-2"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {i === q.correct_index ? (
                      <CheckCircle size={20} className="text-[#6EC1E4] flex-shrink-0" />
                    ) : (
                      <Circle size={20} className="text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`flex-1 ${
                      i === q.correct_index
                        ? "text-[#0A2C57] font-medium"
                        : "text-gray-600"
                    }`}>
                      {opt}
                    </span>
                    {i === q.correct_index && (
                      <span className="text-xs bg-[#6EC1E4] text-white px-2 py-1 rounded-full font-semibold">
                        Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white w-full max-w-2xl rounded-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#0A2C57]">
                {editId ? "Edit Question" : "Add New Question"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={editId ? handleUpdate : handleCreate} className="space-y-6">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Question Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.question_text}
                  onChange={(e) =>
                    setForm({ ...form, question_text: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition"
                  rows={4}
                  placeholder="Enter your question here..."
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Question Image <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                </label>
                
                {imagePreview ? (
                  <div className="relative border-2 border-gray-300 rounded-lg p-2 bg-gray-50">
                    <div className="relative w-full max-w-[120px] mx-auto">
                      <Image
                        src={imagePreview}
                        alt="Question preview"
                        width={120}
                        height={90}
                        className="rounded-lg object-contain w-full h-auto max-h-[90px]"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition cursor-pointer"
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {uploadingImage && (
                      <div className="mt-2 text-center text-sm text-gray-600">
                        Uploading...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#6EC1E4] transition">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="question-image-upload"
                    />
                    <label
                      htmlFor="question-image-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <div className="bg-[#E8F4FA] rounded-full p-3 mb-3">
                        <ImageIcon className="text-[#6EC1E4]" size={24} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 mb-1">
                        Click to upload an image
                      </span>
                      <span className="text-xs text-gray-500">
                        PNG, JPG up to 5MB
                      </span>
                    </label>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Answer Options <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {form.options.map((opt, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition ${
                        form.correct_index === i
                          ? "bg-[#E8F4FA] border-[#6EC1E4]"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="correct"
                        checked={form.correct_index === i}
                        onChange={() =>
                          setForm({ ...form, correct_index: i })
                        }
                        className="accent-[#6EC1E4] cursor-pointer w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-600 w-8">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOps = [...form.options];
                          newOps[i] = e.target.value;
                          setForm({ ...form, options: newOps });
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition"
                        required
                      />
                      {form.correct_index === i && (
                        <span className="text-xs bg-[#6EC1E4] text-white px-2 py-1 rounded-full font-semibold">
                          Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select the radio button next to the correct answer
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium cursor-pointer transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#6EC1E4] hover:bg-[#5bb7de] text-white px-6 py-2.5 rounded-lg font-semibold cursor-pointer transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving
                    ? "Saving..."
                    : editId
                    ? "Save Changes"
                    : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.id && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative"
          >
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={32} className="text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-[#0A2C57] text-center mb-2">
              Delete Question?
            </h2>

            {/* Warning Message */}
            <p className="text-gray-600 text-center mb-4">
              This will permanently delete this question. This action cannot be undone.
            </p>

            {/* Question Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500 mb-1">Question:</p>
              <p className="text-sm font-medium text-gray-800 line-clamp-2">
                {deleteConfirm.questionText}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm({ id: null, questionText: "" })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
