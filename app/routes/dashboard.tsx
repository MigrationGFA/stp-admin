import React, { useEffect, useMemo, useState } from "react";
import { 
  Users, 
  Briefcase, 
  ShieldAlert, 
  MousePointer2, 
  TrendingUp, 
  ArrowUpRight,
  CalendarDays,
  MessageSquare, 
  Zap, 
  FileDown, 
  PlusCircle,
  Globe,
  Building2,
  Calendar,
  RefreshCw,
  X,
  Award,
  Activity,
  GraduationCap
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
import { useDashboard } from "@/hooks/useDashboard";
import { useUsersSummary } from "@/hooks/useUsers";
import { useAnalytics, useAnalyticsFilters } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnalyticsFilters } from "@/services/apiAnalytics";

// Mock Data for Connections Chart in Overview
const engagementData = [
  { name: "Mon", clicks: 40 },
  { name: "Tue", clicks: 30 },
  { name: "Wed", clicks: 65 },
  { name: "Thu", clicks: 45 },
  { name: "Fri", clicks: 90 },
  { name: "Sat", clicks: 25 },
  { name: "Sun", clicks: 15 },
];

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

  // Analytics Tab State & Queries
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
      { label: "Last 7 days", value: "7" },
      { label: "Last 30 days", value: "30" },
      { label: "Last 90 days", value: "90" },
      { label: "Last 6 months", value: "180" },
      { label: "Last year", value: "365" },
      { label: "All time", value: "all" }
    ];
  }, [filtersData]);

  useEffect(() => {
    if (dashboardError) {
      console.error("Dashboard error:", dashboardError);
    }
    if (usersError) {
      console.error("Users error:", usersError);
    }
    if (analyticsError) {
      console.error("Analytics error:", analyticsError);
    }
  }, [dashboardError, usersError, analyticsError]);

  // Overview Tab Calculations
  const verifiedCount = usersSummary?.verifiedUsers ?? summary?.verifiedUsers ?? 0;
  const pendingCount = usersSummary?.pendingUsers ?? summary?.pendingUsers ?? 0;

  const userDistribution = [
    { name: "Verified Alumni", value: verifiedCount, color: "#0f172a" },
    { name: "Pending", value: pendingCount, color: "#f97316" },
  ];

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
    await refetchAnalytics();
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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="overview">General Overview</TabsTrigger>
            <TabsTrigger value="analytics">Platform Analytics</TabsTrigger>
          </TabsList>
        </div>

        {/* ================= GENERAL OVERVIEW TAB ================= */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Top Level Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard 
              title="Total Alumni" 
              value={summary?.totalUsers} 
              description="Total registered alumni" 
              icon={<Users className="h-4 w-4 text-muted-foreground" />} 
              loading={loading}
            />
            <MetricCard 
              title="Active Alumni" 
              value={summary?.activeUsers} 
              description="Currently active alumni" 
              icon={<Zap className="h-4 w-4 text-muted-foreground" />} 
              loading={loading}
            />
            <MetricCard
              title="Active Groups"
              value={summary?.totalGroups}
              description={`${summary?.pendingGroups || 0} pending approval`}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
              highlight={summary?.pendingGroups ? summary.pendingGroups > 0 : false}
            />
            <MetricCard 
              title="Active Events" 
              value={summary?.totalEvents} 
              description={`${summary?.pendingEvents || 0} pending approval`} 
              icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />} 
              loading={loading}
              highlight={summary?.pendingEvents ? summary.pendingEvents > 0 : false}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Engagement Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Alumni Connections</CardTitle>
                <CardDescription>Total "Connect" and "Chat" clicks initiated</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="clicks" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Alumni Distribution */}
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
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Recent Activity & System Health */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Live updates from the Blazing Connect network</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { icon: <PlusCircle className="text-blue-500" />, text: "New Opportunity Posted", sub: "Tech Startup Seed Funding", time: "12m ago" },
                    { icon: <Zap className="text-yellow-500" />, text: "New Alumni joined", sub: "Dr. Sarah Jenkins (Class of '18)", time: "45m ago" },
                    { icon: <MessageSquare className="text-green-500" />, text: "Connection Request", sub: "Interest in 'UI Design Service'", time: "2h ago" },
                    { icon: <FileDown className="text-muted-foreground" />, text: "Resource Downloaded", sub: "Investment_Template.pdf", time: "3h ago" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 p-1 bg-muted rounded-full">{item.icon}</div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{item.text}</p>
                        <p className="text-xs text-muted-foreground">{item.sub}</p>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        {item.time}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4 text-xs text-muted-foreground hover:text-primary">
                  View All Activity
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Infrastructure & Database status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 border p-3 rounded-lg bg-muted/30">
                  <div className="relative">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-ping" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Server Status: Operational</p>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full w-[98%]" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full text-xs h-9" asChild>
                    <a href="/admin/system">
                      Manage Resources <ArrowUpRight className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                  <Button variant="secondary" className="w-full text-xs h-9">
                    Download Platform Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= PLATFORM ANALYTICS TAB ================= */}
        <TabsContent value="analytics" className="space-y-6 mt-0">
          {/* Filters Toolbar */}
          <Card className="p-4 bg-card/60 backdrop-blur-md shadow-xs border border-border/80">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Cohort Selector */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" /> Cohort
                  </span>
                  <Select
                    value={filters.cohort || "all"}
                    onValueChange={(val) => handleFilterChange("cohort", val)}
                  >
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="All Cohorts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cohorts</SelectItem>
                      {cohortList.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Country Selector */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" /> Country
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
                    <Building2 className="h-3.5 w-3.5" /> Sector
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
                    <Calendar className="h-3.5 w-3.5" /> Timeframe
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
                {(filters.country !== "all" || filters.sector !== "all" || filters.timeframe !== "all" || filters.cohort !== "all") && (
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
                  disabled={analyticsLoading || isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing || analyticsLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </Card>

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
                    {activeTab === "analytics" && (
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
                    )}
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
                      {activeTab === "analytics" && (
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
                      )}
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
                      {activeTab === "analytics" && (
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
                      )}
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
          <div className="text-2xl font-bold">{value !== null && value !== undefined ? value : 0}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
