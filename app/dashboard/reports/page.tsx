"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Search,
  BarChart2,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Target,
  Filter,
  Trophy,
  Medal,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";

// Types
interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  is_admin?: boolean;
  avatar_url?: string | null;
}

interface Module {
  id: string;
  title: string;
}

interface Role {
  id: string;
  name: string;
}

interface QuizAttempt {
  id: number;
  user_id: string;
  module_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, string> | null;
  created_at: string;
  time_spent: number | null;
}

interface Question {
  id: string;
  module_id: string;
  question_text: string;
  options: string[];
  correct_index: number | null;
  order_index: number;
}

type UserRoleRow = { user_id: string; role_id: string };

// Utility
const formatTime = (seconds: number | null) => {
  if (!seconds) return "–";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const COLORS = ["#6EC1E4", "#0A2C57", "#5bb7de", "#093075", "#E8F4FA"];

const NEW_HIRE_ROLE_ID = "524f3167-6d9f-4474-b20f-98db519994b9";

// Leaderboard Component
function LeaderboardSection({
  profiles,
  moduleProgress,
  modules,
  categories,
  userRolesMap,
  onUserClick,
}: {
  profiles: Profile[];
  moduleProgress: Array<{ user_id: string; module_id: string; status: string }>;
  modules: Array<{ id: string; category_id: string; is_active: boolean }>;
  categories: Array<{ id: string; role_id: string | null; is_active: boolean }>;
  userRolesMap: Record<string, string[]>;
  onUserClick?: (userName: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Calculate leaderboard
  const leaderboard = useMemo(() => {
    // Count completed modules per user
    const userModuleCounts: Record<string, number> = {};
    moduleProgress.forEach((row) => {
      if (!userModuleCounts[row.user_id]) {
        userModuleCounts[row.user_id] = 0;
      }
      userModuleCounts[row.user_id]++;
    });

    // Calculate total assigned modules and completion rate for each user
    const calculateUserStats = (profile: Profile) => {
      let totalModules = 0;

      if (profile.is_admin) {
        // Admins see all active modules
        totalModules = modules.filter((m) => m.is_active !== false).length;
      } else {
        // Get user's roles (always includes New Hire)
        const userRoles = new Set([NEW_HIRE_ROLE_ID]);
        if (userRolesMap[profile.id]?.length > 0) {
          userRolesMap[profile.id].forEach((rid) => userRoles.add(rid));
        }

        // Get accessible categories based on roles
        const accessibleCategoryIds = new Set<string>();
        categories.forEach((cat) => {
          if (cat.is_active !== false && cat.role_id && userRoles.has(cat.role_id)) {
            accessibleCategoryIds.add(cat.id);
          }
        });

        // Count active modules in accessible categories
        totalModules = modules.filter((m) => {
          return m.is_active !== false && m.category_id && accessibleCategoryIds.has(m.category_id);
        }).length;
      }

      const completed = userModuleCounts[profile.id] || 0;
      const completionRate = totalModules > 0 ? completed / totalModules : 0;

      return { completed, totalModules, completionRate };
    };

    // Build leaderboard array
    const board = profiles
      .map((profile) => {
        const name =
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          profile.email ||
          "Unknown User";

        const stats = calculateUserStats(profile);

        // Calculate weighted score: completed modules get 100x weight, completion rate gets 1x weight
        // This ensures users who complete more modules rank higher, regardless of completion rate
        // Example: 10 modules @ 20% = 1000.2, 2 modules @ 100% = 200.1
        const weightedScore = (stats.completed * 100) + (stats.completionRate * 1);

        return {
          id: profile.id,
          name: name.trim() || "Unknown User",
          avatarUrl: profile.avatar_url || null,
          completedModules: stats.completed,
          totalModules: stats.totalModules,
          completionRate: stats.completionRate,
          weightedScore: weightedScore,
        };
      })
      .sort((a, b) => {
        // Primary sort: weighted score (descending) - heavily favors total completed modules
        if (Math.abs(b.weightedScore - a.weightedScore) > 0.01) {
          return b.weightedScore - a.weightedScore;
        }
        // Tie-breaker: completed modules (descending) - in case of rare exact score match
        if (b.completedModules !== a.completedModules) {
          return b.completedModules - a.completedModules;
        }
        // Final tie-breaker: name (alphabetical)
        return a.name.localeCompare(b.name);
      });

    return board;
  }, [profiles, moduleProgress, modules, categories, userRolesMap]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="text-yellow-500" size={20} />;
    } else if (rank === 2) {
      return <Medal className="text-gray-400" size={20} />;
    } else if (rank === 3) {
      return <Medal className="text-orange-500" size={20} />;
    }
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300";
    } else if (rank === 2) {
      return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300";
    } else if (rank === 3) {
      return "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300";
    }
    return "bg-white border-gray-200";
  };

  const displayedUsers = isExpanded ? leaderboard : leaderboard.slice(0, 3);
  const hasMoreUsers = leaderboard.length > 3;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-[#0A2C57]">Rank</th>
              <th className="px-4 py-3 text-left font-semibold text-[#0A2C57]">User</th>
              <th className="px-4 py-3 text-center font-semibold text-[#0A2C57]">Completed</th>
              <th className="px-4 py-3 text-center font-semibold text-[#0A2C57]">Total</th>
              <th className="px-4 py-3 text-center font-semibold text-[#0A2C57]">Completion Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedUsers.map((user, index) => {
              const rank = index + 1;
              return (
                <tr
                  key={user.id}
                  onClick={() => onUserClick?.(user.name)}
                  className={`transition-colors cursor-pointer ${getRankStyle(rank)} ${
                    onUserClick ? "hover:bg-gray-100 hover:shadow-sm" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getRankIcon(rank)}
                      <span className="font-semibold text-[#0A2C57]">{rank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <User className="text-gray-400" size={24} />
                        )}
                      </div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-[#0A2C57]">{user.completedModules}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-600">{user.totalModules}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-[#6EC1E4]">
                      {(user.completionRate * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-gray-500">No completed modules yet.</div>
        )}
      </div>
      
      {hasMoreUsers && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0A2C57] hover:text-[#6EC1E4] transition-colors border border-gray-300 rounded-lg hover:border-[#6EC1E4]"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={18} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={18} />
                Show All ({leaderboard.length} users)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesFull, setModulesFull] = useState<Array<{ id: string; category_id: string; is_active: boolean }>>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userRolesMap, setUserRolesMap] = useState<Record<string, string[]>>({});
  const [moduleProgress, setModuleProgress] = useState<Array<{ user_id: string; module_id: string; status: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; role_id: string | null; is_active: boolean }>>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [
        { data: modulesData },
        { data: profilesData },
        { data: rolesData },
        { data: attemptsData },
        { data: questionsData },
        { data: userRolesData },
        { data: progressData },
        { data: modulesFullData },
        { data: categoriesData },
      ] = await Promise.all([
        supabase.from("modules").select("id, title").order("title"),
        supabase
          .from("profiles")
          .select("id, first_name, last_name, email, is_admin, avatar_url")
          .order("first_name"),
        supabase.from("roles").select("id, name").order("name"),
        supabase
          .from("quiz_attempts")
          .select("id, user_id, module_id, score, passed, answers, created_at, time_spent"),
        supabase
          .from("quiz_questions")
          .select("id, module_id, question_text, options, correct_index, order_index")
          .order("order_index"),
        supabase.from("user_roles").select("user_id, role_id"),
        supabase.from("module_progress").select("user_id, module_id, status").eq("status", "complete"),
        supabase.from("modules").select("id, category_id, is_active"),
        supabase.from("categories").select("id, role_id, is_active"),
      ]);

      setModules(modulesData || []);
      setProfiles(profilesData || []);
      setRoles(rolesData || []);
      setAttempts(attemptsData || []);
      setQuestions(questionsData || []);
      setModuleProgress(progressData || []);
      setModulesFull(modulesFullData || []);
      setCategories(categoriesData || []);

      // Build user roles map
      const map: Record<string, string[]> = {};
      (userRolesData || []).forEach((ur: UserRoleRow) => {
        if (!map[ur.user_id]) map[ur.user_id] = [];
        map[ur.user_id].push(ur.role_id);
      });
      setUserRolesMap(map);

      setLoading(false);
    };

    loadData();
  }, []);

  // Filter attempts based on search, module, and role
  const filteredAttempts = useMemo(() => {
    let filtered = attempts;

    // Filter by search query (user name or email)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchingUserIds = profiles
        .filter(
          (p) =>
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q)
        )
        .map((p) => p.id);
      filtered = filtered.filter((a) => matchingUserIds.includes(a.user_id));
    }

    // Filter by module
    if (selectedModule !== "all") {
      filtered = filtered.filter((a) => a.module_id === selectedModule);
    }

    // Filter by role
    if (selectedRole !== "all") {
      const userIdsWithRole = Object.entries(userRolesMap)
        .filter(([, roleIds]) => roleIds.includes(selectedRole))
        .map(([userId]) => userId);
      filtered = filtered.filter((a) => userIdsWithRole.includes(a.user_id));
    }

    return filtered;
  }, [attempts, searchQuery, selectedModule, selectedRole, profiles, userRolesMap]);

  // Module map
  const moduleMap = useMemo(() => {
    const map: Record<string, string> = {};
    modules.forEach((m) => (map[m.id] = m.title));
    return map;
  }, [modules]);

  // General Stats
  const generalStats = useMemo(() => {
    const totalAttempts = filteredAttempts.length;
    const passedAttempts = filteredAttempts.filter((a) => a.passed).length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            filteredAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
          )
        : 0;
    const avgTime =
      totalAttempts > 0
        ? Math.round(
            filteredAttempts
              .filter((a) => a.time_spent)
              .reduce((sum, a) => sum + (a.time_spent || 0), 0) /
              filteredAttempts.filter((a) => a.time_spent).length
          )
        : 0;
    const uniqueUsers = new Set(filteredAttempts.map((a) => a.user_id)).size;
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

    return {
      totalAttempts,
      passedAttempts,
      avgScore,
      avgTime,
      uniqueUsers,
      passRate,
    };
  }, [filteredAttempts]);

  // Quiz Stats (per module)
  const quizStats = useMemo(() => {
    const grouped: Record<
      string,
      {
        totalAttempts: number;
        passedAttempts: number;
        totalScore: number;
        totalTime: number;
        timeCount: number;
      }
    > = {};

    filteredAttempts.forEach((a) => {
      if (!grouped[a.module_id]) {
        grouped[a.module_id] = {
          totalAttempts: 0,
          passedAttempts: 0,
          totalScore: 0,
          totalTime: 0,
          timeCount: 0,
        };
      }
      grouped[a.module_id].totalAttempts += 1;
      if (a.passed) grouped[a.module_id].passedAttempts += 1;
      grouped[a.module_id].totalScore += a.score;
      if (a.time_spent) {
        grouped[a.module_id].totalTime += a.time_spent;
        grouped[a.module_id].timeCount += 1;
      }
    });

    return Object.entries(grouped)
      .map(([module_id, val]) => ({
        module_id,
        module: moduleMap[module_id] || "Unknown",
        totalAttempts: val.totalAttempts,
        passedAttempts: val.passedAttempts,
        passRate: Math.round((val.passedAttempts / val.totalAttempts) * 100),
        avgScore: Math.round(val.totalScore / val.totalAttempts),
        avgTime: val.timeCount > 0 ? Math.round(val.totalTime / val.timeCount) : 0,
      }))
      .sort((a, b) => b.totalAttempts - a.totalAttempts);
  }, [filteredAttempts, moduleMap]);

  // Question Stats (identify difficult questions)
  const questionStats = useMemo(() => {
    const stats: Record<
      string,
      {
        question: Question;
        totalAttempts: number;
        correctAnswers: number;
        incorrectAnswers: number;
      }
    > = {};

    // Get all questions for filtered modules
    const relevantModuleIds = new Set(filteredAttempts.map((a) => a.module_id));
    const relevantQuestions = questions.filter((q) => relevantModuleIds.has(q.module_id));

    relevantQuestions.forEach((q) => {
      stats[q.id] = {
        question: q,
        totalAttempts: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
      };
    });

    // Analyze each attempt's answers
    filteredAttempts.forEach((attempt) => {
      if (!attempt.answers) return;

      const answers = attempt.answers; // Store in local variable for type narrowing
      const moduleQuestions = questions
        .filter((q) => q.module_id === attempt.module_id)
        .sort((a, b) => a.order_index - b.order_index);

      moduleQuestions.forEach((q, index) => {
        const answerKey = index.toString();
        const userAnswer = answers[answerKey];
        if (!userAnswer) return;

        if (!stats[q.id]) {
          stats[q.id] = {
            question: q,
            totalAttempts: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
          };
        }

        stats[q.id].totalAttempts += 1;

        // Check if answer is correct
        const correctAnswer =
          q.correct_index !== null ? q.options[q.correct_index] : null;
        if (userAnswer === correctAnswer) {
          stats[q.id].correctAnswers += 1;
        } else {
          stats[q.id].incorrectAnswers += 1;
        }
      });
    });

    return Object.values(stats)
      .map((stat) => ({
        questionId: stat.question.id,
        questionText: stat.question.question_text,
        module: moduleMap[stat.question.module_id] || "Unknown",
        totalAttempts: stat.totalAttempts,
        correctAnswers: stat.correctAnswers,
        incorrectAnswers: stat.incorrectAnswers,
        accuracy: stat.totalAttempts > 0
          ? Math.round((stat.correctAnswers / stat.totalAttempts) * 100)
          : 0,
      }))
      .filter((s) => s.totalAttempts > 0)
      .sort((a, b) => a.accuracy - b.accuracy); // Sort by accuracy (lowest first = most difficult)
  }, [filteredAttempts, questions, moduleMap]);

  // Trend Data (last 30 days)
  const trendData = useMemo(() => {
    const daily: Record<
      string,
      { attempts: number; passed: number; totalScore: number }
    > = {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    filteredAttempts
      .filter((a) => new Date(a.created_at) >= thirtyDaysAgo)
      .forEach((a) => {
        const day = new Date(a.created_at).toISOString().split("T")[0];
        if (!daily[day]) {
          daily[day] = { attempts: 0, passed: 0, totalScore: 0 };
        }
        daily[day].attempts += 1;
        if (a.passed) daily[day].passed += 1;
        daily[day].totalScore += a.score;
      });

    return Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, val]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        attempts: val.attempts,
        passed: val.passed,
        avgScore: Math.round(val.totalScore / val.attempts),
      }));
  }, [filteredAttempts]);

  // Pass Rate Distribution
  const passRateData = useMemo(() => {
    const distribution = {
      "90-100%": 0,
      "80-89%": 0,
      "70-79%": 0,
      "60-69%": 0,
      "Below 60%": 0,
    };

    filteredAttempts.forEach((a) => {
      if (a.score >= 90) distribution["90-100%"] += 1;
      else if (a.score >= 80) distribution["80-89%"] += 1;
      else if (a.score >= 70) distribution["70-79%"] += 1;
      else if (a.score >= 60) distribution["60-69%"] += 1;
      else distribution["Below 60%"] += 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredAttempts]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093075]"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[95%] mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#0A2C57]">Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Comprehensive insights into quiz performance and learning trends
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition"
            />
          </div>

          <div className="relative">
            <Filter
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Quizzes</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6EC1E4] focus:border-[#6EC1E4] transition appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* General Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-[#6EC1E4] to-[#5bb7de] text-white rounded-xl shadow-lg p-5">
          <BarChart2 size={24} className="mb-2 opacity-90" />
          <div className="text-xs opacity-90 mb-1">Total Attempts</div>
          <div className="text-2xl font-bold">{generalStats.totalAttempts}</div>
        </div>

        <div className="bg-gradient-to-br from-[#0A2C57] to-[#093075] text-white rounded-xl shadow-lg p-5">
          <CheckCircle2 size={24} className="mb-2 opacity-90" />
          <div className="text-xs opacity-90 mb-1">Pass Rate</div>
          <div className="text-2xl font-bold">{generalStats.passRate}%</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-5">
          <TrendingUp size={24} className="mb-2 opacity-90" />
          <div className="text-xs opacity-90 mb-1">Avg Score</div>
          <div className="text-2xl font-bold">{generalStats.avgScore}%</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-5">
          <Clock size={24} className="mb-2 opacity-90" />
          <div className="text-xs opacity-90 mb-1">Avg Time</div>
          <div className="text-xl font-bold">{formatTime(generalStats.avgTime)}</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-5">
          <Target size={24} className="mb-2 opacity-90" />
          <div className="text-xs opacity-90 mb-1">Passed</div>
          <div className="text-2xl font-bold">{generalStats.passedAttempts}</div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="text-[#6EC1E4]" size={20} />
          <h2 className="text-xl font-semibold text-[#0A2C57]">Leaderboard</h2>
        </div>
        <LeaderboardSection
          profiles={profiles}
          moduleProgress={moduleProgress}
          modules={modulesFull}
          categories={categories}
          userRolesMap={userRolesMap}
          onUserClick={(userName) => setSearchQuery(userName)}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Performance by Module */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="text-[#6EC1E4]" size={20} />
            <h2 className="text-xl font-semibold text-[#0A2C57]">Quiz Performance by Module</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quizStats.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="module"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#6EC1E4" name="Avg Score (%)" />
              <Bar dataKey="passRate" fill="#0A2C57" name="Pass Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-[#6EC1E4]" size={20} />
            <h2 className="text-xl font-semibold text-[#0A2C57]">Score Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={passRateData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [
                  `${value} attempts (${((value / generalStats.totalAttempts) * 100).toFixed(1)}%)`,
                  "Attempts"
                ]}
              />
              <Bar
                dataKey="value"
                fill="#6EC1E4"
                radius={[0, 8, 8, 0]}
                name="Attempts"
              >
                {passRateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-[#6EC1E4]" size={20} />
          <h2 className="text-xl font-semibold text-[#0A2C57]">Quiz Activity Trend (Last 30 Days)</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="attempts"
              stroke="#0A2C57"
              strokeWidth={2}
              name="Total Attempts"
            />
            <Line
              type="monotone"
              dataKey="passed"
              stroke="#6EC1E4"
              strokeWidth={2}
              name="Passed"
            />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="#5bb7de"
              strokeWidth={2}
              name="Avg Score (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quiz Stats Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-[#6EC1E4]" size={20} />
            <h2 className="text-xl font-semibold text-[#0A2C57]">Quiz Statistics</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#0A2C57] to-[#093075] text-white">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Quiz</th>
                <th className="px-6 py-3 text-center font-semibold">Attempts</th>
                <th className="px-6 py-3 text-center font-semibold">Passed</th>
                <th className="px-6 py-3 text-center font-semibold">Pass Rate</th>
                <th className="px-6 py-3 text-center font-semibold">Avg Score</th>
                <th className="px-6 py-3 text-center font-semibold">Avg Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quizStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No quiz data available for selected filters
                  </td>
                </tr>
              ) : (
                quizStats.map((stat) => (
                  <tr key={stat.module_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#0A2C57]">{stat.module}</td>
                    <td className="px-6 py-4 text-center">{stat.totalAttempts}</td>
                    <td className="px-6 py-4 text-center">{stat.passedAttempts}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          stat.passRate >= 80
                            ? "bg-green-100 text-green-700"
                            : stat.passRate >= 60
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {stat.passRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">{stat.avgScore}%</td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {formatTime(stat.avgTime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Difficult Questions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} />
            <h2 className="text-xl font-semibold text-[#0A2C57]">
              Most Difficult Questions (Need More Practice)
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Questions with the lowest accuracy rates - identify areas where technicians need more
            training
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Question</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Quiz</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Attempts</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Correct</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Incorrect</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questionStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No question data available for selected filters
                  </td>
                </tr>
              ) : (
                questionStats.slice(0, 20).map((stat) => (
                  <tr key={stat.questionId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <div className="font-medium text-[#0A2C57]">{stat.questionText}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{stat.module}</td>
                    <td className="px-6 py-4 text-center">{stat.totalAttempts}</td>
                    <td className="px-6 py-4 text-center text-green-600 font-medium">
                      {stat.correctAnswers}
                    </td>
                    <td className="px-6 py-4 text-center text-red-600 font-medium">
                      {stat.incorrectAnswers}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          stat.accuracy >= 80
                            ? "bg-green-100 text-green-700"
                            : stat.accuracy >= 60
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {stat.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
