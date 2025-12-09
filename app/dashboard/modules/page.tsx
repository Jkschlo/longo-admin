/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { authenticatedFetch } from "@/lib/api-client";
import { Plus, Pencil, Trash2, Image as ImageIcon, X, ChevronDown, ChevronRight, FolderOpen, GripVertical, FileText } from "lucide-react";
import { Switch } from "@headlessui/react";
import Cropper, { Area } from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

/* ------------------------------------------------------------------
   Interfaces
------------------------------------------------------------------ */
interface Module {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  cover_image: string | null;
  sop_url: string | null;
  is_active: boolean;
  created_at?: string;
}

interface Category {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  is_active: boolean;
  role_id: string | null;
  created_at?: string;
}

interface Role {
  id: string;
  name: string;
}

interface ContentBlock {
  id?: string;
  type: "section" | "text" | "image" | "video" | "pdf";
  content: string;
  caption?: string | null;
  order_index: number;
}

/* ------------------------------------------------------------------
   Component
------------------------------------------------------------------ */
export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Modal states
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editModuleId, setEditModuleId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  // Module form
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    category_id: "",
    cover_image: "",
    is_active: true,
  });

  // Category form
  const [categoryForm, setCategoryForm] = useState({
    title: "",
    description: "",
    cover_image: "",
    is_active: true,
    role_id: "",
  });

  const [categoryErrors, setCategoryErrors] = useState<{ title?: string; role?: string; cover_image?: string }>({});
  const [moduleErrors, setModuleErrors] = useState<{ title?: string; category_id?: string; cover_image?: string }>({});

  // blocks for modules
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  // upload + crop
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "category" | "module" | null; id: string | null; name: string }>({ type: null, id: null, name: "" });

  // SOP upload states
  const [isSOPModalOpen, setIsSOPModalOpen] = useState(false);
  const [sopUrl, setSopUrl] = useState<string | null>(null);
  const [sopFile, setSopFile] = useState<File | null>(null);
  const [sopPreviewUrl, setSopPreviewUrl] = useState<string | null>(null);
  const [uploadingSOP, setUploadingSOP] = useState(false);

  /* ------------------------------------------------------------------
     Fetch Data
  ------------------------------------------------------------------ */
  const fetchData = async () => {
    setLoading(true);
    const [{ data: moduleData }, { data: catData }, { data: roleData }] = await Promise.all([
      supabase.from("modules").select("*").order("created_at", { ascending: true }),
      supabase.from("categories").select("*").order("created_at", { ascending: true }),
      supabase.from("roles").select("*").order("name"),
    ]);
    if (moduleData) setModules(moduleData);
    if (catData) {
      setCategories(catData);
      // Categories start collapsed by default
      setExpandedCategories(new Set());
    }
    if (roleData) setRoles(roleData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedCategories(new Set(categories.map((c) => c.id)));
  const collapseAll = () => setExpandedCategories(new Set());

  /* ------------------------------------------------------------------
     Crop + Upload
  ------------------------------------------------------------------ */
  const onCropComplete = useCallback(
    (_: unknown, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = url;
    });

  const getCroppedImageBlob = async (): Promise<Blob | null> => {
    if (!previewUrl || !croppedAreaPixels) return null;
    const image = await createImage(previewUrl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const { width, height } = croppedAreaPixels;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, width, height, 0, 0, width, height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg");
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropOpen(true);
  };

  const uploadImageAndGetUrl = async (folder: string) => {
    if (!imageFile || !previewUrl) {
      setUploadError("No image selected.");
      return null;
    }
    
    setUploadError(null);
    try {
      let fileToUpload: Blob;
      
      // If no crop area is set yet, use the original file
      if (!croppedAreaPixels) {
        fileToUpload = imageFile;
      } else {
        // Use cropped image
        const croppedBlob = await getCroppedImageBlob();
        if (!croppedBlob) {
          setUploadError("Failed to process cropped image.");
          return null;
        }
        fileToUpload = croppedBlob;
      }
      
      // Upload via API route (bypasses RLS)
      const formData = new FormData();
      formData.append("file", fileToUpload, "image.jpg");
      formData.append("folder", folder);
      
      const response = await authenticatedFetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }
      
      return result.url;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Image upload failed. Please try again.";
      console.error("Upload error:", err);
      setUploadError(message);
      return null;
    }
  };

  /* ------------------------------------------------------------------
     Block Helpers (for modules)
  ------------------------------------------------------------------ */
  const syncModuleJSON = async (moduleId: string, newBlocks: ContentBlock[]) => {
    const sorted = [...newBlocks].sort((a, b) => a.order_index - b.order_index);
    const json = sorted.map((b) => ({ 
      type: b.type, 
      content: b.content, 
      caption: b.caption || "",
      order_index: b.order_index 
    }));
    await supabase.from("modules").update({ content_json: json }).eq("id", moduleId);
  };

  const loadBlocks = async (moduleId: string) => {
    const { data } = await supabase
      .from("module_content")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true });
    return data || [];
  };

  const addBlockAtPosition = async (type: ContentBlock["type"], insertIndex: number) => {
    // For new modules, create temporary blocks that will be saved after module creation
    if (!editModuleId) {
      const tempBlock: ContentBlock = {
        id: `temp-${Date.now()}-${Math.random()}`,
        type,
        content: "",
        caption: null,
        order_index: insertIndex,
      };
      const updated = [
        ...blocks.slice(0, insertIndex),
        tempBlock,
        ...blocks.slice(insertIndex).map((b) => ({ ...b, order_index: b.order_index + 1 })),
      ];
      setBlocks(updated);
      return;
    }

    // For existing modules, save to database immediately
    // First, update order_index of blocks after insertion point
    const blocksToUpdate = blocks
      .slice(insertIndex)
      .map((b) => ({ id: b.id, order_index: b.order_index + 1 }))
      .filter((b) => b.id && !b.id.startsWith("temp-"));
    
    if (blocksToUpdate.length > 0) {
      await supabase.from("module_content").upsert(blocksToUpdate);
    }

    const newBlock = { module_id: editModuleId, type, content: "", caption: "", order_index: insertIndex };
    const { data, error } = await supabase.from("module_content").insert([newBlock]).select().single();
    if (error) {
      console.error("Error creating block:", error);
      setUploadError(`Failed to create ${type} block: ${error.message}. ${error.details || ''}`);
      return;
    }
    if (data) {
      const updated = [
        ...blocks.slice(0, insertIndex),
        data,
        ...blocks.slice(insertIndex).map((b) => ({ ...b, order_index: b.order_index + 1 })),
      ];
      setBlocks(updated);
      await syncModuleJSON(editModuleId, updated);
    }
  };

  const addBlock = async (type: ContentBlock["type"]) => {
    // Count existing sections to name new section
    const sectionCount = blocks.filter((b) => b.type === "section").length;
    const sectionName = type === "section" ? `Section ${sectionCount + 1}` : "";
    
    // For sections, add at the end
    const insertIndex = blocks.length;
    
    if (type === "section") {
      // Create section with proper name
      if (!editModuleId) {
        const tempBlock: ContentBlock = {
          id: `temp-${Date.now()}-${Math.random()}`,
          type: "section",
          content: sectionName,
          caption: null,
          order_index: insertIndex,
        };
        const updated = [...blocks, tempBlock];
        setBlocks(updated);
        const sectionIdx = updated.length - 1;
        setExpandedSections((prev) => new Set([...prev, sectionIdx]));
      } else {
        const newBlock = { module_id: editModuleId, type: "section", content: sectionName, caption: "", order_index: insertIndex };
        const { data, error } = await supabase.from("module_content").insert([newBlock]).select().single();
        if (!error && data) {
          const updated = [...blocks, data];
          setBlocks(updated);
          const sectionIdx = updated.length - 1;
          setExpandedSections((prev) => new Set([...prev, sectionIdx]));
          await syncModuleJSON(editModuleId, updated);
        }
      }
    } else {
      await addBlockAtPosition(type, insertIndex);
    }
  };

  const updateBlockField = async (blockId: string | undefined, field: string, value: string) => {
    if (!blockId) return;
    const updated = blocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b));
    setBlocks(updated);
    
    // Only update database if block has a real ID (not temp)
    if (blockId && !blockId.startsWith("temp-") && editModuleId) {
      await supabase.from("module_content").update({ [field]: value }).eq("id", blockId);
      await syncModuleJSON(editModuleId, updated);
    }
  };

  const removeBlock = async (blockId?: string) => {
    if (!blockId) return;
    
    // For temp blocks, just remove from state
    if (blockId.startsWith("temp-")) {
      setBlocks(blocks.filter((b) => b.id !== blockId));
      return;
    }
    
    // For real blocks, delete from database
    await supabase.from("module_content").delete().eq("id", blockId);
    const updated = blocks.filter((b) => b.id !== blockId);
    setBlocks(updated);
    if (editModuleId) await syncModuleJSON(editModuleId, updated);
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId?: string) => {
    const file = e.target.files?.[0];
    if (!file || !blockId) return;
    
    // For temp blocks, just create a preview URL
    if (blockId.startsWith("temp-")) {
      const preview = URL.createObjectURL(file);
      await updateBlockField(blockId, "content", preview);
      return;
    }
    
    // For real blocks, upload to storage via API route
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "module-content");
      
      const response = await authenticatedFetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setUploadError(result.error || "Image upload failed. Please try again.");
        return;
      }
      
      await updateBlockField(blockId, "content", result.url);
    } catch (err: unknown) {
      console.error("Content image upload error:", err);
      setUploadError("Image upload failed. Please try again.");
    }
  };

  const handleContentPDFUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId?: string) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.error("No file selected");
      return;
    }
    
    if (!blockId) {
      console.error("No block ID provided");
      setUploadError("Error: Block ID missing. Please try again.");
      return;
    }
    
    // Check file type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please upload a PDF file.");
      return;
    }
    
    setUploadError(""); // Clear any previous errors
    
    // For temp blocks, just create a preview URL
    if (blockId.startsWith("temp-")) {
      try {
        const preview = URL.createObjectURL(file);
        await updateBlockField(blockId, "content", preview);
      } catch (err: unknown) {
        console.error("Temp PDF preview error:", err);
        setUploadError("Failed to create PDF preview.");
      }
      return;
    }
    
    // For real blocks, upload to storage via API route
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "module-content");
      
      const response = await authenticatedFetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error("PDF upload API error:", result);
        setUploadError(result.error || "PDF upload failed. Please try again.");
        return;
      }
      
      if (!result.url) {
        console.error("PDF upload succeeded but no URL returned:", result);
        setUploadError("Upload succeeded but no URL returned. Please try again.");
        return;
      }
      
      await updateBlockField(blockId, "content", result.url);
      console.log("PDF uploaded successfully:", result.url);
      setUploadError(""); // Clear error on success
    } catch (err: unknown) {
      console.error("Content PDF upload error:", err);
      setUploadError("PDF upload failed. Please try again.");
    }
  };

  /* ------------------------------------------------------------------
     SOP Upload Handlers
  ------------------------------------------------------------------ */
  const openSOPModal = () => {
    setSopFile(null);
    setUploadError(null);
    setIsSOPModalOpen(true);
  };

  const handleSOPFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please upload a PDF file.");
      return;
    }
    
    setSopFile(file);
    setSopPreviewUrl(URL.createObjectURL(file));
    setUploadError(null);
  };

  const handleSOPSave = async () => {
    if (!editModuleId) return;
    
    if (!sopFile && !sopUrl) {
      setUploadError("Please select a PDF file.");
      return;
    }
    
    setUploadingSOP(true);
    setUploadError(null);
    
    try {
      let finalSopUrl = sopUrl;
      
      // If a new file was selected, upload it
      if (sopFile) {
        const formData = new FormData();
        formData.append("file", sopFile);
        formData.append("folder", "module-content");
        
        const response = await authenticatedFetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          setUploadError(result.error || "SOP upload failed. Please try again.");
          setUploadingSOP(false);
          return;
        }
        
        if (!result.url) {
          setUploadError("Upload succeeded but no URL returned. Please try again.");
          setUploadingSOP(false);
          return;
        }
        
        finalSopUrl = result.url;
      }
      
      // Update module with SOP URL
      const { error } = await supabase
        .from("modules")
        .update({ sop_url: finalSopUrl })
        .eq("id", editModuleId);
      
      if (error) {
        setUploadError("Failed to save SOP. Please try again.");
        setUploadingSOP(false);
        return;
      }
      
      // Update local state
      setSopUrl(finalSopUrl);
      setSopPreviewUrl(finalSopUrl);
      
      // Update modules list
      setModules((prev) =>
        prev.map((m) => (m.id === editModuleId ? { ...m, sop_url: finalSopUrl } : m))
      );
      
      setIsSOPModalOpen(false);
      setSopFile(null);
      setUploadError(null);
    } catch (err: unknown) {
      console.error("SOP upload error:", err);
      setUploadError("SOP upload failed. Please try again.");
    } finally {
      setUploadingSOP(false);
    }
  };

  const handleSOPDelete = async () => {
    if (!editModuleId) return;
    
    setUploadingSOP(true);
    setUploadError(null);
    
    try {
      const { error } = await supabase
        .from("modules")
        .update({ sop_url: null })
        .eq("id", editModuleId);
      
      if (error) {
        setUploadError("Failed to delete SOP. Please try again.");
        setUploadingSOP(false);
        return;
      }
      
      // Update local state
      setSopUrl(null);
      setSopPreviewUrl(null);
      
      // Update modules list
      setModules((prev) =>
        prev.map((m) => (m.id === editModuleId ? { ...m, sop_url: null } : m))
      );
      
      setIsSOPModalOpen(false);
      setSopFile(null);
      setUploadError(null);
    } catch (err: unknown) {
      console.error("SOP delete error:", err);
      setUploadError("Failed to delete SOP. Please try again.");
    } finally {
      setUploadingSOP(false);
    }
  };

  /* ------------------------------------------------------------------
     Category CRUD
  ------------------------------------------------------------------ */
  const openCategoryModal = (cat?: Category) => {
    setImageFile(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCategoryErrors({});
    
    // Reset file input
    const fileInput = document.getElementById("catImageUpload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    
    if (cat) {
      setEditCategoryId(cat.id);
      setCategoryForm({ title: cat.title, description: cat.description || "", cover_image: cat.cover_image || "", is_active: cat.is_active, role_id: cat.role_id || "" });
      setPreviewUrl(cat.cover_image || null);
    } else {
      setEditCategoryId(null);
      setCategoryForm({ title: "", description: "", cover_image: "", is_active: true, role_id: "" });
      setPreviewUrl(null);
    }
    setIsCategoryModalOpen(true);
  };

  const handleCategorySave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const errors: { title?: string; role?: string; cover_image?: string } = {};
    
    if (!categoryForm.title.trim()) {
      errors.title = "Title is required.";
    }
    
    if (!categoryForm.role_id) {
      errors.role = "Please select a role.";
    }
    
    // Check if cover image exists (either existing or newly uploaded)
    const hasExistingImage = !!categoryForm.cover_image;
    const hasNewImage = !!imageFile || !!previewUrl;
    if (!hasExistingImage && !hasNewImage) {
      errors.cover_image = "Please upload a cover image.";
    }
    
    if (Object.keys(errors).length > 0) {
      setCategoryErrors(errors);
      return;
    }
    
    setCategoryErrors({});
    setSaving(true);
    let imageUrl: string | null = categoryForm.cover_image || null;
    if (imageFile) imageUrl = await uploadImageAndGetUrl("categories");

    if (editCategoryId) {
      await supabase.from("categories").update({ title: categoryForm.title.trim(), description: categoryForm.description.trim(), role_id: categoryForm.role_id, cover_image: imageUrl, is_active: categoryForm.is_active }).eq("id", editCategoryId);
    } else {
      await supabase.from("categories").insert({ title: categoryForm.title.trim(), description: categoryForm.description.trim(), role_id: categoryForm.role_id, cover_image: imageUrl, is_active: categoryForm.is_active });
    }
    await fetchData();
    setIsCategoryModalOpen(false);
    setSaving(false);
  };

  const handleCategoryDelete = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      setDeleteConfirm({ type: "category", id, name: cat.title });
    }
  };

  const confirmCategoryDelete = async () => {
    if (!deleteConfirm.id) return;
    await supabase.from("modules").delete().eq("category_id", deleteConfirm.id);
    await supabase.from("categories").delete().eq("id", deleteConfirm.id);
    setCategories((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
    setModules((prev) => prev.filter((m) => m.category_id !== deleteConfirm.id));
    setDeleteConfirm({ type: null, id: null, name: "" });
  };

  /* ------------------------------------------------------------------
     Module CRUD
  ------------------------------------------------------------------ */
  const openModuleModal = async (mod?: Module, categoryId?: string) => {
    setImageFile(null);
    setUploadError(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setModuleErrors({});
    
    // Reset file input
    const fileInput = document.getElementById("modImageUpload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    
    if (mod) {
      setModalLoading(true);
      setEditModuleId(mod.id);
      setModuleForm({ title: mod.title, description: mod.description || "", category_id: mod.category_id, cover_image: mod.cover_image || "", is_active: mod.is_active });
      setPreviewUrl(mod.cover_image || null);
      setSopUrl(mod.sop_url || null);
      setSopPreviewUrl(mod.sop_url || null);
      const loadedBlocks = await loadBlocks(mod.id);
      setBlocks(loadedBlocks);
      
      // Auto-expand all sections when opening
      const sectionIndices = loadedBlocks
        .map((b: ContentBlock, i: number) => (b.type === "section" ? i : -1))
        .filter((i: number) => i !== -1);
      setExpandedSections(new Set(sectionIndices));
      
      // Check if quiz exists
      const { data: quizData } = await supabase
        .from("quiz_questions")
        .select("id")
        .eq("module_id", mod.id)
        .limit(1);
      setHasQuiz((quizData?.length ?? 0) > 0);
      
      setModalLoading(false);
    } else {
      setEditModuleId(null);
      setModuleForm({ title: "", description: "", category_id: categoryId || "", cover_image: "", is_active: true });
      setPreviewUrl(null);
      setSopUrl(null);
      setSopPreviewUrl(null);
      setBlocks([]);
      setHasQuiz(false);
      setExpandedSections(new Set());
    }
    setIsModuleModalOpen(true);
  };

  const handleModuleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const errors: { title?: string; category_id?: string; cover_image?: string } = {};
    
    if (!moduleForm.title.trim()) {
      errors.title = "Title is required.";
    }
    
    if (!moduleForm.category_id) {
      errors.category_id = "Please select a category.";
    }
    
    // Check if cover image exists (either existing or newly uploaded)
    const hasExistingImage = !!moduleForm.cover_image;
    const hasNewImage = !!imageFile || !!previewUrl;
    if (!hasExistingImage && !hasNewImage) {
      errors.cover_image = "Please upload a cover image.";
    }
    
    if (Object.keys(errors).length > 0) {
      setModuleErrors(errors);
      return;
    }
    
    setModuleErrors({});
    setSaving(true);
    let imageUrl = moduleForm.cover_image || null;
    if (imageFile) imageUrl = (await uploadImageAndGetUrl("modules")) || null;

    if (editModuleId) {
      // Update existing module
      await supabase.from("modules").update({ title: moduleForm.title, description: moduleForm.description, category_id: moduleForm.category_id, cover_image: imageUrl, sop_url: sopUrl, is_active: moduleForm.is_active }).eq("id", editModuleId);
      
      // Save all blocks (including any temp ones that need to be created)
      const blocksToSave = blocks.map((b, i) => ({
        ...b,
        order_index: i,
      }));
      
      // Separate temp blocks from existing blocks
      const tempBlocks = blocksToSave.filter((b) => b.id?.startsWith("temp-"));
      const existingBlocks = blocksToSave.filter((b) => b.id && !b.id.startsWith("temp-"));
      
      // Update existing blocks
      for (const block of existingBlocks) {
        if (block.id) {
          await supabase.from("module_content").update({
            type: block.type,
            content: block.content,
            caption: block.caption || "",
            order_index: block.order_index,
          }).eq("id", block.id);
        }
      }
      
      // Create new blocks from temp ones
      if (tempBlocks.length > 0) {
        const newBlocks = tempBlocks.map((b) => ({
          module_id: editModuleId,
          type: b.type,
          content: b.content,
          caption: b.caption || "",
          order_index: b.order_index,
        }));
        await supabase.from("module_content").insert(newBlocks);
      }
      
      await syncModuleJSON(editModuleId, blocksToSave);
    } else {
      // Create new module
      const { data } = await supabase.from("modules").insert([{ title: moduleForm.title, description: moduleForm.description, category_id: moduleForm.category_id, cover_image: imageUrl, sop_url: sopUrl, is_active: moduleForm.is_active }]).select("id").single();
      
      if (data && blocks.length > 0) {
        // Save all blocks for the new module
        const blocksToInsert = blocks.map((b, i) => ({
          module_id: data.id,
          type: b.type,
          content: b.content,
          caption: b.caption || "",
          order_index: i,
        }));
        await supabase.from("module_content").insert(blocksToInsert);
        await syncModuleJSON(data.id, blocks);
      }
    }
    
    setIsModuleModalOpen(false);
    await fetchData();
    setSaving(false);
  };

  const handleModuleDelete = async (id: string) => {
    const mod = modules.find((m) => m.id === id);
    if (mod) {
      setDeleteConfirm({ type: "module", id, name: mod.title });
    }
  };

  const confirmModuleDelete = async () => {
    if (!deleteConfirm.id) return;
    await supabase.from("modules").delete().eq("id", deleteConfirm.id);
    setModules((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
    setDeleteConfirm({ type: null, id: null, name: "" });
  };

  /* ------------------------------------------------------------------
     Render
  ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093075]"></div>
          <p className="text-gray-500">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[95%] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0A2C57]">Training Content</h1>
          <p className="text-gray-500 text-sm mt-1">Manage categories and modules</p>
        </div>
        <button
          onClick={() => openCategoryModal()}
          className="flex items-center gap-2 bg-[#0A2C57] hover:bg-[#093075] text-white px-4 py-2 rounded-lg font-semibold transition cursor-pointer"
        >
          <Plus size={18} /> New Category
        </button>
      </div>

      {/* Expand/Collapse All */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button onClick={expandAll} className="text-sm text-[#6EC1E4] hover:underline cursor-pointer">Expand All</button>
          <span className="text-gray-300">|</span>
          <button onClick={collapseAll} className="text-sm text-[#6EC1E4] hover:underline cursor-pointer">Collapse All</button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No categories yet. Create your first category to get started.</p>
          <button onClick={() => openCategoryModal()} className="bg-[#6EC1E4] hover:bg-[#5bb7de] text-white px-4 py-2 rounded-lg font-semibold cursor-pointer">
            <Plus size={18} className="inline mr-1" /> Create Category
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const catModules = modules.filter((m) => m.category_id === cat.id);
            const isExpanded = expandedCategories.has(cat.id);
            
            return (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Category Header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggleCategory(cat.id)}
                >
                  {/* Expand/Collapse Icon */}
                  <div className="text-gray-400">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>

                  {/* Category Image */}
                  {cat.cover_image ? (
                    <img src={cat.cover_image} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FolderOpen size={20} className="text-gray-400" />
                    </div>
                  )}

                  {/* Category Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#0A2C57] truncate">{cat.title}</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {catModules.length} module{catModules.length !== 1 ? "s" : ""}
                      </span>
                      {!cat.is_active && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-sm text-gray-500 truncate">{cat.description}</p>
                    )}
                  </div>

                  {/* Category Actions */}
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={cat.is_active}
                      onChange={async (val) => {
                        await supabase.from("categories").update({ is_active: val }).eq("id", cat.id);
                        setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, is_active: val } : c)));
                      }}
                      className={`${cat.is_active ? "bg-[#6EC1E4]" : "bg-gray-300"} relative inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer`}
                    >
                      <span className={`${cat.is_active ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                    </Switch>

                    <button
                      onClick={() => openCategoryModal(cat)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                      title="Edit Category"
                    >
                      <Pencil size={16} className="text-gray-500" />
                    </button>

                    <button
                      onClick={() => handleCategoryDelete(cat.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Modules Section (Collapsible) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                        {catModules.length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-gray-400 text-sm mb-3">No modules in this category</p>
                            <button
                              onClick={() => openModuleModal(undefined, cat.id)}
                              className="text-sm bg-[#6EC1E4] hover:bg-[#5bb7de] text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer"
                            >
                              <Plus size={14} className="inline mr-1" /> Add Module
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {catModules.map((mod) => (
                            <div
                              key={mod.id}
                              className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md hover:border-[#6EC1E4] transition cursor-pointer group relative"
                              onClick={() => openModuleModal(mod)}
                            >
                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-[#0A2C57]/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center pointer-events-none">
                                <Pencil size={32} className="text-white/80" />
                              </div>

                              {/* Module Image */}
                              {mod.cover_image ? (
                                <img src={mod.cover_image} className="w-full aspect-square object-cover rounded-lg mb-2" />
                              ) : (
                                <div className="w-full aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                                  <ImageIcon size={24} className="text-gray-300" />
                                </div>
                              )}

                              {/* Module Info */}
                              <h4 className="font-medium text-sm text-[#0A2C57] truncate">{mod.title}</h4>
                              
                              {/* Module Actions */}
                              <div className="flex items-center justify-between mt-2 relative z-10" onClick={(e) => e.stopPropagation()}>
                                <Switch
                                  checked={mod.is_active}
                                  onChange={async (val) => {
                                    await supabase.from("modules").update({ is_active: val }).eq("id", mod.id);
                                    setModules((prev) => prev.map((m) => (m.id === mod.id ? { ...m, is_active: val } : m)));
                                  }}
                                  className={`${mod.is_active ? "bg-[#6EC1E4]" : "bg-gray-300"} relative inline-flex h-5 w-9 items-center rounded-full transition cursor-pointer`}
                                >
                                  <span className={`${mod.is_active ? "translate-x-4" : "translate-x-1"} inline-block h-3 w-3 transform rounded-full bg-white transition`} />
                                </Switch>

                                <button
                                  onClick={() => handleModuleDelete(mod.id)}
                                  className="p-1 hover:bg-red-50 rounded transition cursor-pointer"
                                >
                                  <Trash2 size={14} className="text-red-400 hover:text-red-500" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add Module Card - Same size as other cards */}
                          <button
                            onClick={() => openModuleModal(undefined, cat.id)}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-3 hover:border-[#6EC1E4] hover:bg-[#6EC1E4]/5 transition cursor-pointer flex flex-col items-center justify-center"
                          >
                            <div className="w-full aspect-square rounded-lg mb-2 flex flex-col items-center justify-center text-gray-400 hover:text-[#6EC1E4]">
                              <Plus size={32} className="mb-2" />
                              <span className="text-sm font-medium text-center px-2">Add Module</span>
                            </div>
                            <div className="h-[22px]"></div> {/* Spacer to match module card height */}
                          </button>
                        </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================ */}
      {/* CATEGORY MODAL */}
      {/* ================================================================ */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-8 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#0A2C57]">
                {editCategoryId ? "Edit Category" : "Create New Category"}
              </h2>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCategorySave} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto pr-2 space-y-5 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={categoryForm.title}
                    onChange={(e) => {
                      setCategoryForm({ ...categoryForm, title: e.target.value });
                      if (categoryErrors.title) setCategoryErrors({ ...categoryErrors, title: undefined });
                    }}
                    className={`w-full border-2 rounded-lg p-3 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition ${
                      categoryErrors.title ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    placeholder="Enter category title..."
                  />
                  {categoryErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{categoryErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    rows={3}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition resize-none"
                    placeholder="Enter category description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryForm.role_id}
                    onChange={(e) => {
                      setCategoryForm({ ...categoryForm, role_id: e.target.value });
                      if (categoryErrors.role) setCategoryErrors({});
                    }}
                    className={`w-full border-2 rounded-lg p-3 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition ${
                      categoryErrors.role ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  {categoryErrors.role && (
                    <p className="text-red-500 text-sm mt-1">{categoryErrors.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cover Image <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={categoryForm.is_active}
                        onChange={(v) => setCategoryForm({ ...categoryForm, is_active: v })}
                        className={`${
                          categoryForm.is_active ? "bg-[#6EC1E4]" : "bg-gray-300"
                        } relative inline-flex h-7 w-14 items-center rounded-full transition`}
                      >
                        <span
                          className={`${
                            categoryForm.is_active ? "translate-x-8" : "translate-x-1"
                          } inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm`}
                        />
                      </Switch>
                      <span className="text-sm font-medium text-gray-700">
                        {categoryForm.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div>
                      <input
                        id="catImageUpload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          handleImageSelect(e);
                          if (categoryErrors.cover_image) setCategoryErrors({ ...categoryErrors, cover_image: undefined });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById("catImageUpload") as HTMLInputElement;
                          if (input) {
                            input.value = "";
                            input.click();
                          }
                        }}
                        className={`cursor-pointer px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md ${
                          categoryErrors.cover_image
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-[#6EC1E4] hover:bg-[#5bb7de] text-white"
                        }`}
                      >
                        {previewUrl ? "Change Image" : "+ Upload Image"}
                      </button>
                    </div>
                  </div>
                  {categoryErrors.cover_image && (
                    <p className="text-red-500 text-sm mt-1">{categoryErrors.cover_image}</p>
                  )}
                </div>

                {previewUrl && (
                  <div className="rounded-lg border-2 border-gray-200 overflow-hidden">
                    <img
                      src={previewUrl}
                      className="w-full aspect-square object-cover"
                      alt="Category preview"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#6EC1E4] hover:bg-[#5bb7de] text-white px-6 py-2.5 rounded-lg font-semibold cursor-pointer transition shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editCategoryId
                    ? "Save Changes"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODULE MODAL */}
      {/* ================================================================ */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#0A2C57]">
                  {editModuleId ? "Edit Module" : "Create New Module"}
                </h2>
                <div className="flex items-center gap-3">
                  {editModuleId && (
                    <>
                      <button
                        onClick={openSOPModal}
                        className="bg-[#E8F4FA] text-[#0A2C57] px-4 py-2 rounded-lg font-semibold hover:bg-[#d3edf9] cursor-pointer transition shadow-sm hover:shadow-md"
                      >
                        {sopUrl ? "Change SOP" : "Upload SOP"}
                      </button>
                      <button
                        onClick={() => (window.location.href = `/dashboard/modules/${editModuleId}/quiz`)}
                        className="bg-[#E8F4FA] text-[#0A2C57] px-4 py-2 rounded-lg font-semibold hover:bg-[#d3edf9] cursor-pointer transition shadow-sm hover:shadow-md"
                      >
                        {hasQuiz ? "Edit Quiz" : "Create Quiz"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setIsModuleModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition cursor-pointer p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>

            {modalLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#093075]"></div>
                  <p className="text-gray-500">Loading module content...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleModuleSave} className="flex flex-col flex-1 overflow-hidden">
                <div className="overflow-y-auto p-8 space-y-6 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter module title..."
                        value={moduleForm.title}
                        onChange={(e) => {
                          setModuleForm({ ...moduleForm, title: e.target.value });
                          if (moduleErrors.title) setModuleErrors({ ...moduleErrors, title: undefined });
                        }}
                        className={`w-full border-2 rounded-lg p-3 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition ${
                          moduleErrors.title ? "border-red-500" : "border-gray-300"
                        }`}
                        required
                      />
                      {moduleErrors.title && (
                        <p className="text-red-500 text-sm mt-1">{moduleErrors.title}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={moduleForm.category_id}
                        onChange={(e) => {
                          setModuleForm({ ...moduleForm, category_id: e.target.value });
                          if (moduleErrors.category_id) setModuleErrors({ ...moduleErrors, category_id: undefined });
                        }}
                        className={`w-full border-2 rounded-lg p-3 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition ${
                          moduleErrors.category_id ? "border-red-500" : "border-gray-300"
                        }`}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.title}
                          </option>
                        ))}
                      </select>
                      {moduleErrors.category_id && (
                        <p className="text-red-500 text-sm mt-1">{moduleErrors.category_id}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        placeholder="Enter module description..."
                        value={moduleForm.description}
                        onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                        rows={3}
                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition resize-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cover Image <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={moduleForm.is_active}
                          onChange={(val) => setModuleForm({ ...moduleForm, is_active: val })}
                          className={`${
                            moduleForm.is_active ? "bg-[#6EC1E4]" : "bg-gray-300"
                          } relative inline-flex h-7 w-14 items-center rounded-full transition`}
                        >
                          <span
                            className={`${
                              moduleForm.is_active ? "translate-x-8" : "translate-x-1"
                            } inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm`}
                          />
                        </Switch>
                        <span className="text-sm font-medium text-gray-700">
                          {moduleForm.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div>
                        <input
                          id="modImageUpload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            handleImageSelect(e);
                            if (moduleErrors.cover_image) setModuleErrors({ ...moduleErrors, cover_image: undefined });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById("modImageUpload") as HTMLInputElement;
                            if (input) {
                              input.value = "";
                              input.click();
                            }
                          }}
                          className={`cursor-pointer inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md ${
                            moduleErrors.cover_image
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-[#6EC1E4] hover:bg-[#5bb7de] text-white"
                          }`}
                        >
                          {moduleForm.cover_image || previewUrl ? "Change Image" : "+ Upload Image"}
                        </button>
                      </div>
                    </div>
                    {moduleErrors.cover_image && (
                      <p className="text-red-500 text-sm mt-1">{moduleErrors.cover_image}</p>
                    )}
                  </div>

                  {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{uploadError}</p>
                    </div>
                  )}
                  {previewUrl && (
                    <div className="rounded-lg border-2 border-gray-200 overflow-hidden w-48">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="aspect-square w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content Blocks Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#0A2C57]">Content Sections</h3>
                      <p className="text-xs text-gray-500">Click sections to expand/collapse</p>
                    </div>

                    {/* Group blocks by sections */}
                    {(() => {
                      const sections: Array<{ section: ContentBlock; blocks: ContentBlock[]; sectionIndex: number }> = [];
                      let currentSection: ContentBlock | null = null;
                      let currentSectionBlocks: ContentBlock[] = [];
                      let sectionIndex = 0;

                      // If no blocks, return empty state
                      if (blocks.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                            <p>No content sections yet. Add a section to get started.</p>
                          </div>
                        );
                      }

                      // Check if first block is a section
                      const firstBlockIsSection = blocks[0]?.type === "section";
                      
                      // If first block is not a section, create a default section
                      if (!firstBlockIsSection) {
                        currentSection = {
                          id: `temp-section-default`,
                          type: "section",
                          content: "Section 1",
                          order_index: -1, // Will be updated when saved
                        };
                      }

                      blocks.forEach((block) => {
                        if (block.type === "section") {
                          // Save previous section if exists
                          if (currentSection) {
                            sections.push({
                              section: currentSection,
                              blocks: currentSectionBlocks,
                              sectionIndex: sectionIndex++,
                            });
                          }
                          // Start new section
                          currentSection = block;
                          currentSectionBlocks = [];
                        } else {
                          // Add block to current section (or create default if none exists)
                          if (!currentSection) {
                            currentSection = {
                              id: `temp-section-${Date.now()}`,
                              type: "section",
                              content: `Section ${sections.length + 1}`,
                              order_index: block.order_index - 1,
                            };
                          }
                          currentSectionBlocks.push(block);
                        }
                      });

                      // Add last section
                      if (currentSection) {
                        sections.push({
                          section: currentSection,
                          blocks: currentSectionBlocks,
                          sectionIndex: sectionIndex,
                        });
                      }

                      return (
                        <DragDropContext
                          onDragEnd={async (result) => {
                            if (!result.destination) return;
                            const reordered = Array.from(blocks);
                            const [removed] = reordered.splice(result.source.index, 1);
                            reordered.splice(result.destination.index, 0, removed);
                            const updated = reordered.map((b, i) => ({ ...b, order_index: i }));
                            setBlocks(updated);

                            if (editModuleId) {
                              const realBlocks = updated.filter((b) => b.id && !b.id.startsWith("temp-"));
                              if (realBlocks.length > 0) {
                                await supabase
                                  .from("module_content")
                                  .upsert(realBlocks.map((b) => ({ id: b.id, order_index: b.order_index })));
                              }
                              await syncModuleJSON(editModuleId, updated);
                            }
                          }}
                        >
                          <Droppable droppableId="blocks">
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                {sections.map(({ section, blocks: sectionBlocks, sectionIndex }) => {
                                  const isExpanded = expandedSections.has(sectionIndex);

                                  return (
                                    <div
                                      key={section.id || `section-${sectionIndex}`}
                                      className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white"
                                    >
                                      {/* Section Header */}
                                      <div
                                        className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#E8F4FA] to-[#f0f8fc] cursor-pointer hover:from-[#d3edf9] hover:to-[#e5f4fa] transition"
                                        onClick={() => {
                                          setExpandedSections((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(sectionIndex)) {
                                              next.delete(sectionIndex);
                                            } else {
                                              next.add(sectionIndex);
                                            }
                                            return next;
                                          });
                                        }}
                                      >
                                        <ChevronDown
                                          size={20}
                                          className={`text-[#0A2C57] transition-transform ${
                                            isExpanded ? "rotate-0" : "-rotate-90"
                                          }`}
                                        />
                                        <input
                                          type="text"
                                          value={section.content || ""}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            updateBlockField(section.id, "content", e.target.value);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          placeholder="Section Title"
                                          className="flex-1 bg-transparent border-none text-lg font-semibold text-[#0A2C57] focus:outline-none focus:ring-2 focus:ring-[#6EC1E4] rounded px-2 py-1"
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeBlock(section.id);
                                          }}
                                          className="hover:bg-red-50 rounded-full p-1.5 transition"
                                          title="Delete section"
                                        >
                                          <X size={18} className="text-red-500" />
                                        </button>
                                      </div>

                                      {/* Section Content - Accordion */}
                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="p-4 space-y-3 bg-gray-50">
                                              {sectionBlocks.length === 0 ? (
                                                <p className="text-sm text-gray-400 text-center py-4">
                                                  No content in this section. Add content below.
                                                </p>
                                              ) : (
                                                sectionBlocks.map((block) => {
                                                  const globalIndex = blocks.findIndex((b) => b.id === block.id);
                                                  return (
                                                    <Draggable
                                                      key={block.id || `block-${globalIndex}`}
                                                      draggableId={block.id || `block-${globalIndex}`}
                                                      index={globalIndex}
                                                    >
                                                      {(provided, snapshot) => (
                                                        <div
                                                          ref={provided.innerRef}
                                                          {...provided.draggableProps}
                                                          className={`relative border-2 border-gray-200 bg-white rounded-lg p-5 transition-all group ${
                                                            snapshot.isDragging
                                                              ? "shadow-xl bg-[#E8F4FA] border-[#6EC1E4] scale-105"
                                                              : "hover:border-[#6EC1E4] hover:shadow-md"
                                                          }`}
                                                        >
                                                          {/* Drag Handle */}
                                                          <div
                                                            {...provided.dragHandleProps}
                                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                                          >
                                                            <GripVertical size={20} className="text-gray-400 hover:text-[#6EC1E4]" />
                                                          </div>

                                                          {/* Delete Button */}
                                                          <div className="absolute right-3 top-3">
                                                            <button
                                                              type="button"
                                                              onClick={() => removeBlock(block.id)}
                                                              className="hover:bg-red-50 rounded-full p-1.5 cursor-pointer transition"
                                                              title="Delete block"
                                                            >
                                                              <X size={18} className="text-red-500" />
                                                            </button>
                                                          </div>

                                                          {/* Block Type Label */}
                                                          <div className="ml-8 mb-3">
                                                            <span className="inline-flex items-center px-2.5 py-1 bg-[#E8F4FA] text-[#0A2C57] rounded-full text-xs font-semibold">
                                                              {block.type === "text"
                                                                ? "Text Block"
                                                                : block.type === "video"
                                                                ? "Video"
                                                                : block.type === "pdf"
                                                                ? "PDF Document"
                                                                : "Image"}
                                                            </span>
                                                          </div>

                                                          <div className="ml-8">
                                                            {block.type === "text" && (
                                                              <textarea
                                                                value={block.content || ""}
                                                                onChange={(e) => updateBlockField(block.id, "content", e.target.value)}
                                                                placeholder="Enter text content..."
                                                                className="border-2 border-gray-300 bg-white rounded-lg p-3 min-h-[100px] text-sm w-full focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition resize-none"
                                                              />
                                                            )}
                                                            {block.type === "image" && (
                                                              <div>
                                                                <input
                                                                  id={`content-image-${block.id || globalIndex}`}
                                                                  type="file"
                                                                  accept="image/*"
                                                                  className="hidden"
                                                                  onChange={(e) => handleContentImageUpload(e, block.id)}
                                                                />
                                                                {block.content ? (
                                                                  <>
                                                                    <div className="w-full rounded-lg border-2 border-gray-200 overflow-hidden mb-3 bg-gray-100 flex items-center justify-center" style={{ height: '220px' }}>
                                                                      <img
                                                                        src={block.content}
                                                                        className="w-full h-full object-contain"
                                                                        alt="Content preview"
                                                                      />
                                                                    </div>
                                                                    <input
                                                                      type="text"
                                                                      value={block.caption || ""}
                                                                      onChange={(e) => updateBlockField(block.id, "caption", e.target.value)}
                                                                      placeholder="Image caption (optional)"
                                                                      className="w-full border-2 border-gray-300 rounded-lg p-2.5 text-sm mb-3 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition"
                                                                    />
                                                                    <button
                                                                      type="button"
                                                                      onClick={() => {
                                                                        const input = document.getElementById(`content-image-${block.id || globalIndex}`) as HTMLInputElement;
                                                                        if (input) {
                                                                          input.value = "";
                                                                          input.click();
                                                                        }
                                                                      }}
                                                                      className="px-4 py-2 bg-[#E8F4FA] text-[#0A2C57] rounded-lg text-sm font-semibold hover:bg-[#d3edf9] cursor-pointer transition"
                                                                    >
                                                                      Change Image
                                                                    </button>
                                                                  </>
                                                                ) : (
                                                                  <div
                                                                    onClick={() => {
                                                                      const input = document.getElementById(`content-image-${block.id || globalIndex}`) as HTMLInputElement;
                                                                      if (input) {
                                                                        input.value = "";
                                                                        input.click();
                                                                      }
                                                                    }}
                                                                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-[#6EC1E4] cursor-pointer transition"
                                                                  >
                                                                    <ImageIcon size={32} className="mb-2" />
                                                                    <span className="text-sm font-medium">Click to upload image</span>
                                                                  </div>
                                                                )}
                                                              </div>
                                                            )}
                                                            {block.type === "video" && (
                                                              <div>
                                                                <input
                                                                  value={block.content || ""}
                                                                  onChange={(e) => updateBlockField(block.id, "content", e.target.value)}
                                                                  placeholder="Paste YouTube URL here..."
                                                                  className="w-full border-2 border-gray-300 rounded-lg p-3 text-sm mb-3 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition"
                                                                />
                                                                {block.content && (
                                                                  <div className="rounded-lg border-2 border-gray-200 overflow-hidden">
                                                                    <iframe
                                                                      src={`https://www.youtube.com/embed/${block.content.split("v=").pop()?.split("&")[0]}`}
                                                                      className="w-full h-64"
                                                                      allowFullScreen
                                                                    />
                                                                  </div>
                                                                )}
                                                              </div>
                                                            )}
                                                            {block.type === "pdf" && (
                                                              <div>
                                                                <input
                                                                  id={`content-pdf-${block.id || globalIndex}`}
                                                                  type="file"
                                                                  accept="application/pdf,.pdf"
                                                                  className="hidden"
                                                                  onChange={(e) => {
                                                                    if (e.target.files && e.target.files[0]) {
                                                                      handleContentPDFUpload(e, block.id);
                                                                    }
                                                                  }}
                                                                />
                                                                {block.content ? (
                                                                  <>
                                                                    <div className="w-full rounded-lg border-2 border-gray-200 overflow-hidden mb-3 bg-gray-100 flex flex-col items-center justify-center" style={{ height: '400px' }}>
                                                                      <iframe
                                                                        src={block.content}
                                                                        className="w-full h-full"
                                                                        title="PDF Preview"
                                                                      />
                                                                    </div>
                                                                    <input
                                                                      type="text"
                                                                      value={block.caption || ""}
                                                                      onChange={(e) => updateBlockField(block.id, "caption", e.target.value)}
                                                                      placeholder="PDF caption (optional)"
                                                                      className="w-full border-2 border-gray-300 rounded-lg p-2.5 text-sm mb-3 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition"
                                                                    />
                                                                    <button
                                                                      type="button"
                                                                      onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const inputId = `content-pdf-${block.id || globalIndex}`;
                                                                        const input = document.getElementById(inputId) as HTMLInputElement;
                                                                        if (input) {
                                                                          input.value = "";
                                                                          input.click();
                                                                        } else {
                                                                          console.error(`PDF input not found: ${inputId}`);
                                                                          setUploadError("Error: Could not find file input. Please refresh and try again.");
                                                                        }
                                                                      }}
                                                                      className="px-4 py-2 bg-[#E8F4FA] text-[#0A2C57] rounded-lg text-sm font-semibold hover:bg-[#d3edf9] cursor-pointer transition"
                                                                    >
                                                                      Change PDF
                                                                    </button>
                                                                  </>
                                                                ) : (
                                                                  <div
                                                                    onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      e.preventDefault();
                                                                      
                                                                      const blockId = block.id || `temp-${globalIndex}`;
                                                                      const inputId = `content-pdf-${blockId}`;
                                                                      
                                                                      console.log("PDF upload clicked - Block ID:", blockId, "Input ID:", inputId);
                                                                      
                                                                      // Try multiple ways to find the input
                                                                      let input = document.getElementById(inputId) as HTMLInputElement;
                                                                      
                                                                      // Fallback: try finding by accept attribute
                                                                      if (!input) {
                                                                        const allPDFInputs = document.querySelectorAll('input[type="file"][accept*="pdf"]');
                                                                        console.log("Found PDF inputs:", allPDFInputs.length);
                                                                        for (const inp of Array.from(allPDFInputs)) {
                                                                          if (inp.id.includes(blockId) || inp.id.includes(String(globalIndex))) {
                                                                            input = inp as HTMLInputElement;
                                                                            console.log("Found input by fallback:", inp.id);
                                                                            break;
                                                                          }
                                                                        }
                                                                      }
                                                                      
                                                                      if (input) {
                                                                        input.value = "";
                                                                        console.log("Clicking PDF input:", inputId);
                                                                        // Use setTimeout to ensure the click happens
                                                                        setTimeout(() => {
                                                                          input.click();
                                                                        }, 10);
                                                                      } else {
                                                                        console.error(`PDF input not found: ${inputId}. Block ID: ${blockId}, Global Index: ${globalIndex}`);
                                                                        console.error("Available PDF inputs:", Array.from(document.querySelectorAll('input[type="file"][accept*="pdf"]')).map(i => i.id));
                                                                        setUploadError("Error: Could not find file input. Please refresh and try again.");
                                                                      }
                                                                    }}
                                                                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-[#6EC1E4] cursor-pointer transition"
                                                                  >
                                                                    <FileText size={32} className="mb-2" />
                                                                    <span className="text-sm font-medium">Click to upload PDF</span>
                                                                  </div>
                                                                )}
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      )}
                                                    </Draggable>
                                                  );
                                                })
                                              )}

                                              {/* Add Content Buttons */}
                                              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                                                <button
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    // Calculate insert position: after the last block in this section
                                                    let insertIndex = blocks.length;
                                                    
                                                    if (sectionBlocks.length > 0) {
                                                      // Find the last block in the section
                                                      const lastBlock = sectionBlocks[sectionBlocks.length - 1];
                                                      const lastBlockIndex = blocks.findIndex((b) => b.id === lastBlock.id);
                                                      if (lastBlockIndex >= 0) {
                                                        insertIndex = lastBlockIndex + 1;
                                                      }
                                                    } else {
                                                      // No blocks in section yet - insert after the section header
                                                      const sectionIndex = blocks.findIndex((b) => b.id === section.id);
                                                      if (sectionIndex >= 0) {
                                                        insertIndex = sectionIndex + 1;
                                                      } else {
                                                        // Virtual section - insert at end
                                                        insertIndex = blocks.length;
                                                      }
                                                    }
                                                    
                                                    await addBlockAtPosition("text", insertIndex);
                                                  }}
                                                  type="button"
                                                  className="px-3 py-1.5 bg-white hover:bg-[#E8F4FA] text-[#0A2C57] rounded-lg text-xs font-semibold cursor-pointer transition border border-gray-300"
                                                >
                                                  + Text
                                                </button>
                                                <button
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    let insertIndex = blocks.length;
                                                    
                                                    if (sectionBlocks.length > 0) {
                                                      const lastBlock = sectionBlocks[sectionBlocks.length - 1];
                                                      const lastBlockIndex = blocks.findIndex((b) => b.id === lastBlock.id);
                                                      if (lastBlockIndex >= 0) {
                                                        insertIndex = lastBlockIndex + 1;
                                                      }
                                                    } else {
                                                      const sectionIndex = blocks.findIndex((b) => b.id === section.id);
                                                      if (sectionIndex >= 0) {
                                                        insertIndex = sectionIndex + 1;
                                                      }
                                                    }
                                                    
                                                    await addBlockAtPosition("image", insertIndex);
                                                  }}
                                                  type="button"
                                                  className="px-3 py-1.5 bg-white hover:bg-[#E8F4FA] text-[#0A2C57] rounded-lg text-xs font-semibold cursor-pointer transition border border-gray-300"
                                                >
                                                  + Image
                                                </button>
                                                <button
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    let insertIndex = blocks.length;
                                                    
                                                    if (sectionBlocks.length > 0) {
                                                      const lastBlock = sectionBlocks[sectionBlocks.length - 1];
                                                      const lastBlockIndex = blocks.findIndex((b) => b.id === lastBlock.id);
                                                      if (lastBlockIndex >= 0) {
                                                        insertIndex = lastBlockIndex + 1;
                                                      }
                                                    } else {
                                                      const sectionIndex = blocks.findIndex((b) => b.id === section.id);
                                                      if (sectionIndex >= 0) {
                                                        insertIndex = sectionIndex + 1;
                                                      }
                                                    }
                                                    
                                                    await addBlockAtPosition("video", insertIndex);
                                                  }}
                                                  type="button"
                                                  className="px-3 py-1.5 bg-white hover:bg-[#E8F4FA] text-[#0A2C57] rounded-lg text-xs font-semibold cursor-pointer transition border border-gray-300"
                                                >
                                                  + Video
                                                </button>
                                                <button
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    let insertIndex = blocks.length;
                                                    
                                                    if (sectionBlocks.length > 0) {
                                                      const lastBlock = sectionBlocks[sectionBlocks.length - 1];
                                                      const lastBlockIndex = blocks.findIndex((b) => b.id === lastBlock.id);
                                                      if (lastBlockIndex >= 0) {
                                                        insertIndex = lastBlockIndex + 1;
                                                      }
                                                    } else {
                                                      const sectionIndex = blocks.findIndex((b) => b.id === section.id);
                                                      if (sectionIndex >= 0) {
                                                        insertIndex = sectionIndex + 1;
                                                      }
                                                    }
                                                    
                                                    console.log("Adding PDF block at index:", insertIndex);
                                                    await addBlockAtPosition("pdf", insertIndex);
                                                    
                                                    // Wait for React to render, then find and click the file input
                                                    setTimeout(() => {
                                                      // Get updated blocks after state change
                                                      const findAndClickPDFInput = () => {
                                                        // Try to find the newly created PDF block
                                                        const allInputs = document.querySelectorAll('input[type="file"][accept*="pdf"]');
                                                        console.log("Found PDF inputs:", allInputs.length);
                                                        
                                                        // Find the one without content (newly created)
                                                        for (const input of Array.from(allInputs)) {
                                                          const inputId = input.id;
                                                          const blockId = inputId.replace('content-pdf-', '');
                                                          // Check if this block has no content yet
                                                          const block = blocks.find(b => (b.id || '').toString() === blockId);
                                                          if (!block || !block.content) {
                                                            console.log("Clicking PDF input:", inputId);
                                                            (input as HTMLInputElement).click();
                                                            return;
                                                          }
                                                        }
                                                        
                                                        // Fallback: click the last PDF input
                                                        if (allInputs.length > 0) {
                                                          const lastInput = allInputs[allInputs.length - 1] as HTMLInputElement;
                                                          console.log("Clicking last PDF input as fallback:", lastInput.id);
                                                          lastInput.click();
                                                        } else {
                                                          console.error("No PDF input found");
                                                          setUploadError("PDF block created but file input not found. Please click the upload area.");
                                                        }
                                                      };
                                                      
                                                      // Try multiple times as React may need to render
                                                      findAndClickPDFInput();
                                                      setTimeout(findAndClickPDFInput, 100);
                                                      setTimeout(findAndClickPDFInput, 300);
                                                    }, 150);
                                                  }}
                                                  type="button"
                                                  className="px-3 py-1.5 bg-white hover:bg-[#E8F4FA] text-[#0A2C57] rounded-lg text-xs font-semibold cursor-pointer transition border border-gray-300"
                                                >
                                                  + PDF
                                                </button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                      );
                    })()}

                    {/* Add Section Button */}
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => addBlock("section")}
                        type="button"
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#6EC1E4] to-[#5bb7de] hover:from-[#5bb7de] hover:to-[#4aa8cc] text-white rounded-lg text-sm font-semibold cursor-pointer transition shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                      >
                        <Plus size={18} />
                        Add New Section
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 px-8 pb-8 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setIsModuleModalOpen(false)}
                    className="px-5 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#6EC1E4] hover:bg-[#5bb7de] text-white px-6 py-2.5 rounded-lg font-semibold cursor-pointer transition shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editModuleId
                      ? "Save Changes"
                      : "Create Module"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* SOP UPLOAD MODAL */}
      {/* ================================================================ */}
      {isSOPModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#0A2C57]">
                  {sopUrl ? "Change SOP" : "Upload SOP"}
                </h2>
                <button
                  onClick={() => {
                    setIsSOPModalOpen(false);
                    setSopFile(null);
                    setUploadError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition cursor-pointer p-1 rounded-lg hover:bg-gray-100"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden p-8">
              <div className="flex-1 overflow-y-auto space-y-6">
                {/* PDF Preview */}
                {(sopPreviewUrl || sopUrl) && (
                  <div className="w-full rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-100 flex flex-col items-center justify-center" style={{ height: '500px' }}>
                    <iframe
                      src={sopPreviewUrl || sopUrl || ""}
                      className="w-full h-full"
                      title="SOP Preview"
                    />
                  </div>
                )}

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {sopUrl ? "Change PDF File" : "Upload PDF File"}
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleSOPFileSelect}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">Only PDF files are allowed</p>
                </div>

                {/* Error Message */}
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                {sopUrl && (
                  <button
                    onClick={handleSOPDelete}
                    disabled={uploadingSOP}
                    className="px-4 py-2 border-2 border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete SOP
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsSOPModalOpen(false);
                    setSopFile(null);
                    setUploadError(null);
                  }}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSOPSave}
                  disabled={uploadingSOP || (!sopFile && !sopUrl)}
                  className="bg-[#6EC1E4] hover:bg-[#5bb7de] text-white px-5 py-2 rounded-lg font-semibold cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingSOP ? "Uploading..." : sopUrl ? "Change SOP" : "Upload SOP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CROP MODAL */}
      {isCropOpen && previewUrl && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl w-full max-w-md p-4">
            <h3 className="text-lg font-bold text-[#0A2C57] mb-3">Crop Image (1:1)</h3>
            <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
              <Cropper image={previewUrl} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => {
                  setIsCropOpen(false);
                  setPreviewUrl(null);
                  setImageFile(null);
                  setCroppedAreaPixels(null);
                }}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Keep imageFile and previewUrl - they'll be used when saving
                  setIsCropOpen(false);
                }}
                className="bg-[#6EC1E4] hover:bg-[#5bb7de] text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
              >
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm.type && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
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
              Delete {deleteConfirm.type === "category" ? "Category" : "Module"}?
            </h2>

            {/* Warning Message */}
            <p className="text-gray-600 text-center mb-4">
              {deleteConfirm.type === "category" ? (
                <>
                  This will permanently delete <span className="font-bold">{deleteConfirm.name}</span> and{" "}
                  <span className="font-bold">all modules</span> within it. This action cannot be undone.
                </>
              ) : (
                <>
                  This will permanently delete <span className="font-bold">{deleteConfirm.name}</span>. This action cannot be undone.
                </>
              )}
            </p>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm({ type: null, id: null, name: "" })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "category") {
                    confirmCategoryDelete();
                  } else {
                    confirmModuleDelete();
                  }
                }}
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
