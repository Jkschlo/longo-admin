"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Circle,
  ClipboardList,
  X,
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

  const [form, setForm] = useState({
    question_text: "",
    options: ["", "", "", ""],
    correct_index: 0,
  });

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
    });
    setEditId(null);
  };

  // ---------------- Create Question ----------------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await supabase.from("quiz_questions").insert({
      module_id: id,
      question_text: form.question_text.trim(),
      options: form.options.map((o) => o.trim()),
      correct_index: form.correct_index,
      order_index: questions.length, // next index
    });

    await fetchQuizData();
    resetForm();
    setIsModalOpen(false);
    setSaving(false);
  };

  // ---------------- Edit Question ----------------
  const openEditModal = (q: Question) => {
    setForm({
      question_text: q.question_text,
      options: q.options.length ? q.options : ["", "", "", ""],
      correct_index: q.correct_index ?? 0,
    });
    setEditId(q.id);
    setIsModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);

    await supabase
      .from("quiz_questions")
      .update({
        question_text: form.question_text.trim(),
        options: form.options.map((o) => o.trim()),
        correct_index: form.correct_index,
      })
      .eq("id", editId);

    await fetchQuizData();
    resetForm();
    setIsModalOpen(false);
    setSaving(false);
  };

  // ---------------- Delete Question ----------------
  const handleDelete = async (qid: string) => {
    if (!confirm("Delete this question?")) return;

    await supabase.from("quiz_questions").delete().eq("id", qid);

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
                    onClick={() => handleDelete(q.id)}
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
    </div>
  );
}
