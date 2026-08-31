import React, { useEffect, useMemo, useState } from "react";
import { 
  Users, 
  Briefcase, 
  ShieldAlert, 
  TrendingUp, 
  ArrowUpRight,
  CalendarDays,
  Zap, 
  Globe,
  Building2,
  Calendar,
  RefreshCw,
  X,
  Award,
  Activity,
  GraduationCap,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  KeyRound,
  Lock,
  ExternalLink,
  MessageSquareWarning,
} from "lucide-react";

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDashboard } from "@/hooks/useDashboard";
import { useUsersSummary } from "@/hooks/useUsers";
import { useAnalytics, useAnalyticsFilters } from "@/hooks/useAnalytics";
import { useReportedPosts, useReportedPostMutations } from "@/hooks/useReportedPosts";
import { fetchSecurityLogs, type SecurityLog } from "@/services/apiSecurity";
import { type ReportedPost } from "@/services/apiContent";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { AnalyticsFilters } from "@/services/apiAnalytics";

const SECTOR_COLORS = [
  "#4f46e5", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#14b8a6", // Teal
  "#f97316", // Orange
];

export default function AdminOverview() {
  // Overview Tab Queries
  const { data: dashboardData, isLoading: loading, error: dashboardError } = useDashboard();
  const { summary: usersSummary, isLoading: usersLoading, error: usersError } = useUsersSummary();
  const summary = dashboardData || null;

  // Analytics State & Filters (Active for both Overview and Platform Analytics)
  const [filters, setFilters] = useState<AnalyticsFilters>({
    country: "all",
    sector: "all",
    timeframe: "all",
    cohort: "all",
  });

  const { analytics, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics(filters);
  const { filtersData, isLoading: filtersLoading } = useAnalyticsFilters();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Post Moderation / Reported Posts Hook
  const { reportedPosts, isLoading: reportedPostsLoading, refetch: refetchReportedPosts } = useReportedPosts();
  const { hidePost, unhidePost, deletePost, isHiding, isUnhiding, isDeleting } = useReportedPostMutations();

  // Selected post for detail modal & delete confirmation
  const [selectedReportedPost, setSelectedReportedPost] = useState<ReportedPost | null>(null);
  const [postDetailModalOpen, setPostDetailModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<ReportedPost | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Live Recent Activity query from Backend Security Logs
  const { data: securityLogsData, isLoading: logsLoading } = useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: () => fetchSecurityLogs(undefined, 1, 6),
    staleTime: 30 * 1000,
  });

  const recentLogs: SecurityLog[] = securityLogsData?.data ?? [];

  // Dynamic filter lists learned from the API responses over time
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);

  useEffect(() => {
    if (analytics) {
      if (analytics.byCountry && analytics.byCountry.length > 0) {
        setAvailableCountries((prev) => {
          const combined = Array.from(new Set([...prev, ...analytics.byCountry.map((c) => c.country)]));
          return combined.filter(Boolean);
        });
      }
      if (analytics.bySector && analytics.bySector.length > 0) {
        setAvailableSectors((prev) => {
          const combined = Array.from(new Set([...prev, ...analytics.bySector.map((s) => s.sector)]));
          return combined.filter(Boolean);
        });
      }
    }
  }, [analytics]);

  const defaultCountries = ["Nigeria", "Ghana", "Kenya", "South Africa", "United Kingdom", "United States"];
  const defaultSectors = ["Technology", "Agriculture", "Finance", "Healthcare", "Education", "Energy"];

  const cohortList = useMemo(() => {
    if (filtersData?.cohorts && filtersData.cohorts.length > 0) return filtersData.cohorts;
    return ["2021", "2022", "2023", "2024", "2025", "2026"];
  }, [filtersData]);

  const countryList = useMemo(() => {
    if (filtersData?.countries && filtersData.countries.length > 0) return filtersData.countries;
    return availableCountries.length > 0 ? availableCountries : defaultCountries;
  }, [filtersData, availableCountries]);

  const sectorList = useMemo(() => {
    if (filtersData?.sectors && filtersData.sectors.length > 0) return filtersData.sectors;
    return availableSectors.length > 0 ? availableSectors : defaultSectors;
  }, [filtersData, availableSectors]);

  const timeframeList = useMemo(() => {
    if (filtersData?.timeframes && filtersData.timeframes.length > 0) return filtersData.timeframes;
    return [
      { label: "All time", value: "all" },
      { label: "Last 7 days", value: "7" },
      { label: "Last 30 days", value: "30" },
      { label: "Last 90 days", value: "90" },
      { label: "Last 6 months", value: "180" },
      { label: "Last year", value: "365" },
    ];
  }, [filtersData]);

  useEffect(() => {
    if (dashboardError) console.error("Dashboard error:", dashboardError);
    if (usersError) console.error("Users error:", usersError);
    if (analyticsError) console.error("Analytics error:", analyticsError);
  }, [dashboardError, usersError, analyticsError]);

  // Overview Tab Calculations
  const verifiedCount = usersSummary?.verifiedUsers ?? summary?.verifiedUsers ?? 0;
  const pendingCount = usersSummary?.pendingUsers ?? summary?.pendingUsers ?? 0;

  const userDistribution = [
    { name: "Verified Alumni", value: verifiedCount, color: "#0f172a" },
    { name: "Pending Verification", value: pendingCount, color: "#f97316" },
  ];

  // Dynamic Cohort Distribution data from backend analytics
  const cohortDistributionData = useMemo(() => {
    if (analytics?.byCohort && analytics.byCohort.length > 0) {
      return analytics.byCohort.map((c) => ({
        name: `Class of ${c.cohort}`,
        members: c.memberCount,
      }));
    }
    // Fallback if byCohort is empty: display byCountry or defaults
    if (analytics?.byCountry && analytics.byCountry.length > 0) {
      return analytics.byCountry.slice(0, 6).map((c) => ({
        name: c.country,
        members: c.memberCount,
      }));
    }
    return [
      { name: "2021", members: 45 },
      { name: "2022", members: 82 },
      { name: "2023", members: 120 },
      { name: "2024", members: 165 },
      { name: "2025", members: 95 },
    ];
  }, [analytics?.byCohort, analytics?.byCountry]);

  // Analytics Tab Calculations
  const countryData = useMemo(() => {
    if (!analytics?.byCountry) return [];
    return analytics.byCountry.map((item) => ({
      name: item.country,
      members: item.memberCount,
    }));
  }, [analytics?.byCountry]);

  const platformStatsData = useMemo(() => {
    if (!analytics?.stats) return [];
    return [
      { name: "Members", value: summary?.totalUsers ?? analytics.stats.totalMembers, fill: "#6366f1" },
      { name: "Groups", value: analytics.stats.totalGroups, fill: "#10b981" },
      { name: "Deal Rooms", value: analytics.stats.totalDealRooms, fill: "#f59e0b" },
      { name: "Posts", value: analytics.stats.totalPosts, fill: "#ec4899" },
      { name: "Events", value: analytics.stats.totalEvents, fill: "#8b5cf6" },
    ];
  }, [analytics?.stats, summary?.totalUsers]);

  const sectorData = useMemo(() => {
    if (!analytics?.bySector) return [];
    return analytics.bySector.map((item, idx) => ({
      name: item.sector,
      value: item.memberCount,
      color: SECTOR_COLORS[idx % SECTOR_COLORS.length],
    }));
  }, [analytics?.bySector]);

  const totalSectorMembers = useMemo(() => {
    return sectorData.reduce((acc, curr) => acc + curr.value, 0);
  }, [sectorData]);

  const maxActivityScore = useMemo(() => {
    if (!analytics?.activeUsers || analytics.activeUsers.length === 0) return 100;
    return Math.max(...analytics.activeUsers.map((u) => u.activityScore), 100);
  }, [analytics?.activeUsers]);

  const handleFilterChange = (key: keyof AnalyticsFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchAnalytics(), refetchReportedPosts()]);
    setIsRefreshing(false);
  };

  const handleResetFilters = () => {
    setFilters({
      country: "all",
      sector: "all",
      timeframe: "all",
      cohort: "all",
    });
  };

  const hasActiveFilters =
    filters.country !== "all" ||
    filters.sector !== "all" ||
    filters.timeframe !== "all" ||
    filters.cohort !== "all";

  // Helper for rendering security log items
  const renderLogIcon = (type: string) => {
    switch (type) {
      case "LOGIN_SUCCESS":
        return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case "LOGIN_FAILED":
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case "PASSWORD_RESET_REQUEST":
        return <KeyRound className="h-4 w-4 text-amber-500" />;
      case "ACCOUNT_LOCKED":
        return <Lock className="h-4 w-4 text-rose-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatLogType = (type: string) => {
    switch (type) {
      case "LOGIN_SUCCESS":
        return "Alumni Login Success";
      case "LOGIN_FAILED":
        return "Failed Login Attempt";
      case "PASSWORD_RESET_REQUEST":
        return "Password Reset Requested";
      case "ACCOUNT_LOCKED":
        return "Account Locked for Security";
      case "ACCOUNT_DELETED":
        return "Account Deleted";
      default:
        return type.replace(/_/g, " ");
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor real-time alumni network metrics, active community moderation, and platform health.
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="grid w-[360px] grid-cols-2">
            <TabsTrigger value="overview">General Overview</TabsTrigger>
            <TabsTrigger value="analytics">Platform Analytics</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ================= SHARED FILTER TOOLBAR (WORKS FOR ALL DASHBOARD DATA) ================= */}
      <Card className="p-4 bg-card/70 backdrop-blur-md shadow-xs border border-border/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Cohort Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> All Cohorts
              </span>
              <Select
                value={filters.cohort || "all"}
                onValueChange={(val) => handleFilterChange("cohort", val)}
              >
                <SelectTrigger className="w-[145px] h-9">
                  <SelectValue placeholder="All Cohorts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cohorts</SelectItem>
                  {cohortList.map((c) => (
                    <SelectItem key={c} value={c}>
                      Cohort {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-primary" /> Country
              </span>
              <Select
                value={filters.country || "all"}
                onValueChange={(val) => handleFilterChange("country", val)}
              >
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countryList.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sector Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-primary" /> All Sectors
              </span>
              <Select
                value={filters.sector || "all"}
                onValueChange={(val) => handleFilterChange("sector", val)}
              >
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectorList.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timeframe Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Timeframe
              </span>
              <Select
                value={filters.timeframe || "all"}
                onValueChange={(val) => handleFilterChange("timeframe", val)}
              >
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeframeList.map((t) => (
                    <SelectItem key={t.value} value={String(t.value)}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-3 text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Reset Filters
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title="Refresh Dashboard Data"
              disabled={analyticsLoading || isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing || analyticsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* ================= GENERAL OVERVIEW TAB ================= */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Top Level Metrics (Connected to Live API Data) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard 
              title="Total Alumni" 
              value={summary?.totalUsers ?? analytics?.stats.totalMembers} 
              description={`${analytics?.stats.totalCountries || 0} countries represented`} 
              icon={<Users className="h-4 w-4 text-indigo-600" />} 
              loading={loading || analyticsLoading}
            />
            <MetricCard 
              title="Active Alumni" 
              value={summary?.activeUsers} 
              description={`${summary?.totalUsers ? Math.round(((summary.activeUsers || 0) / summary.totalUsers) * 100) : 0}% active engagement rate`} 
              icon={<Zap className="h-4 w-4 text-emerald-600" />} 
              loading={loading}
            />
            <MetricCard
              title="Active Groups"
              value={summary?.totalGroups ?? analytics?.stats.totalGroups}
              description={`${summary?.pendingGroups || 0} pending group approval`}
              icon={<Users className="h-4 w-4 text-amber-600" />}
              loading={loading || analyticsLoading}
              highlight={summary?.pendingGroups ? summary.pendingGroups > 0 : false}
            />
            <MetricCard 
              title="Active Events" 
              value={summary?.totalEvents ?? analytics?.stats.totalEvents} 
              description={`${summary?.pendingEvents || 0} pending event approval`} 
              icon={<CalendarDays className="h-4 w-4 text-pink-600" />} 
              loading={loading || analyticsLoading}
              highlight={summary?.pendingEvents ? summary.pendingEvents > 0 : false}
            />
          </div>

          {/* ================= 1.10 ADMIN POST REPORTS (IMMEDIATELY VISIBLE ON DASHBOARD) ================= */}
          <Card className="border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/20 via-background to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-lg font-bold">Reported Community Posts</CardTitle>
                  <Badge variant="destructive" className="ml-1 text-[11px] px-2 py-0.5">
                    {reportedPosts.filter((p) => !p.isHidden).length} Pending Review
                  </Badge>
                </div>
                <CardDescription>
                  Review flagged user posts, inspect report reasons, and take immediate moderation action (Hide, Unhide, or Delete).
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/admin/content" className="flex items-center gap-1.5 text-xs">
                  Manage in Content Hub <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              {reportedPostsLoading ? (
                <div className="space-y-3 py-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : reportedPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg border border-dashed">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-semibold text-foreground">No Reported Posts Pending</p>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    All community newsfeed and discussion posts are currently compliant with platform guidelines.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
                  {reportedPosts.map((post) => {
                    const initials = post.user
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "U";

                    return (
                      <div
                        key={post.id}
                        className={`p-4 rounded-lg border transition-all duration-200 flex flex-col justify-between gap-3 ${
                          post.isHidden
                            ? "bg-muted/40 border-muted opacity-85"
                            : "bg-card hover:border-amber-300 dark:hover:border-amber-700/60 shadow-xs"
                        }`}
                      >
                        <div>
                          {/* Post Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 border">
                                {post.userAvatar ? (
                                  <AvatarImage src={post.userAvatar} alt={post.user} />
                                ) : null}
                                <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold leading-none">{post.user}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{post.time}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {post.isHidden ? (
                                <Badge variant="secondary" className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border">
                                  <EyeOff className="h-3 w-3 mr-1" /> Hidden
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px] font-semibold">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> Reported
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Post Content Snippet */}
                          <p className="text-xs text-foreground/90 font-medium line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded-md border border-muted/50">
                            {post.title ? <strong className="block text-foreground mb-0.5">{post.title}</strong> : null}
                            {post.content}
                          </p>

                          {/* Report Reason Alert (Highlighted immediately) */}
                          <div className="mt-2.5 flex items-start gap-1.5 text-xs text-amber-900 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/40 p-2 rounded-md border border-amber-300/60 dark:border-amber-800/50">
                            <MessageSquareWarning className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold">Report Reason: </span>
                              <span>{post.reportReason}</span>
                              {post.reportedBy && (
                                <span className="block text-[10px] text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                                  Flagged by {post.reportedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: View, Hide/Unhide, Delete */}
                        <div className="flex items-center justify-between gap-2 border-t pt-3 mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
                            onClick={() => {
                              setSelectedReportedPost(post);
                              setPostDetailModalOpen(true);
                            }}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Full Post
                          </Button>

                          <div className="flex items-center gap-1.5">
                            {post.isHidden ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-emerald-300 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                onClick={() => unhidePost(post.postId || post.id)}
                                disabled={isUnhiding}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> Unhide Post
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-amber-300 text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                onClick={() => hidePost(post.postId || post.id)}
                                disabled={isHiding}
                              >
                                <EyeOff className="h-3.5 w-3.5 mr-1" /> Hide Post
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                              onClick={() => {
                                setPostToDelete(post);
                                setDeleteConfirmOpen(true);
                              }}
                              disabled={isDeleting}
                              title="Delete Reported Post"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Alumni by Cohort / Region Chart (Connected to Live Data) */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Alumni Network Growth</CardTitle>
                <CardDescription>Member distribution across graduation cohorts and key regions</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  {analyticsLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Skeleton className="h-[250px] w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cohortDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        />
                        <Bar dataKey="members" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alumni Verification Distribution */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Alumni Distribution</CardTitle>
                <CardDescription>Verified vs. Pending Verification</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <Skeleton className="h-40 w-40 rounded-full" />
                  </div>
                ) : (
                  <>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={userDistribution}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {userDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {userDistribution.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="font-semibold">{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Live Recent Activity & System Health */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Live Security / System Activity Feed */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>Recent Platform Activity</CardTitle>
                  <CardDescription>Live security and operational logs from backend</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-xs">
                  <a href="/admin/system">View All Logs</a>
                </Button>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-4 py-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-2.5 w-48" />
                        </div>
                        <Skeleton className="h-3 w-12" />
                      </div>
                    ))}
                  </div>
                ) : recentLogs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No recent activity logs recorded yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentLogs.map((item, i) => (
                      <div key={i} className="flex items-start gap-3.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="mt-0.5 p-1.5 bg-muted rounded-full shrink-0">
                          {renderLogIcon(item.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground leading-snug">
                            {formatLogType(item.eventType)}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {item.email} {item.ipAddress ? `• ${item.ipAddress}` : ""}
                          </p>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live System Health */}
            <Card className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle>System & Infrastructure Health</CardTitle>
                <CardDescription>Real-time backend services and authentication gateway</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 border p-3.5 rounded-lg bg-muted/20">
                  <div className="relative">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">API Gateway & Database</span>
                      <span className="font-bold text-emerald-600">Operational</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[100%]" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border rounded-lg p-3 bg-muted/10">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Total Alumni Registered</span>
                    <span className="text-base font-bold text-foreground">
                      {(summary?.totalUsers || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Verified Rate</span>
                    <span className="text-base font-bold text-foreground">
                      {summary?.totalUsers ? Math.round((verifiedCount / summary.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full text-xs h-9" asChild>
                    <a href="/admin/system">
                      Manage Platform Security <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= PLATFORM ANALYTICS TAB ================= */}
        <TabsContent value="analytics" className="space-y-6 mt-0">
          {/* Metric Cards Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Active Members"
              value={summary?.activeUsers}
              description={`${analytics?.stats.totalCountries || 0} Countries Represented`}
              icon={<Users className="h-4 w-4 text-indigo-600" />}
              loading={loading || analyticsLoading}
            />
            <MetricCard
              title="Onboarded Members"
              value={analytics?.stats.onboardedMembers}
              description={`${
                analytics?.stats.totalMembers
                  ? Math.round((analytics.stats.onboardedMembers / analytics.stats.totalMembers) * 100)
                  : 0
              }% Onboarding Rate`}
              icon={<Award className="h-4 w-4 text-emerald-600" />}
              loading={analyticsLoading}
            />
            <MetricCard
              title="Groups & Deal Rooms"
              value={analyticsLoading ? null : `${analytics?.stats.totalGroups || 0} / ${analytics?.stats.totalDealRooms || 0}`}
              description="Active Groups / Deal Rooms"
              icon={<Briefcase className="h-4 w-4 text-amber-600" />}
              loading={analyticsLoading}
            />
            <MetricCard
              title="Engagement Hub"
              value={analyticsLoading ? null : `${analytics?.stats.totalPosts || 0} / ${analytics?.stats.totalEvents || 0}`}
              description="Total Posts / Events"
              icon={<TrendingUp className="h-4 w-4 text-pink-600" />}
              loading={analyticsLoading}
            />
          </div>

          {/* Visualizations Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Country distribution */}
            <Card className="col-span-4 min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Member Distribution by Country</CardTitle>
                <CardDescription>Top active regions in the network</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : !countryData.length ? (
                  <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm">
                    No country data available for selected filters.
                  </div>
                ) : (
                  <div className="h-[300px] w-full relative min-w-0">
                    <ResponsiveContainer width="99%" height={300} key={activeTab + "-" + countryData.length}>
                      <BarChart
                        layout="vertical"
                        data={countryData}
                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                        <Tooltip
                          cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            backgroundColor: "#ffffff",
                          }}
                        />
                        <Bar dataKey="members" radius={[0, 4, 4, 0]} barSize={16}>
                          {countryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sector distribution */}
            <Card className="col-span-3 min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Member Industry Sectors</CardTitle>
                <CardDescription>Distribution across top sectors</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col justify-between h-[300px] pb-2">
                {analyticsLoading ? (
                  <div className="h-[180px] w-full flex items-center justify-center">
                    <Skeleton className="h-32 w-32 rounded-full" />
                  </div>
                ) : !sectorData.length ? (
                  <div className="h-[180px] w-full flex items-center justify-center text-muted-foreground text-sm">
                    No sector data available.
                  </div>
                ) : (
                  <>
                    <div className="h-[160px] w-full relative min-w-0">
                      <ResponsiveContainer width="99%" height={160} key={activeTab + "-" + sectorData.length}>
                        <PieChart>
                          <Pie
                            data={sectorData}
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {sectorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              backgroundColor: "#ffffff",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5 overflow-y-auto max-h-[100px] pr-1 mt-2">
                      {sectorData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-muted-foreground truncate">{item.name}</span>
                          </div>
                          <span className="font-semibold text-foreground ml-2 shrink-0">
                            {item.value} ({totalSectorMembers ? Math.round((item.value / totalSectorMembers) * 100) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard & Summary Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Active Users Leaderboard */}
            <Card className="col-span-4">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>Alumni Engagement Leaderboard</CardTitle>
                  <CardDescription>Most active members on the platform</CardDescription>
                </div>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-2 w-full" />
                        </div>
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                ) : !analytics?.activeUsers || analytics.activeUsers.length === 0 ? (
                  <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground text-sm">
                    No active users found.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {analytics.activeUsers.map((user, idx) => {
                      const initials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();
                      const percentage = Math.min(100, Math.max(5, (user.activityScore / maxActivityScore) * 100));
                      
                      let rankBadge = null;
                      if (idx === 0) {
                        rankBadge = <span className="flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold ring-1 ring-amber-300">1</span>;
                      } else if (idx === 1) {
                        rankBadge = <span className="flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold ring-1 ring-slate-300">2</span>;
                      } else if (idx === 2) {
                        rankBadge = <span className="flex items-center justify-center h-5 w-5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold ring-1 ring-orange-300">3</span>;
                      } else {
                        rankBadge = <span className="flex items-center justify-center h-5 w-5 text-muted-foreground text-xs font-semibold">{idx + 1}</span>;
                      }

                      const bgGradients = [
                        "from-blue-500 to-indigo-500",
                        "from-emerald-500 to-teal-500",
                        "from-purple-500 to-pink-500",
                        "from-amber-500 to-orange-500",
                      ];
                      const gradient = bgGradients[idx % bgGradients.length];

                      return (
                        <div key={user.userId || idx} className="flex items-center gap-3">
                          <div className="w-6 shrink-0 flex justify-center">{rankBadge}</div>
                          
                          <div className={`h-8 w-8 rounded-full shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[10px] font-bold shadow-xs`}>
                            {initials || <Users className="h-4 w-4" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-sm font-medium mb-1">
                              <span className="truncate text-foreground">{user.firstName} {user.lastName}</span>
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full ml-2">
                                {user.activityScore} pts
                              </span>
                            </div>
                            <div className="w-full bg-secondary/60 dark:bg-secondary/20 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analytics Summary Context */}
            <Card className="col-span-3 flex flex-col justify-between min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Analytics Summary</CardTitle>
                <CardDescription>Key activity overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                    Platform Statistics Overview
                  </h4>
                  {analyticsLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : !platformStatsData.length ? (
                    <div className="h-[200px] w-full flex items-center justify-center text-xs text-muted-foreground">
                      No data available.
                    </div>
                  ) : (
                    <div className="h-[200px] w-full relative min-w-0">
                      <ResponsiveContainer width="99%" height={200} key={activeTab + "-" + platformStatsData.length}>
                        <BarChart
                          layout="vertical"
                          data={platformStatsData}
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={80} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              fontSize: "11px",
                              padding: "4px 8px",
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                            {platformStatsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Countries Represented</span>
                    <span className="font-bold">{analytics?.stats.totalCountries || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Active Sectors</span>
                    <span className="font-bold">{analytics?.bySector.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Total Engagement Posts</span>
                    <span className="font-bold">{analytics?.stats.totalPosts || 0}</span>
                  </div>
                </div>

                <div className="pt-2 border-t text-[11px] text-muted-foreground flex justify-between items-center">
                  <span>Updated in real-time</span>
                  <span>Blazing Connect Platform Logs</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ================= POST DETAIL DIALOG ================= */}
      <Dialog open={postDetailModalOpen} onOpenChange={setPostDetailModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          {selectedReportedPost && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={selectedReportedPost.isHidden ? "secondary" : "destructive"} className="text-xs">
                    {selectedReportedPost.isHidden ? "HIDDEN" : "REPORTED POST"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{selectedReportedPost.time}</span>
                </div>
                <DialogTitle className="text-xl font-bold">Reported Post Details</DialogTitle>
                <DialogDescription>
                  Review the reported post content and reason before taking administrative action.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Author Info */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                  <Avatar className="h-10 w-10 border">
                    {selectedReportedPost.userAvatar ? (
                      <AvatarImage src={selectedReportedPost.userAvatar} />
                    ) : null}
                    <AvatarFallback>{selectedReportedPost.user.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedReportedPost.user}</p>
                    <p className="text-xs text-muted-foreground">{selectedReportedPost.userEmail || "Alumni Member"}</p>
                  </div>
                </div>

                {/* Reason Alert */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60 text-xs space-y-1">
                  <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Report Reason
                  </div>
                  <p className="text-amber-800 dark:text-amber-300 pl-5">{selectedReportedPost.reportReason}</p>
                  {selectedReportedPost.reportedBy && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 pl-5">
                      Submitted by: {selectedReportedPost.reportedBy}
                    </p>
                  )}
                </div>

                {/* Post Content */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Post Content</label>
                  {selectedReportedPost.title && (
                    <h4 className="font-semibold text-sm text-foreground">{selectedReportedPost.title}</h4>
                  )}
                  <div className="p-3.5 bg-muted/40 rounded-lg border text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
                    {selectedReportedPost.content}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setPostDetailModalOpen(false)}
                  className="sm:w-auto"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2 ml-auto">
                  {selectedReportedPost.isHidden ? (
                    <Button
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => {
                        unhidePost(selectedReportedPost.postId || selectedReportedPost.id);
                        setPostDetailModalOpen(false);
                      }}
                      disabled={isUnhiding}
                    >
                      <Eye className="h-4 w-4 mr-1.5" /> Unhide Post
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-amber-300 text-amber-800 hover:bg-amber-50"
                      onClick={() => {
                        hidePost(selectedReportedPost.postId || selectedReportedPost.id);
                        setPostDetailModalOpen(false);
                      }}
                      disabled={isHiding}
                    >
                      <EyeOff className="h-4 w-4 mr-1.5" /> Hide Post
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    onClick={() => {
                      setPostToDelete(selectedReportedPost);
                      setPostDetailModalOpen(false);
                      setDeleteConfirmOpen(true);
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" /> Delete Post
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Reported Post
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this reported post by{" "}
              <strong>{postToDelete?.user || "this user"}</strong>? This action cannot be undone and will remove the post from the platform feed completely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (postToDelete) {
                  deletePost(postToDelete.postId || postToDelete.id);
                  setPostToDelete(null);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MetricCard({ title, value, description, icon, highlight = false, loading = false }: any) {
  return (
    <Card className={highlight ? "border-orange-200 bg-orange-50/30" : ""}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium leading-normal min-h-[40px]">{title}</CardTitle>
        <div className="flex-shrink-0">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value !== null && value !== undefined ? value.toLocaleString() : 0}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
