"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { authenticatedFetch } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVertical,
  Download,
  X,
  Shield,
  KeyRound,
  Users,
  Settings,
  Trash2,
  Plus,
  Edit3,
  CheckCircle2,
  Search,
  Filter,
} from "lucide-react";

/* ------------------------------------------------------------- */
/* ---------------------- ROLE CONSTANTS ------------------------ */
/* ------------------------------------------------------------- */

const NEW_HIRE_ROLE = "524f3167-6d9f-4474-b20f-98db519994b9";

/* ------------------------------------------------------------- */
/* -------------------------- TYPES ----------------------------- */
/* ------------------------------------------------------------- */

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean;
  last_online_at: string | null;
}

interface Attempt {
  id: number;
  user_id: string;
  module_id: string;
  score: number;
  passed: boolean;
  attempt_number: number;
  time_spent: number;
  created_at: string;
}

interface Module {
  id: string;
  title: string;
  category_id: string;
  is_active: boolean;
}

interface Category {
  id: string;
  role_id: string | null;
  is_active: boolean;
}

interface RoleRow {
  id: string;
  name: string;
}

/* ------------------------------------------------------------- */
/* -------------------------- MANAGE ROLES ---------------------- */
/* ------------------------------------------------------------- */

function ManageRolesModal({
  open,
  onClose,
  refreshRoles,
  roles,
}: {
  open: boolean;
  onClose: () => void;
  refreshRoles: () => void;
  roles: RoleRow[];
}) {
  const [roleName, setRoleName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteRoleConfirm, setDeleteRoleConfirm] = useState<{
    id: string | null;
    name: string;
  }>({ id: null, name: "" });

  async function createRole() {
    if (!roleName.trim()) return;

    const { error } = await supabase.from("roles").insert([{ name: roleName }]);

    if (error) {
      alert("Error creating role.");
      return;
    }

    setRoleName("");
    await refreshRoles();
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from("roles")
      .update({ name: roleName })
      .eq("id", id);

    if (error) {
      alert("Update failed.");
      return;
    }

    setRoleName("");
    setEditingId(null);
    await refreshRoles();
  }

  async function deleteRole(id: string) {
    if (id === NEW_HIRE_ROLE) {
      alert("New Hire cannot be deleted.");
      return;
    }

    const role = roles.find((r) => r.id === id);
    if (role) {
      setDeleteRoleConfirm({ id: role.id, name: role.name });
    }
  }

  const confirmRoleDelete = async () => {
    if (!deleteRoleConfirm.id) return;

    await supabase.from("roles").delete().eq("id", deleteRoleConfirm.id);
    setDeleteRoleConfirm({ id: null, name: "" });
    await refreshRoles();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-[460px] max-h-[80vh] overflow-y-auto relative"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded hover:bg-gray-200"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-[#093075] mb-4">Role Manager</h2>

        <div className="flex gap-2 mb-6">
          <input
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="New role name…"
            className="border px-3 py-2 rounded w-full"
          />

          <button
            onClick={() => (editingId ? saveEdit(editingId) : createRole())}
            className="bg-[#093075] text-white px-4 py-2 rounded hover:bg-[#0a3c9c] cursor-pointer"
          >
            {editingId ? "Save" : <Plus size={20} />}
          </button>
        </div>

        <div className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="border p-3 rounded-lg flex justify-between items-center"
            >
              <div className="font-semibold">{role.name}</div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingId(role.id);
                    setRoleName(role.name);
                  }}
                  className="p-1 rounded hover:bg-gray-200 cursor-pointer"
                >
                  <Edit3 size={18} />
                </button>

                {role.id !== NEW_HIRE_ROLE && (
                  <button
                    onClick={() => deleteRole(role.id)}
                    className="p-1 rounded text-red-600 hover:bg-red-100 cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Delete Role Confirmation Modal */}
      {deleteRoleConfirm.id && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
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
              Delete Role?
            </h2>

            {/* Warning Message */}
            <p className="text-gray-600 text-center mb-4">
              This will permanently delete the role <span className="font-bold">{deleteRoleConfirm.name}</span>. This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteRoleConfirm({ id: null, name: "" })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleDelete}
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

/* ------------------------------------------------------------- */
/* ---------------------- ASSIGN ROLES MODAL -------------------- */
/* ------------------------------------------------------------- */

function AssignRolesModal({
  user,
  open,
  onClose,
  existingRoles,
  refreshAssignments,
  roles,
}: {
  user: Profile | null;
  open: boolean;
  onClose: () => void;
  existingRoles: string[];
  refreshAssignments: () => void;
  roles: RoleRow[];
}) {
  const currentUser = user; // ⭐ FIX: properly scoped for TypeScript
  const [selected, setSelected] = useState<string[]>(existingRoles);

  useEffect(() => {
    if (!currentUser) return;

    const defaults = new Set(existingRoles);

    // Default non-admins to New Hire role
    if (!currentUser.is_admin && existingRoles.length === 0) {
      defaults.add(NEW_HIRE_ROLE);
    }

    // Admins automatically see ALL roles checked (but cannot edit)
    if (currentUser.is_admin) {
      roles.forEach((r) => defaults.add(r.id));
    }

    // Use setTimeout to avoid setState in effect
    setTimeout(() => {
      setSelected([...defaults]);
    }, 0);
  }, [existingRoles, currentUser, roles]);

  /* ------------------- SAVE CHANGES ------------------- */
  async function save() {
    if (!currentUser) return;

    // Admins cannot modify roles (UI already disables)
    if (currentUser.is_admin) {
      onClose();
      return;
    }

    // Ensure New Hire role is always included
    const rolesToSave = new Set(selected);
    rolesToSave.add(NEW_HIRE_ROLE); // Always include New Hire

    // Remove existing
    await supabase.from("user_roles").delete().eq("user_id", currentUser.id);

    // Insert new roles (including New Hire)
    await supabase.from("user_roles").insert(
      Array.from(rolesToSave).map((id) => ({
        user_id: currentUser.id,
        role_id: id,
      }))
    );

    refreshAssignments();
    onClose();
  }

  if (!open || !currentUser) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-6 rounded-xl shadow-xl relative w-[420px]"
      >
        {/* CLOSE BUTTON */}
        <button
          className="absolute right-4 top-4 p-1 rounded cursor-pointer hover:bg-gray-200"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* TITLE */}
        <h2 className="text-2xl font-bold text-[#093075] mb-3">Assign Roles</h2>

        <p className="text-gray-700 mb-4">
          Assign roles for{" "}
          <span className="font-semibold">
            {currentUser.first_name} {currentUser.last_name}
          </span>
        </p>

        {/* ROLE CHECKBOXES */}
        <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
          {/* Show New Hire role first, always checked and disabled */}
          {(() => {
            const newHireRole = roles.find((r) => r.id === NEW_HIRE_ROLE);
            if (newHireRole) {
              return (
                <label
                  className="flex items-center gap-3 bg-[#E8F4FA] p-2 rounded-lg border border-[#6EC1E4]"
                >
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="cursor-not-allowed accent-[#6EC1E4]"
                  />
                  <span className="text-gray-800 font-medium">
                    {newHireRole.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    (Required)
                  </span>
                </label>
              );
            }
            return null;
          })()}
          
          {/* Show other roles */}
          {roles
            .filter((role) => role.id !== NEW_HIRE_ROLE)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((role) => (
              <label
                key={role.id}
                className={`flex items-center gap-3 ${
                  currentUser.is_admin ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(role.id)}
                  disabled={currentUser.is_admin}
                  className={
                    currentUser.is_admin
                      ? "cursor-not-allowed"
                      : "cursor-pointer accent-[#093075]"
                  }
                  onChange={() => {
                    if (currentUser.is_admin) return;
                    setSelected((prev) =>
                      prev.includes(role.id)
                        ? prev.filter((r) => r !== role.id)
                        : [...prev, role.id]
                    );
                  }}
                />
                <span className="text-gray-800">{role.name}</span>
              </label>
            ))}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded cursor-pointer hover:bg-[#093075] hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={currentUser.is_admin}
            className={`px-5 py-2 rounded text-white ${
              currentUser.is_admin
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#093075] hover:bg-[#0a3c9c] cursor-pointer"
            }`}
          >
            Save Roles
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------- */
/* ---------------------- DELETE ACCOUNT MODAL ------------------ */
/* ------------------------------------------------------------- */

function DeleteAccountModal({
  user,
  open,
  onClose,
  onDeleted,
}: {
  user: Profile | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const fullName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : "";

  useEffect(() => {
    if (open) {
      setConfirmName("");
      setError("");
    }
  }, [open]);

  async function handleDelete() {
    if (!user) return;

    // Validate exact name match
    if (confirmName.trim().toLowerCase() !== fullName.toLowerCase()) {
      setError("Name does not match. Please type the exact full name.");
      return;
    }

    setDeleting(true);
    setError("");

    try {
      // Call server-side API to delete user (including auth.users)
      const response = await authenticatedFetch("/api/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account.");
      }

      onDeleted();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete account.";
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  }

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-6 rounded-xl shadow-xl relative w-[460px]"
      >
        {/* CLOSE BUTTON */}
        <button
          className="absolute right-4 top-4 p-1 rounded cursor-pointer hover:bg-gray-200"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* WARNING ICON */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 size={32} className="text-red-600" />
          </div>
        </div>

        {/* TITLE */}
        <h2 className="text-2xl font-bold text-red-600 text-center mb-2">
          Delete Account
        </h2>

        <p className="text-gray-600 text-center mb-4">
          This action is <span className="font-bold">permanent</span> and cannot
          be undone. All user data including progress, quiz attempts, and roles
          will be deleted.
        </p>

        {/* USER INFO */}
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-500">You are about to delete:</p>
          <p className="font-bold text-lg text-gray-800">{fullName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        {/* CONFIRMATION INPUT */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To confirm, type the user&apos;s full name:{" "}
            <span className="font-bold text-red-600">{fullName}</span>
          </label>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => {
              setConfirmName(e.target.value);
              setError("");
            }}
            placeholder="Type full name to confirm..."
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting || confirmName.trim().toLowerCase() !== fullName.toLowerCase()}
            className={`px-5 py-2 rounded-lg text-white flex items-center gap-2 ${
              deleting || confirmName.trim().toLowerCase() !== fullName.toLowerCase()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 cursor-pointer"
            }`}
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------- */
/* ------------------------- ACTION MENU ------------------------ */
/* ------------------------------------------------------------- */

function ActionMenu({
  user,
  onManageRoles,
  onToggleAdmin,
  onResetPassword,
  onDeleteAccount,
  isNearBottom,
  currentUserId,
}: {
  user: Profile;
  onManageRoles: () => void;
  onToggleAdmin: () => void;
  onResetPassword: () => void;
  onDeleteAccount: () => void;
  isNearBottom: boolean;
  currentUserId?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-gray-200 cursor-pointer"
      >
        <MoreVertical size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            className={`absolute right-0 w-44 bg-white border rounded-lg shadow-xl z-[9999] ${
              isNearBottom ? "bottom-8" : "top-8"
            }`}
          >
            <button
              onClick={() => {
                onManageRoles();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#093075] hover:text-white flex items-center gap-2 rounded-t-lg cursor-pointer"
            >
              <Users size={16} /> Assign Roles
            </button>

            <button
              onClick={() => {
                onToggleAdmin();
                setOpen(false);
              }}
              disabled={user.is_admin && currentUserId === user.id}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                user.is_admin && currentUserId === user.id
                  ? "opacity-50 cursor-not-allowed text-gray-400"
                  : "hover:bg-[#093075] hover:text-white cursor-pointer"
              }`}
              title={user.is_admin && currentUserId === user.id ? "You cannot remove your own admin access" : ""}
            >
              <Shield size={16} />
              {user.is_admin ? "Remove Admin" : "Make Admin"}
            </button>

            <button
              onClick={() => {
                onResetPassword();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#093075] hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <KeyRound size={16} /> Reset Password
            </button>

            <div className="border-t border-gray-200" />

            <button
              onClick={() => {
                onDeleteAccount();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg cursor-pointer"
            >
              <Trash2 size={16} /> Delete Account
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------- */
/* ---------------------------- PAGE ---------------------------- */
/* ------------------------------------------------------------- */

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [moduleProgress, setModuleProgress] = useState<Array<{ user_id: string; module_id: string; status: string }>>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [userRolesMap, setUserRolesMap] = useState<Record<string, string[]>>(
    {}
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortByRole, setSortByRole] = useState<string>("all");

  const [modalUser, setModalUser] = useState<Profile | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [manageRolesModalOpen, setManageRolesModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<Profile | null>(null);

  /* ------------------------- LOAD ROLES ------------------------- */
  async function loadRoles() {
    const { data } = await supabase.from("roles").select("*").order("name");
    setRoles(data || []);
  }

  /* ------------------------- LOAD DATA --------------------------- */
  async function loadData() {
    setLoading(true);

    const { data: profs } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at");

    const { data: userRoleRows } = await supabase
      .from("user_roles")
      .select("*");

    const map: Record<string, string[]> = {};
    (userRoleRows || []).forEach((r: { user_id: string; role_id: string }) => {
      if (!map[r.user_id]) map[r.user_id] = [];
      map[r.user_id].push(r.role_id);
    });

    const { data: attemptsData } = await supabase
      .from("quiz_attempts")
      .select("*");

    const { data: progressData } = await supabase
      .from("module_progress")
      .select("user_id, module_id, status");

    const { data: mods } = await supabase
      .from("modules")
      .select("id, title, category_id, is_active");

    const { data: cats } = await supabase
      .from("categories")
      .select("id, role_id, is_active");

    setProfiles(profs || []);
    setUserRolesMap(map);
    setAttempts(attemptsData || []);
    setModuleProgress(progressData || []);
    setModules(mods || []);
    setCategories(cats || []);
    await loadRoles();

    // Debug logging (can be removed later)
    console.log("Loaded data:", {
      modules: mods?.length || 0,
      categories: cats?.length || 0,
      profiles: profs?.length || 0,
    });

    setLoading(false);
  }

  useEffect(() => {
    // Use setTimeout to avoid setState in effect
    setTimeout(() => {
      loadData();
    }, 0);
    
    // Get current user ID
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const attemptsMap = useMemo(() => {
    const out: Record<string, Attempt[]> = {};
    attempts.forEach((a) => {
      if (!out[a.user_id]) out[a.user_id] = [];
      out[a.user_id].push(a);
    });
    return out;
  }, [attempts]);

  // Memoize total modules calculation for each user
  const userTotalModulesMap = useMemo(() => {
    const map: Record<string, number> = {};
    
    // Early return if data not loaded
    if (!modules.length || !categories.length || !profiles.length) {
      return map;
    }

    profiles.forEach((p) => {
      if (p.is_admin) {
        // Admins see all active modules (is_active is true or null/undefined)
        map[p.id] = modules.filter((m) => m.is_active === true || m.is_active == null).length;
      } else {
        // Always include New Hire role, plus any other assigned roles
        const userRoles = new Set([NEW_HIRE_ROLE]);
        if (userRolesMap[p.id]?.length > 0) {
          userRolesMap[p.id].forEach((rid) => userRoles.add(rid));
        }

        // Get all categories accessible to this user (based on their roles)
        const accessibleCategoryIds = new Set<string>();
        categories.forEach((cat) => {
          // Include active categories (is_active is true or null/undefined) that have a role_id
          if ((cat.is_active === true || cat.is_active == null) && cat.role_id) {
            if (userRoles.has(cat.role_id)) {
              accessibleCategoryIds.add(cat.id);
            }
          }
        });

        // Count active modules (is_active is true or null/undefined) in accessible categories
        map[p.id] = modules.filter((m) => {
          return (
            (m.is_active === true || m.is_active == null) &&
            m.category_id &&
            accessibleCategoryIds.has(m.category_id)
          );
        }).length;
      }
    });
    
    return map;
  }, [profiles, modules, categories, userRolesMap]);

  // Memoize completed modules for each user
  // Count modules that are either:
  // 1. Completed via quiz (quiz_attempts with passed = true), OR
  // 2. Completed without quiz (module_progress with status = "complete")
  const userCompletedModulesMap = useMemo(() => {
    const map: Record<string, number> = {};
    profiles.forEach((p) => {
      const completedModuleIds = new Set<string>();
      
      // Add modules completed via quiz attempts
      const userAttempts = attemptsMap[p.id] || [];
      userAttempts
        .filter((x) => x.passed)
        .forEach((x) => completedModuleIds.add(x.module_id));
      
      // Add modules completed without quiz (from module_progress)
      const userProgress = moduleProgress.filter((mp) => mp.user_id === p.id);
      userProgress
        .filter((mp) => mp.status === "complete")
        .forEach((mp) => completedModuleIds.add(mp.module_id));
      
      map[p.id] = completedModuleIds.size;
    });
    return map;
  }, [profiles, attemptsMap, moduleProgress]);

  /* ------------------------- ACTIONS ---------------------------- */

  function openAssignRolesModal(p: Profile) {
    setModalUser(p);
    setAssignModalOpen(true);
  }

  function openDeleteModal(p: Profile) {
    setDeleteUser(p);
    setDeleteModalOpen(true);
  }

  async function toggleAdmin(p: Profile) {
    // Get current user to prevent self-removal
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === p.id && p.is_admin) {
      alert("You cannot remove your own admin access. Another admin must do this for you.");
      return;
    }

    await supabase
      .from("profiles")
      .update({ is_admin: !p.is_admin })
      .eq("id", p.id);

    loadData();
  }

  async function resetPassword(p: Profile) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(p.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Password reset error:", error);
        alert("Failed to send password reset email. Please try again.");
        return;
      }

      alert(`Password reset email has been sent to ${p.email}.`);
    } catch (error) {
      console.error("Password reset error:", error);
      alert("Failed to send password reset email. Please try again.");
    }
  }

  // Calculate total modules for a user based on their roles
  function getTotalModulesForUser(userId: string, isAdmin: boolean): number {
    // Early return if data not loaded
    if (!modules.length || !categories.length) {
      return 0;
    }

    if (isAdmin) {
      // Admins see all active modules
      return modules.filter((m) => m.is_active !== false).length;
    }

    // Always include New Hire role, plus any other assigned roles
    const userRoles = new Set([NEW_HIRE_ROLE]);
    if (userRolesMap[userId]?.length > 0) {
      userRolesMap[userId].forEach((rid) => userRoles.add(rid));
    }

    // Get all categories accessible to this user (based on their roles)
    const accessibleCategoryIds = new Set<string>();
    categories.forEach((cat) => {
      // Check if category is active and has a role_id that matches user's roles
      if (cat.is_active !== false && cat.role_id) {
        if (userRoles.has(cat.role_id)) {
          accessibleCategoryIds.add(cat.id);
        }
      }
    });

    // Count active modules in accessible categories
    const count = modules.filter((m) => {
      return (
        m.is_active !== false &&
        m.category_id &&
        accessibleCategoryIds.has(m.category_id)
      );
    }).length;

    return count;
  }

  // Calculate completed modules for a user
  // Count modules that are either:
  // 1. Completed via quiz (quiz_attempts with passed = true), OR
  // 2. Completed without quiz (module_progress with status = "complete")
  function getCompletedModulesForUser(userId: string): number {
    const completedModuleIds = new Set<string>();
    
    // Add modules completed via quiz attempts
    const userAttempts = attemptsMap[userId] || [];
    userAttempts
      .filter((x) => x.passed)
      .forEach((x) => completedModuleIds.add(x.module_id));
    
    // Add modules completed without quiz (from module_progress)
    const userProgress = moduleProgress.filter((mp) => mp.user_id === userId);
    userProgress
      .filter((mp) => mp.status === "complete")
      .forEach((mp) => completedModuleIds.add(mp.module_id));
    
    return completedModuleIds.size;
  }

  function exportCSV() {
    const headers = ["User", "Email", "Roles", "Completed", "Last Online"];

    const rows: string[][] = [];

    profiles.forEach((p) => {
      const completed = userCompletedModulesMap[p.id] || 0;
      const total = userTotalModulesMap[p.id] || 0;

      // Always include New Hire role, and ensure it's first
      const userRolesSet = new Set([NEW_HIRE_ROLE]);
      if (userRolesMap[p.id]?.length > 0) {
        userRolesMap[p.id].forEach((rid) => userRolesSet.add(rid));
      }
      
      // Sort roles: New Hire first, then alphabetically
      const userRoles = Array.from(userRolesSet).sort((a, b) => {
        if (a === NEW_HIRE_ROLE) return -1;
        if (b === NEW_HIRE_ROLE) return 1;
        const roleA = roles.find((r) => r.id === a);
        const roleB = roles.find((r) => r.id === b);
        return (roleA?.name || "").localeCompare(roleB?.name || "");
      });

      const roleNames = userRoles
        .map((rid) => roles.find((r) => r.id === rid)?.name || "New Hire")
        .join(" | ");

      rows.push([
        `${p.first_name} ${p.last_name}`,
        p.email,
        p.is_admin ? "Admin" : roleNames,
        `${completed}/${total}`,
        p.last_online_at
          ? new Date(p.last_online_at).toLocaleDateString()
          : "Never",
      ]);
    });

    const csv =
      headers.join(",") +
      "\n" +
      rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    
    // Fix date format - use current date when downloaded
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    a.download = `users_export_${dateStr}.csv`;
    a.click();
  }

  /* ---------------------------- UI ----------------------------- */

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-[70vh] text-xl text-gray-500">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093075]"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  // Filter and sort users
  const filtered = profiles.filter((p) => {
    const full = `${p.first_name} ${p.last_name}`.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = full.includes(q) || p.email.toLowerCase().includes(q);

    if (sortByRole === "all") return matchesSearch;

    // Filter by role
    if (sortByRole === "admin") {
      return matchesSearch && p.is_admin;
    }

    const userRoles =
      userRolesMap[p.id]?.length > 0 ? userRolesMap[p.id] : [NEW_HIRE_ROLE];
    return matchesSearch && userRoles.includes(sortByRole);
  });

  return (
    <div className="w-full max-w-[95%] mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#0A2C57]">Users</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage user accounts and roles
          </p>
        </div>
        <div className="flex items-center gap-4">
          {(search || sortByRole !== "all") && (
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <span className="text-sm text-blue-700">
                Showing {filtered.length} of {profiles.length}
              </span>
            </div>
          )}
          <div className="bg-[#E8F4FA] px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-600">Total Users:</span>
            <span className="ml-2 text-lg font-bold text-[#0A2C57]">
              {profiles.length}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition"
            />
          </div>

          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={sortByRole}
              onChange={(e) => setSortByRole(e.target.value)}
              className="pl-10 pr-8 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setManageRolesModalOpen(true)}
            className="flex items-center gap-2 bg-[#0A2C57] hover:bg-[#093075] text-white px-4 py-2.5 rounded-lg font-semibold transition shadow-sm hover:shadow-md cursor-pointer"
          >
            <Settings size={18} /> Manage Roles
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-[#6EC1E4] hover:bg-[#5bb7de] text-white px-4 py-2.5 rounded-lg font-semibold transition shadow-sm hover:shadow-md cursor-pointer"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Users Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl shadow-sm p-12 text-center">
          <Users size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Users Found
          </h3>
          <p className="text-gray-500">
            {search || sortByRole !== "all"
              ? "Try adjusting your search or filter criteria."
              : "No users in the system yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#0A2C57] to-[#093075] text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">User</th>
                  <th className="px-6 py-4 text-left font-semibold">Email</th>
                  <th className="px-6 py-4 text-left font-semibold">Roles</th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Last Online
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Completed
                  </th>
                  <th className="px-6 py-4 text-right font-semibold"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filtered.map((p, idx) => {
                  const completed = userCompletedModulesMap[p.id] || 0;
                  const total = userTotalModulesMap[p.id] || 0;
                  const isComplete = total > 0 && completed === total;

                  // Always include New Hire role, and ensure it's first
                  const userRolesSet = new Set([NEW_HIRE_ROLE]);
                  if (userRolesMap[p.id]?.length > 0) {
                    userRolesMap[p.id].forEach((rid) => userRolesSet.add(rid));
                  }
                  
                  // Sort roles: New Hire first, then alphabetically
                  const userRoles = Array.from(userRolesSet).sort((a, b) => {
                    if (a === NEW_HIRE_ROLE) return -1;
                    if (b === NEW_HIRE_ROLE) return 1;
                    const roleA = roles.find((r) => r.id === a);
                    const roleB = roles.find((r) => r.id === b);
                    return (roleA?.name || "").localeCompare(roleB?.name || "");
                  });

                  const isNearBottom = idx >= filtered.length - 2;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0A2C57]">
                          {p.first_name} {p.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600">{p.email}</div>
                      </td>

                      <td className="px-6 py-4">
                        {p.is_admin ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            <Shield size={14} /> Admin
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {userRoles.map((rid) => {
                              const r = roles.find((x) => x.id === rid);
                              const isNewHire = rid === NEW_HIRE_ROLE;
                              return (
                                <span
                                  key={rid}
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                    isNewHire
                                      ? "bg-[#6EC1E4] text-white"
                                      : "bg-[#E8F4FA] text-[#0A2C57]"
                                  }`}
                                >
                                  {r?.name || "New Hire"}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-600 text-sm">
                          {p.last_online_at
                            ? new Date(p.last_online_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "Never"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="grid grid-cols-3 items-center">
                          <div></div>
                          <div className="flex justify-center">
                            <span
                              className={`font-semibold ${
                                isComplete ? "text-green-600" : "text-gray-700"
                              }`}
                            >
                              {completed}/{total}
                            </span>
                          </div>
                          <div className="flex justify-start pl-2">
                            {isComplete && (
                              <CheckCircle2
                                size={20}
                                className="text-green-600"
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <ActionMenu
                          user={p}
                          isNearBottom={isNearBottom}
                          currentUserId={currentUserId || undefined}
                          onManageRoles={() => openAssignRolesModal(p)}
                          onToggleAdmin={() => toggleAdmin(p)}
                          onResetPassword={() => resetPassword(p)}
                          onDeleteAccount={() => openDeleteModal(p)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AssignRolesModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        user={modalUser}
        roles={roles}
        existingRoles={modalUser ? userRolesMap[modalUser.id] || [] : []}
        refreshAssignments={loadData}
      />

      <ManageRolesModal
        open={manageRolesModalOpen}
        onClose={() => setManageRolesModalOpen(false)}
        refreshRoles={loadRoles}
        roles={roles}
      />

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteUser(null);
        }}
        user={deleteUser}
        onDeleted={loadData}
      />
    </div>
  );
}
