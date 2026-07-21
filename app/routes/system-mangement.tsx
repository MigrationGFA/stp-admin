import React, { useState } from "react";
import { 
  Download, ShieldCheck, FileText, Trash2, 
  Lock, History, Info, Plus, Moon, Sun, 
  KeyRound, Mail, Check,
  ShieldUser, ShieldAlert, Copy, RefreshCw, AlertTriangle,
  ChevronsUpDown, Eye, EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBackofficeAdmins, deleteAdmin } from "@/services/apiAdmins";
import { register } from "@/services/apiAuth";
import { fetchUsers, fetchUsersByParams } from "@/services/apiUsers";
import {
  sendEmailNotification,
  type SendEmailNotificationPayload,
} from "@/services/apiNotifications";
import { fetchSecurityLogs } from "@/services/apiSecurity";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

export default function SystemManagementPage() {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);
  const [notificationForm, setNotificationForm] = useState({
    recipientId: "",
    type: "SUPPORT_RESPONSE" as SendEmailNotificationPayload["type"],
    message: "",
    link: "",
    eventName: "",
    postTitle: "",
    senderName: "",
    actorName: "",
    action: "",
  });
  const [adminForm, setAdminForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [securityTypeFilter, setSecurityTypeFilter] = useState<string>("ALL");
  const [securityPage, setSecurityPage] = useState(1);
  const [securityLimit, setSecurityLimit] = useState(20);

  const {
    data: securityData,
    isLoading: securityLoading,
    isRefetching: securityRefetching,
    refetch: refetchSecurityLogs,
  } = useQuery({
    queryKey: ["security-logs", securityTypeFilter, securityPage, securityLimit],
    queryFn: () => fetchSecurityLogs(securityTypeFilter, securityPage, securityLimit),
  });

  const logs = securityData?.data ?? [];
  const bruteForceAttempts = securityData?.bruteForce ?? [];

  const handleTypeFilterChange = (value: string) => {
    setSecurityTypeFilter(value);
    setSecurityPage(1);
  };

  const handleLimitChange = (value: string) => {
    setSecurityLimit(Number(value));
    setSecurityPage(1);
  };

  const renderEventBadge = (type: string) => {
    switch (type) {
      case "LOGIN_SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3 w-3 shrink-0" />
            Success
          </span>
        );
      case "LOGIN_FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <ShieldAlert className="h-3 w-3 shrink-0" />
            Failed
          </span>
        );
      case "PASSWORD_RESET_REQUEST":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <KeyRound className="h-3 w-3 shrink-0" />
            Reset Req
          </span>
        );
      case "ACCOUNT_LOCKED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Lock className="h-3 w-3 shrink-0" />
            Locked
          </span>
        );
      case "ACCOUNT_DELETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Trash2 className="h-3 w-3 shrink-0" />
            Deleted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {type}
          </span>
        );
    }
  };

  const {
    data: admins = [],
    isLoading: adminsLoading,
    error: adminsError,
  } = useQuery({
    queryKey: ["backoffice-admins"],
    queryFn: fetchBackofficeAdmins,
  });

  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ userId: string; label: string } | null>(null);
  const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);

  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ["notification-users", userSearchQuery],
    queryFn: () => fetchUsersByParams({ page: 1, perPage: 50, search: userSearchQuery }),
  });

  const users = usersResponse?.data ?? [];

  const queryClient = useQueryClient();

  const createAdminMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success("Admin account created successfully");
      setAdminForm({ firstName: "", lastName: "", email: "", password: "" });
      setIsAdminModalOpen(false);
      setShowPassword(false);
      queryClient.invalidateQueries({ queryKey: ["backoffice-admins"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create admin account");
    },
  });

  const notificationMutation = useMutation({
    mutationFn: sendEmailNotification,
    onSuccess: () => {
      toast.success("Notification email sent successfully");
      setNotificationForm({
        recipientId: "",
        type: "SUPPORT_RESPONSE",
        message: "",
        link: "",
        eventName: "",
        postTitle: "",
        senderName: "",
        actorName: "",
        action: "",
      });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to send notification email");
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => {
      toast.success("Administrator account deleted successfully");
      setDeleteConfirmOpen(false);
      setAdminToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["backoffice-admins"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete administrator account");
    },
  });

  const exportData = (type: string) => {
    toast.info(`Generating ${type} export...`);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !adminForm.firstName.trim() ||
      !adminForm.lastName.trim() ||
      !adminForm.email.trim() ||
      !adminForm.password
    ) {
      toast.error("Please fill all admin fields.");
      return;
    }

    createAdminMutation.mutate({
      firstName: adminForm.firstName.trim(),
      lastName: adminForm.lastName.trim(),
      email: adminForm.email.trim(),
      emailAddress: adminForm.email.trim(),
      password: adminForm.password,
      is_onboarded: true,
      password_change_required: true,
    });
  };

  const handleSendNotification = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!notificationForm.recipientId.trim()) {
      toast.error("Please select a recipient.");
      return;
    }

    const contextData: Record<string, any> = {};

    if (notificationForm.link.trim()) {
      contextData.link = notificationForm.link.trim();
    }

    switch (notificationForm.type) {
      case "SUPPORT_RESPONSE":
      case "ONBOARDING_WELCOME":
      case "EVENT_APPROVAL_PENDING":
        if (!notificationForm.message.trim()) {
          toast.error("Please enter a message.");
          return;
        }
        contextData.message = notificationForm.message.trim();
        break;

      case "EVENT_UPDATE":
        if (!notificationForm.eventName.trim()) {
          toast.error("Please enter an event name.");
          return;
        }
        if (!notificationForm.message.trim()) {
          toast.error("Please enter an update message.");
          return;
        }
        contextData.eventName = notificationForm.eventName.trim();
        contextData.updateMessage = notificationForm.message.trim();
        break;

      case "NEW_NEWSFEED":
        if (!notificationForm.postTitle.trim()) {
          toast.error("Please enter a post title.");
          return;
        }
        contextData.postTitle = notificationForm.postTitle.trim();
        break;

      case "NEW_MESSAGE":
      case "CONNECTION_REQUEST":
      case "CONNECTION_ACCEPTED":
        if (!notificationForm.senderName.trim()) {
          toast.error("Please enter a sender name.");
          return;
        }
        contextData.senderName = notificationForm.senderName.trim();
        break;

      case "POST_ENGAGEMENT":
        if (!notificationForm.actorName.trim()) {
          toast.error("Please enter an actor name.");
          return;
        }
        if (!notificationForm.action.trim()) {
          toast.error("Please enter an action.");
          return;
        }
        contextData.actorName = notificationForm.actorName.trim();
        contextData.action = notificationForm.action.trim();
        break;

      default:
        contextData.message = notificationForm.message.trim();
        break;
    }

    notificationMutation.mutate({
      recipient_id: notificationForm.recipientId.trim(),
      type: notificationForm.type,
      context_data: contextData,
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">System & Management</h2>
        <p className="text-muted-foreground">Manage the Blazing Connect governance, security, and data.</p>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="reports">Data Exports</TabsTrigger>
          <TabsTrigger value="governance">Platform Rules</TabsTrigger>
          <TabsTrigger value="admins">Admin Access</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security Logs</TabsTrigger>
          <TabsTrigger value="settings">My Settings</TabsTrigger>
        </TabsList>

        {/* --- DATA EXPORTS --- */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ExportCard 
              title="Full Alumni Registry" 
              desc="Names, emails, graduation years, and verification status."
              onExport={() => exportData("Registry")}
            />
            <ExportCard 
              title="Networking Activity" 
              desc="Log of 'Connect' clicks and service inquiries."
              onExport={() => exportData("Networking")}
            />
            <ExportCard 
              title="Dealroom Logs" 
              desc="Record of Dealroom requests and document access."
              onExport={() => exportData("Dealrooms")}
            />
          </div>
        </TabsContent>

        {/* --- GOVERNANCE --- */}
        <TabsContent value="governance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content & Privacy Rules</CardTitle>
              <CardDescription>Control how alumni interact with the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RuleToggle 
                label="Strict Verification" 
                desc="Users cannot see directory details until verified by an admin." 
                defaultChecked 
              />
              <RuleToggle 
                label="Opportunity Moderation" 
                desc="Require admin approval before a new 'Opportunity' goes live." 
                defaultChecked 
              />
              <RuleToggle 
                label="Allow Guest View" 
                desc="Enable a limited landing page for unauthenticated visitors." 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ADMIN ACCESS (With Working Modal) --- */}
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>System Administrators</CardTitle>
                <CardDescription>Manage team members with dashboard access.</CardDescription>
              </div>
              
              <Dialog open={isAdminModalOpen} onOpenChange={(open) => {
                setIsAdminModalOpen(open);
                if (!open) {
                  setShowPassword(false);
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Admin</Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddAdmin}>
                    <DialogHeader>
                      <DialogTitle>Invite New Administrator</DialogTitle>
                      <DialogDescription>
                        Send an invitation to a team member to manage the Blazing Connect platform.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="Jane"
                          value={adminForm.firstName}
                          onChange={(event) =>
                            setAdminForm((prev) => ({
                              ...prev,
                              firstName: event.target.value,
                            }))
                          }
                          disabled={createAdminMutation.isPending}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={adminForm.lastName}
                          onChange={(event) =>
                            setAdminForm((prev) => ({
                              ...prev,
                              lastName: event.target.value,
                            }))
                          }
                          disabled={createAdminMutation.isPending}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail">Work Email</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="app@blazingtorrent.org"
                          value={adminForm.email}
                          onChange={(event) =>
                            setAdminForm((prev) => ({
                              ...prev,
                              email: event.target.value,
                            }))
                          }
                          disabled={createAdminMutation.isPending}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPassword">Temporary Password</Label>
                        <div className="relative">
                          <Input
                            id="adminPassword"
                            type={showPassword ? "text" : "password"}
                            className="pr-10"
                            value={adminForm.password}
                            onChange={(event) =>
                              setAdminForm((prev) => ({
                                ...prev,
                                password: event.target.value,
                              }))
                            }
                            disabled={createAdminMutation.isPending}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none disabled:opacity-50"
                            disabled={createAdminMutation.isPending}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsAdminModalOpen(false)}
                        disabled={createAdminMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createAdminMutation.isPending}>
                        {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminsLoading ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Loading administrators...
                  </div>
                ) : adminsError ? (
                  <div className="p-6 text-center text-sm text-destructive">
                    Failed to load administrators.
                  </div>
                ) : admins.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No administrators found.
                  </div>
                ) : (
                  admins.map((admin) => (
                  <div key={admin.userId || admin.email} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShieldUser className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {`${admin.firstName} ${admin.lastName}`.trim() || admin.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{admin.role}</Badge>
                      <Dialog open={deleteConfirmOpen && adminToDelete === admin.userId} onOpenChange={(open) => {
                        if (!open) {
                          setDeleteConfirmOpen(false);
                          setAdminToDelete(null);
                        }
                      }}>
                        <button
                          onClick={() => {
                            setAdminToDelete(admin.userId || admin.email);
                            setDeleteConfirmOpen(true);
                          }}
                          className="inline-flex items-center justify-center rounded-md h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Administrator</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this administrator account? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setDeleteConfirmOpen(false);
                                setAdminToDelete(null);
                              }}
                              disabled={deleteAdminMutation.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                if (adminToDelete) {
                                  deleteAdminMutation.mutate(adminToDelete);
                                }
                              }}
                              disabled={deleteAdminMutation.isPending}
                            >
                              {deleteAdminMutation.isPending ? "Deleting..." : "Delete"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> Manual Email Dispatch
              </CardTitle>
              <CardDescription>
                Send support responses or operational notifications to a specific user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSendNotification}>
                <div className="space-y-2 flex flex-col">
                  <Label className="text-sm font-medium">Recipient</Label>
                  <Popover open={isUserPopoverOpen} onOpenChange={setIsUserPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isUserPopoverOpen}
                        className="w-full justify-between bg-background border-muted/80 text-left font-normal text-sm"
                        disabled={notificationMutation.isPending}
                      >
                        {selectedUser ? (
                          <span className="truncate">{selectedUser.label}</span>
                        ) : (
                          <span className="text-muted-foreground">Select user...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search recipient (first name, last name, or email)..."
                          value={userSearchQuery}
                          onValueChange={setUserSearchQuery}
                          className="h-9"
                        />
                        <CommandList>
                          {usersLoading ? (
                            <div className="p-4 text-sm text-center text-muted-foreground animate-pulse">
                              Loading users...
                            </div>
                          ) : users.length === 0 ? (
                            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                              No users found.
                            </CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {users.map((user) => {
                                const userLabel = `${user.firstName} ${user.lastName}`.trim() || user.email;
                                const userSubLabel = user.email ? ` (${user.email})` : "";
                                const fullLabel = `${userLabel}${userSubLabel}`;
                                return (
                                  <CommandItem
                                    key={user.userId}
                                    value={user.userId}
                                    onSelect={() => {
                                      setSelectedUser({
                                        userId: user.userId,
                                        label: fullLabel,
                                      });
                                      setNotificationForm((prev) => ({
                                        ...prev,
                                        recipientId: user.userId,
                                      }));
                                      setIsUserPopoverOpen(false);
                                    }}
                                    className="flex items-center justify-between cursor-pointer"
                                  >
                                    <span className="truncate">{fullLabel}</span>
                                    {selectedUser?.userId === user.userId && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <Select
                    value={notificationForm.type}
                    onValueChange={(value: SendEmailNotificationPayload["type"]) =>
                      setNotificationForm((prev) => ({ ...prev, type: value }))
                    }
                    disabled={notificationMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPPORT_RESPONSE">Support Response</SelectItem>
                      <SelectItem value="ONBOARDING_WELCOME">Onboarding Welcome</SelectItem>
                      <SelectItem value="EVENT_UPDATE">Event Update</SelectItem>
                      <SelectItem value="NEW_NEWSFEED">New Newsfeed</SelectItem>
                      <SelectItem value="EVENT_APPROVAL_PENDING">Event Approval Pending</SelectItem>
                      <SelectItem value="NEW_MESSAGE">New Message</SelectItem>
                      <SelectItem value="POST_ENGAGEMENT">Post Engagement</SelectItem>
                      <SelectItem value="CONNECTION_REQUEST">Connection Request</SelectItem>
                      <SelectItem value="CONNECTION_ACCEPTED">Connection Accepted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(notificationForm.type === "SUPPORT_RESPONSE" ||
                  notificationForm.type === "ONBOARDING_WELCOME" ||
                  notificationForm.type === "EVENT_APPROVAL_PENDING" ||
                  notificationForm.type === "EVENT_UPDATE") && (
                  <div className="space-y-2">
                    <Label htmlFor="notificationMessage">
                      {notificationForm.type === "EVENT_UPDATE" ? "Update Message" : "Message"}
                    </Label>
                    <Textarea
                      id="notificationMessage"
                      value={notificationForm.message}
                      onChange={(event) =>
                        setNotificationForm((prev) => ({
                          ...prev,
                          message: event.target.value,
                        }))
                      }
                      placeholder={
                        notificationForm.type === "EVENT_UPDATE"
                          ? "The event venue has changed to Room 302."
                          : "Your issue has been resolved."
                      }
                      disabled={notificationMutation.isPending}
                    />
                  </div>
                )}

                {notificationForm.type === "EVENT_UPDATE" && (
                  <div className="space-y-2">
                    <Label htmlFor="notificationEventName">Event Name</Label>
                    <Input
                      id="notificationEventName"
                      value={notificationForm.eventName}
                      onChange={(event) =>
                        setNotificationForm((prev) => ({
                          ...prev,
                          eventName: event.target.value,
                        }))
                      }
                      placeholder="Alumni Homecoming 2026"
                      disabled={notificationMutation.isPending}
                    />
                  </div>
                )}

                {notificationForm.type === "NEW_NEWSFEED" && (
                  <div className="space-y-2">
                    <Label htmlFor="notificationPostTitle">Post Title</Label>
                    <Input
                      id="notificationPostTitle"
                      value={notificationForm.postTitle}
                      onChange={(event) =>
                        setNotificationForm((prev) => ({
                          ...prev,
                          postTitle: event.target.value,
                        }))
                      }
                      placeholder="New Research Grant Announced"
                      disabled={notificationMutation.isPending}
                    />
                  </div>
                )}

                {(notificationForm.type === "NEW_MESSAGE" ||
                  notificationForm.type === "CONNECTION_REQUEST" ||
                  notificationForm.type === "CONNECTION_ACCEPTED") && (
                  <div className="space-y-2">
                    <Label htmlFor="notificationSenderName">Sender Name</Label>
                    <Input
                      id="notificationSenderName"
                      value={notificationForm.senderName}
                      onChange={(event) =>
                        setNotificationForm((prev) => ({
                          ...prev,
                          senderName: event.target.value,
                        }))
                      }
                      placeholder="Jane Doe"
                      disabled={notificationMutation.isPending}
                    />
                  </div>
                )}

                {notificationForm.type === "POST_ENGAGEMENT" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="notificationActorName">Actor Name</Label>
                      <Input
                        id="notificationActorName"
                        value={notificationForm.actorName}
                        onChange={(event) =>
                          setNotificationForm((prev) => ({
                            ...prev,
                            actorName: event.target.value,
                          }))
                        }
                        placeholder="John Smith"
                        disabled={notificationMutation.isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notificationAction">Action</Label>
                      <Input
                        id="notificationAction"
                        value={notificationForm.action}
                        onChange={(event) =>
                          setNotificationForm((prev) => ({
                            ...prev,
                            action: event.target.value,
                          }))
                        }
                        placeholder="liked your post"
                        disabled={notificationMutation.isPending}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notificationLink">Link</Label>
                  <Input
                    id="notificationLink"
                    value={notificationForm.link}
                    onChange={(event) =>
                      setNotificationForm((prev) => ({
                        ...prev,
                        link: event.target.value,
                      }))
                    }
                    placeholder="https://blazingconnect-gfa.vercel.app/support"
                    disabled={notificationMutation.isPending}
                  />
                </div>

                <Button type="submit" disabled={notificationMutation.isPending}>
                  {notificationMutation.isPending ? "Sending..." : "Send Email"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- SETTINGS: Security & Appearance --- */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" /> Security
                </CardTitle>
                <CardDescription>Update your administrator password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" />
                </div>
                <Button className="w-full">Update Password</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5" /> Appearance
                </CardTitle>
                <CardDescription>Personalize your dashboard experience.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-xs text-muted-foreground">Switch between light and dark themes.</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    {['bg-slate-950', 'bg-blue-600', 'bg-emerald-600', 'bg-indigo-600'].map((color) => (
                      <button key={color} className={`h-6 w-6 rounded-full ${color} border-2 border-transparent hover:border-white`} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- SECURITY LOGS --- */}
        <TabsContent value="security" className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-[200px]">
                <Select value={securityTypeFilter} onValueChange={handleTypeFilterChange}>
                  <SelectTrigger className="w-full bg-background border-muted/80">
                    <SelectValue placeholder="Filter by event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Event Types</SelectItem>
                    <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
                    <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                    <SelectItem value="PASSWORD_RESET_REQUEST">Password Reset</SelectItem>
                    <SelectItem value="ACCOUNT_LOCKED">Account Locked</SelectItem>
                    <SelectItem value="ACCOUNT_DELETED">Account Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[140px]">
                <Select value={String(securityLimit)} onValueChange={handleLimitChange}>
                  <SelectTrigger className="w-full bg-background border-muted/80">
                    <SelectValue placeholder="Limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchSecurityLogs()}
                disabled={securityLoading || securityRefetching}
                title="Refresh Logs"
                className="bg-background border-muted/80 hover:bg-muted"
              >
                <RefreshCw className={`h-4 w-4 ${securityLoading || securityRefetching ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded border border-muted/50">
              Showing page {securityPage} (max {securityLimit} entries per page)
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main column: Logs table */}
            <Card className="lg:col-span-2 border-muted/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2 font-bold tracking-tight">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Access & Security Audit Trail
                </CardTitle>
                <CardDescription>
                  Real-time monitoring of authentication events, access changes, and key security triggers.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                {securityLoading ? (
                  <div className="space-y-3 p-6">
                    <div className="h-8 w-full bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-muted/10">
                    <History className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <h3 className="font-semibold text-base text-foreground">No logs found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                      There are no security logs matching the current criteria. Ensure that user access activity exists.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden bg-background">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="font-semibold w-[200px]">Event Type</TableHead>
                          <TableHead className="font-semibold">User Email</TableHead>
                          <TableHead className="font-semibold w-[150px]">IP Address</TableHead>
                          <TableHead className="font-semibold w-[180px] text-right">Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log, index) => (
                          <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="align-middle">
                              {renderEventBadge(log.eventType)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-foreground/80 break-all select-all align-middle">
                              {log.email}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground select-all align-middle">
                              {log.ipAddress}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground font-medium align-middle">
                              {new Date(log.createdAt).toLocaleString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination Controls */}
                {!securityLoading && logs.length > 0 && (
                  <div className="flex items-center justify-between gap-4 mt-4 pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Page {securityPage}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={securityPage <= 1}
                        onClick={() => setSecurityPage((p) => Math.max(1, p - 1))}
                        className="bg-background border-muted/80"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logs.length < securityLimit}
                        onClick={() => setSecurityPage((p) => p + 1)}
                        className="bg-background border-muted/80"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sidebar Column: Potential Brute Force */}
            <Card className="border-muted/60 shadow-sm h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-rose-500 font-bold tracking-tight">
                  <ShieldAlert className="h-5 w-5" />
                  Brute Force Activity
                </CardTitle>
                <CardDescription>
                  Monitors IP addresses with high login failure attempts. Take actions on repeated alerts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {securityLoading ? (
                  <div className="space-y-2">
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  </div>
                ) : bruteForceAttempts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg bg-muted/10">
                    <ShieldCheck className="h-8 w-8 text-emerald-500 mb-2" />
                    <h4 className="font-semibold text-sm text-foreground">No active threats</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                      No anomalous connection sequences detected from any single IP addresses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-red-500/5 border border-red-500/10 rounded-md p-3 mb-2">
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {bruteForceAttempts.length} anomalous client IP(s) detected
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                        IPs listed below have accumulated consecutive failed auth attempts and could be attempting brute-force access.
                      </p>
                    </div>

                    <div className="divide-y border rounded-md bg-background">
                      {bruteForceAttempts.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/10 transition-colors">
                          <div className="space-y-0.5">
                            <p className="text-xs font-mono font-bold text-foreground/90 select-all">
                              {item.ipAddress}
                            </p>
                            <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                              {item.attempts} failed login attempts
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(item.ipAddress);
                              toast.success("IP copied to clipboard");
                            }}
                            title="Copy IP Address"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components for cleaner code
function RuleToggle({ label, desc, defaultChecked = false }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="space-y-0.5">
        <Label className="text-sm font-semibold">{label}</Label>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function ExportCard({ title, desc, onExport }: any) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2">{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onExport} variant="outline" size="sm" className="w-full">
          <Download className="h-3.5 w-3.5 mr-2" /> Download CSV
        </Button>
      </CardContent>
    </Card>
  );
}

function Badge({ children, variant, className }: any) {
  const styles = variant === "secondary" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground";
  return (
    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${styles} ${className}`}>
      {children}
    </span>
  );
}
