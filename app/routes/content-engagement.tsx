import React, { useRef, useState } from "react";
import {
  MessageSquare,
  Newspaper,
  Calendar as CalendarIcon,
  FileBox,
  Plus,
  Check,
  X,
  MoreVertical,
  Download,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  ImageIcon,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  createEvent,
  approveEvent,
  declineEvent,
  fetchEventById,
  updateEventVisibility,
  type BackofficeEvent,
} from "@/services/apiEvents";
import { TimePicker } from "@/components/ui/time-picker";
import { useEvents } from "@/hooks/useEvents";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  getPendingPosts,
  approvePost,
  rejectPost,
  getResources,
  uploadResource,
  downloadResource,
  archiveResource,
  deleteResource,
  fetchUserUploadedResources,
  getPendingResources,
  reviewResource,
  type FeedPost,
  type Resource,
} from "@/services/apiContent";
import {
  createNewsfeed as createNews,
  updateNewsfeed as updateNews,
  deleteNewsfeed as deleteNews,
  getNewsfeed as getNews,
  type NewsfeedPost as NewsItem,
  type CreateNewsfeedPayload as CreateNewsPayload,
  type UpdateNewsfeedPayload as UpdateNewsPayload,
} from "@/services/apiNewsfeed";

export default function ContentEngagementPage() {
  const { events, isLoading: eventsLoading } = useEvents();
  const queryClient = useQueryClient();

  // Fetch pending posts
  const { data: pendingPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['pending-posts'],
    queryFn: () => getPendingPosts(),
  });

  // Fetch news
  const { data: newsItems = [], isLoading: newsItemsLoading } = useQuery({
    queryKey: ['news'],
    queryFn: getNews,
  });

  // Fetch resources
  const { data: resources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => getResources(),
  });

  // Fetch user-uploaded resources
  const { data: userUploadedResources = [], isLoading: userUploadedLoading } = useQuery({
    queryKey: ['user-uploaded-resources'],
    queryFn: () => fetchUserUploadedResources(),
  });

  // Fetch pending resources
  const { data: pendingResources = [], isLoading: pendingResourcesLoading } = useQuery({
    queryKey: ['pending-resources'],
    queryFn: () => getPendingResources(),
  });

  // Mutations for posts
  const approvePostMutation = useMutation({
    mutationFn: approvePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-posts'] });
      toast.success('Post approved successfully');
    },
  });

  const rejectPostMutation = useMutation({
    mutationFn: rejectPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-posts'] });
      toast.success('Post rejected');
    },
  });

  // Mutations for events
  const approveEventMutation = useMutation({
    mutationFn: approveEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event approved successfully');
    },
  });

  const declineEventMutation = useMutation({
    mutationFn: (eventId: string) => declineEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event declined');
    },
  });

  const updateEventVisibilityMutation = useMutation({
    mutationFn: ({ eventId, visibility }: { eventId: string; visibility: "PUBLIC" | "CONNECTIONS_ONLY" }) =>
      updateEventVisibility(eventId, visibility),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (selectedEvent && selectedEvent.eventId === variables.eventId) {
        setSelectedEvent((prev) => prev ? { ...prev, visibility: variables.visibility } : null);
      }
      toast.success(response.message || 'Event visibility updated');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update event visibility');
    },
  });

  // Mutations for resources
  const archiveResourceMutation = useMutation({
    mutationFn: archiveResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['user-uploaded-resources'] });
      queryClient.invalidateQueries({ queryKey: ['pending-resources'] });
      toast.success('Resource archived');
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['user-uploaded-resources'] });
      queryClient.invalidateQueries({ queryKey: ['pending-resources'] });
      toast.success('Resource deleted');
    },
  });

  const uploadResourceMutation = useMutation({
    mutationFn: uploadResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['user-uploaded-resources'] });
      queryClient.invalidateQueries({ queryKey: ['pending-resources'] });
      toast.success('Resource uploaded successfully');
      setResourceDialogOpen(false);
      setResourceForm({
        title: "",
        category: "",
        description: "",
        visibility: "All",
      });
      if (resourceFileRef.current) resourceFileRef.current.value = "";
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to upload resource");
    },
  });

  const downloadResourceMutation = useMutation({
    mutationFn: ({ resourceId, fallbackUrl }: { resourceId: string; fallbackUrl?: string }) =>
      downloadResource(resourceId).then((url) => url || fallbackUrl || ""),
    onSuccess: (url) => {
      if (!url) {
        toast.error("No file URL returned for this resource");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['user-uploaded-resources'] });
      queryClient.invalidateQueries({ queryKey: ['pending-resources'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to download resource");
    },
  });

  const reviewResourceMutation = useMutation({
    mutationFn: ({ resourceId, action }: { resourceId: string; action: "approve" | "reject" }) =>
      reviewResource(resourceId, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['user-uploaded-resources'] });
      queryClient.invalidateQueries({ queryKey: ['pending-resources'] });
      toast.success(`Resource ${variables.action}d successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to moderate resource");
    },
  });

  // Mutations for news
  const updateNewsMutation = useMutation({
    mutationFn: ({ postId, payload }: { postId: string; payload: UpdateNewsPayload }) =>
      updateNews(postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast.success('News updated successfully!');
      setEditNewsDialogOpen(false);
      setEditingNewsId(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update news");
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: deleteNews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast.success('News deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete news");
    },
  });
  
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [resourceSubTab, setResourceSubTab] = useState<"official" | "user-uploaded" | "pending">("official");
  const [eventStatusFilter, setEventStatusFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: "",
    type: "online",
    date: undefined as Date | undefined,
    timeHour: "",
    timeMinute: "",
    timePeriod: "AM",
    location: "",
    venue: "",
    description: "",
    visibility: "all",
    rsvpLimit: "",
  });
  const coverImageRef = useRef<HTMLInputElement>(null);
  const newsCoverImageRef = useRef<HTMLInputElement>(null);
  const newsAuthorImageRef = useRef<HTMLInputElement>(null);
  const newsImagesRef = useRef<HTMLInputElement>(null);
  const resourceFileRef = useRef<HTMLInputElement>(null);

   // News form state
   const [newsDialogOpen, setNewsDialogOpen] = useState(false);
   const [newsForm, setNewsForm] = useState({
     title: "",
     category: "",
     body: "",
   });
   const [newsImages, setNewsImages] = useState<File[]>([]);
   const [newsLoading, setNewsLoading] = useState(false);

   // Post detail modal
   const [postDialogOpen, setPostDialogOpen] = useState(false);
   const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

   // Edit news modal
   const [editNewsDialogOpen, setEditNewsDialogOpen] = useState(false);
   const [editNewsForm, setEditNewsForm] = useState({
     title: "",
     category: "",
     body: "",
   });
   const [editNewsImages, setEditNewsImages] = useState<File[]>([]);
   const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

   const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
   const [newsDetailsDialogOpen, setNewsDetailsDialogOpen] = useState(false);

   // Analytics dialog
   const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
   const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
   const [selectedEvent, setSelectedEvent] = useState<BackofficeEvent | null>(null);
   const [eventDetailsLoading, setEventDetailsLoading] = useState(false);
   const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
   const [resourceForm, setResourceForm] = useState({
     title: "",
     category: "",
     description: "",
     visibility: "All",
   });

  function handleEventChange(field: string, value: string) {
    setEventForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreateEvent() {
    if (!eventForm.name) {
      toast.error("Please enter an event name.");
      return;
    }
    if (!eventForm.date) {
      toast.error("Please select a date.");
      return;
    }
    if (!eventForm.timeHour || !eventForm.timeMinute) {
      toast.error("Please select hour and minute.");
      return;
    }
    if (!eventForm.description.trim()) {
      toast.error("Please enter a description.");
      return;
    }
    if (!coverImageRef.current?.files?.[0]) {
      toast.error("Please upload a cover image.");
      return;
    }

    let hour24 = parseInt(eventForm.timeHour);
    if (eventForm.timePeriod === "AM" && hour24 === 12) hour24 = 0;
    if (eventForm.timePeriod === "PM" && hour24 !== 12) hour24 += 12;

    const dateStr = format(eventForm.date, "yyyy-MM-dd");
    const timeStr = `${hour24.toString().padStart(2, "0")}:${eventForm.timeMinute}`;
    const startTime = `${dateStr}T${timeStr}:00Z`;

    setEventLoading(true);
    try {
      const result = await createEvent({
        name: eventForm.name,
        startTime,
        // TODO: No endTime field in UI — defaults to startTime
        endTime: startTime,
        address: eventForm.type === "in-person" ? eventForm.location : "",
        type: eventForm.type,
        timeZone: "UTC",
        description: eventForm.description,
        externalLink: eventForm.type === "online" ? eventForm.location : "",
        venue: eventForm.type === "in-person" ? eventForm.venue : "",
        coverImage: coverImageRef.current?.files?.[0],
      });
      toast.success(result.message || "Event created successfully!");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEventDialogOpen(false);
      setEventForm({
        name: "",
        type: "online",
        date: undefined,
        timeHour: "",
        timeMinute: "",
        timePeriod: "AM",
        location: "",
        venue: "",
        description: "",
        visibility: "all",
        rsvpLimit: "",
      });
      if (coverImageRef.current) coverImageRef.current.value = "";
    } catch (error: any) {
      toast.error(error?.message || "Failed to create event");
    } finally {
      setEventLoading(false);
    }
  }

  // News handlers
  async function handleCreateNews() {
    if (!newsForm.title.trim()) {
      toast.error("Please enter a headline.");
      return;
    }
    if (!newsForm.category) {
      toast.error("Please select a category.");
      return;
    }
    if (!newsForm.body.trim()) {
      toast.error("Please enter article content.");
      return;
    }

    setNewsLoading(true);
    try {
      await createNews({
        title: newsForm.title,
        body: newsForm.body,
        category: newsForm.category,
        coverImage: newsCoverImageRef.current?.files?.[0] || undefined,
        authorImage: newsAuthorImageRef.current?.files?.[0] || undefined,
        postImages: newsImages.length > 0 ? newsImages : undefined,
      });
      toast.success("News published successfully!");
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setNewsDialogOpen(false);
      setNewsForm({
        title: "",
        category: "",
        body: "",
      });
      setNewsImages([]);
      if (newsImagesRef.current) newsImagesRef.current.value = "";
      if (newsCoverImageRef.current) newsCoverImageRef.current.value = "";
      if (newsAuthorImageRef.current) newsAuthorImageRef.current.value = "";
    } catch (error: any) {
      toast.error(error?.message || "Failed to create news");
    } finally {
      setNewsLoading(false);
    }
  }

  // Event approval handlers
  const handleApproveEvent = (eventId: string) => {
    approveEventMutation.mutate(eventId);
  };

  const handleDeclineEvent = (eventId: string) => {
    declineEventMutation.mutate(eventId);
  };

  const handleViewEventDetails = async (event: BackofficeEvent) => {
    setSelectedEvent(event);
    setEventDetailsOpen(true);
    setEventDetailsLoading(true);
    try {
      const response = await fetchEventById(event.eventId);
      setSelectedEvent(response.data);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load event details");
    } finally {
      setEventDetailsLoading(false);
    }
  };

  // Resource handlers
  const handleArchiveResource = (resourceId: string) => {
    archiveResourceMutation.mutate(resourceId);
  };

  const handleDeleteResource = (resourceId: string) => {
    deleteResourceMutation.mutate(resourceId);
  };

  const handleDownloadResource = (resource: Resource) => {
    downloadResourceMutation.mutate({
      resourceId: resource.id,
      fallbackUrl: resource.resourceFileUrl || resource.filePath,
    });
  };

  const handleUploadResource = () => {
    if (!resourceForm.title.trim()) {
      toast.error("Please enter a resource title.");
      return;
    }
    if (!resourceForm.category.trim()) {
      toast.error("Please enter a resource category.");
      return;
    }
    const file = resourceFileRef.current?.files?.[0];
    if (!file) {
      toast.error("Please choose a resource file.");
      return;
    }
    uploadResourceMutation.mutate({
      title: resourceForm.title.trim(),
      description: resourceForm.description.trim(),
      category: resourceForm.category.trim(),
      visibility: resourceForm.visibility,
      file,
    });
  };

  const filteredEvents = events.filter((e) => {
    if (eventStatusFilter !== "all" && e.eventStatus !== eventStatusFilter) return false;
    if (eventTypeFilter !== "all" && e.type !== eventTypeFilter) return false;
    return true;
  });

  return (
    <>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Content & Engagement
          </h2>
          <p className="text-muted-foreground">
            Manage the feed, official news, and alumni resources.
          </p>
        </div>
        <div className="flex gap-3">
          {/* NEWS MODAL */}
          <Dialog open={newsDialogOpen} onOpenChange={setNewsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Newspaper className="h-4 w-4 mr-2" /> Draft News
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Post Official News</DialogTitle>
                <DialogDescription>
                  This will appear in the "Official" section of the user app.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input
                    placeholder="e.g. New Research Grant Announced"
                    value={newsForm.title}
                    onChange={(e) => setNewsForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      placeholder="e.g. Finance, Announcement"
                      value={newsForm.category}
                      onChange={(e) => setNewsForm(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Post Images</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={newsImagesRef}
                      className="cursor-pointer text-xs h-9"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).slice(0, 5);
                        setNewsImages(files);
                      }}
                    />
                    {newsImages.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {newsImages.length} file(s) selected
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cover Image (Banner)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      ref={newsCoverImageRef}
                      className="cursor-pointer text-xs h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Author Photo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      ref={newsAuthorImageRef}
                      className="cursor-pointer text-xs h-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Post Content</Label>
                  <Textarea
                    className="min-h-[150px]"
                    placeholder="Start writing the story..."
                    value={newsForm.body}
                    onChange={(e) => setNewsForm(prev => ({ ...prev, body: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="w-full"
                  onClick={handleCreateNews}
                  disabled={newsLoading}
                >
                  {newsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publish News Feed
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* BEEFED UP EVENT MODAL */}
          <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Configure Alumni Event</DialogTitle>
                <DialogDescription>
                  Set up a new event for the alumni community.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <Label>Event Name</Label>
                  <Input
                    placeholder="Alumni Homecoming 2026"
                    value={eventForm.name}
                    onChange={(e) => handleEventChange("name", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={eventForm.type}
                    onValueChange={(v) => handleEventChange("type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="in-person">In-Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !eventForm.date ? "text-muted-foreground" : ""
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventForm.date
                          ? format(eventForm.date, "MMM dd, yyyy")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        fromYear={new Date().getFullYear()}
                        toYear={new Date().getFullYear() + 5}
                        selected={eventForm.date}
                        onSelect={(date) =>
                          setEventForm((prev) => ({ ...prev, date }))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <TimePicker
                    hour={eventForm.timeHour}
                    minute={eventForm.timeMinute}
                    period={eventForm.timePeriod}
                    onHourChange={(v) => handleEventChange("timeHour", v)}
                    onMinuteChange={(v) => handleEventChange("timeMinute", v)}
                    onPeriodChange={(v) => handleEventChange("timePeriod", v)}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>
                    {eventForm.type === "online"
                      ? "Meeting Link"
                      : "Location / Address"}
                  </Label>
                  <Input
                    placeholder={
                      eventForm.type === "online"
                        ? "https://zoom.us/j/..."
                        : "In-person address"
                    }
                    value={eventForm.location}
                    onChange={(e) =>
                      handleEventChange("location", e.target.value)
                    }
                  />
                </div>
                {eventForm.type === "in-person" && (
                  <div className="col-span-2 space-y-2">
                    <Label>Venue</Label>
                    <Input
                      placeholder="e.g. Grand Ballroom, Hall A"
                      value={eventForm.venue}
                      onChange={(e) =>
                        handleEventChange("venue", e.target.value)
                      }
                    />
                  </div>
                )}
                <div className="col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your event..."
                    className="min-h-[80px]"
                    value={eventForm.description}
                    onChange={(e) =>
                      handleEventChange("description", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Cover Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    ref={coverImageRef}
                    className="cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={eventForm.visibility}
                    onValueChange={(v) => handleEventChange("visibility", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Public (All Alumni)</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="invitation">
                        Invitation Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>RSVP Limit</Label>
                  <Input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={eventForm.rsvpLimit}
                    onChange={(e) =>
                      handleEventChange("rsvpLimit", e.target.value)
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="w-full"
                  onClick={handleCreateEvent}
                  disabled={eventLoading}
                >
                  {eventLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Launch Event
                </Button>
              </DialogFooter>
            </DialogContent>
           </Dialog>
         
         {/* EDIT NEWS MODAL */}
         <Dialog open={editNewsDialogOpen} onOpenChange={setEditNewsDialogOpen}>
           <DialogTrigger asChild>
             <div className="pointer-events-none" />
           </DialogTrigger>
           <DialogContent className="sm:max-w-[500px]">
             <DialogHeader>
               <DialogTitle>Edit News Article</DialogTitle>
               <DialogDescription>
                 Update the content of this official news article.
               </DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4">
               <div className="space-y-2">
                 <Label>Headline</Label>
                 <Input
                   placeholder="e.g. New Research Grant Announced"
                   value={editNewsForm.title}
                   onChange={(e) => setEditNewsForm(prev => ({ ...prev, title: e.target.value }))}
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Category</Label>
                   <Input
                     placeholder="e.g. Finance, Announcement"
                     value={editNewsForm.category}
                     onChange={(e) => setEditNewsForm(prev => ({ ...prev, category: e.target.value }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Post Images</Label>
                   <Input
                     type="file"
                     accept="image/*"
                     multiple
                     ref={newsImagesRef}
                     className="cursor-pointer text-xs h-9"
                     onChange={(e) => {
                       const files = Array.from(e.target.files || []).slice(0, 5);
                       setEditNewsImages(files);
                     }}
                   />
                   {editNewsImages.length > 0 && (
                     <p className="text-xs text-muted-foreground mt-1">
                       {editNewsImages.length} file(s) selected
                     </p>
                   )}
                 </div>
               </div>
               <div className="space-y-2">
                 <Label>Post Content</Label>
                 <Textarea
                   className="min-h-[150px]"
                   placeholder="Start writing the story..."
                   value={editNewsForm.body}
                   onChange={(e) => setEditNewsForm(prev => ({ ...prev, body: e.target.value }))}
                 />
               </div>
             </div>
             <DialogFooter>
               <Button
                 className="w-full"
                 onClick={async () => {
                   if (!editNewsForm.title.trim()) {
                     toast.error("Please enter a headline.");
                     return;
                   }
                   if (!editNewsForm.category) {
                     toast.error("Please select a category.");
                     return;
                   }
                   if (!editNewsForm.body.trim()) {
                     toast.error("Please enter article content.");
                     return;
                   }

                   if (editingNewsId) {
                     updateNewsMutation.mutate({
                       postId: editingNewsId,
                       payload: {
                         title: editNewsForm.title,
                         category: editNewsForm.category,
                         body: editNewsForm.body,
                         postImages: editNewsImages.length > 0 ? editNewsImages : undefined,
                       },
                     });
                   }
                 }}
                 disabled={updateNewsMutation.isPending}
               >
                 {updateNewsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Update News
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
      </div>

      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feed">User Feed Moderation</TabsTrigger>
          <TabsTrigger value="news">Official News Feed</TabsTrigger>
          <TabsTrigger value="events">Events Calendar</TabsTrigger>
          <TabsTrigger value="resources">Resource Library</TabsTrigger>
        </TabsList>

        {/* --- USER FEED MODERATION --- */}
        <TabsContent value="feed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending User Posts</CardTitle>
              <CardDescription>
                Review and approve posts from the alumni community.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {postsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingPosts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No pending posts to review.
                  </p>
                ) : (
                   pendingPosts.map((post) => (
                     <div
                       key={post.id}
                       className="flex items-start justify-between p-4 border rounded-lg bg-muted/30"
                       onClick={() => {
                         setSelectedPost(post);
                         setPostDialogOpen(true);
                       }}
                       style={{ cursor: 'pointer' }}
                     >
                   <div className="flex gap-4">
                     <Avatar className="h-10 w-10">
                       <AvatarFallback>{post.user[0]}</AvatarFallback>
                     </Avatar>
                     <div className="space-y-1">
                       <div className="flex items-center gap-2">
                         <span className="font-semibold text-sm">
                           {post.user}
                         </span>
                         <span className="text-[10px] text-muted-foreground uppercase">
                           {post.time}
                         </span>
                         {post.status === "flagged" && (
                           <Badge
                             variant="destructive"
                             className="h-4 text-[9px]"
                           >
                             Flagged
                           </Badge>
                         )}
                       </div>
                       <p className="text-sm text-muted-foreground leading-snug">
                         {post.content}
                       </p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <Button
                       size="icon"
                       variant="ghost"
                       className="text-destructive h-8 w-8"
                       onClick={() => rejectPostMutation.mutate(post.id)}
                       disabled={rejectPostMutation.isPending}
                     >
                       <X className="h-4 w-4" />
                     </Button>
                     <Button
                       size="icon"
                       variant="ghost"
                       className="text-green-600 h-8 w-8"
                       onClick={() => approvePostMutation.mutate(post.id)}
                       disabled={approvePostMutation.isPending}
                     >
                       <Check className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               ))
             )}
           </div>
         </CardContent>
       </Card>
       
       {/* Post Detail Modal */}
       <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
         <DialogTrigger asChild>
           <div className="pointer-events-none" />
         </DialogTrigger>
         <DialogContent className="sm:max-w-[500px]">
           <DialogHeader>
             <DialogTitle>Post Details</DialogTitle>
             <DialogDescription>
               Review the content before taking action.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             {selectedPost && (
               <>
                 <div className="space-y-2">
                   <Label>Author</Label>
                   <p className="font-medium">{selectedPost.user}</p>
                 </div>
                 <div className="space-y-2">
                   <Label>Time</Label>
                   <p className="text-muted-foreground">{selectedPost.time}</p>
                 </div>
                 <div className="space-y-2">
                   <Label>Content</Label>
                   <p className="text-muted-foreground">{selectedPost.content}</p>
                 </div>
                 {selectedPost.status === "flagged" && (
                   <div className="space-y-2">
                     <Label>Status</Label>
                     <Badge variant="destructive">Flagged</Badge>
                   </div>
                 )}
               </>
             )}
           </div>
           <DialogFooter>
             <Button
               variant="outline"
               onClick={() => {
                 setPostDialogOpen(false);
               }}
             >
               Close
             </Button>
             {selectedPost && (
               <>
                 <Button
                   size="icon"
                   variant="ghost"
                   className="text-destructive h-8 w-8"
                   onClick={() => {
                     rejectPostMutation.mutate(selectedPost.id);
                     setPostDialogOpen(false);
                   }}
                   disabled={rejectPostMutation.isPending}
                 >
                   <X className="h-4 w-4" />
                 </Button>
                 <Button
                   size="icon"
                   variant="ghost"
                   className="text-green-600 h-8 w-8"
                   onClick={() => {
                     approvePostMutation.mutate(selectedPost.id);
                     setPostDialogOpen(false);
                   }}
                   disabled={approvePostMutation.isPending}
                 >
                   <Check className="h-4 w-4" />
                 </Button>
               </>
             )}
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* News Details Modal */}
       <Dialog open={newsDetailsDialogOpen} onOpenChange={setNewsDetailsDialogOpen}>
         <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
           {selectedNewsItem && (
             <>
               <DialogHeader className="space-y-3">
                 {selectedNewsItem.coverImageUrl || selectedNewsItem.coverImage ? (
                   <div className="w-full h-56 rounded-md overflow-hidden bg-muted">
                     <img
                       src={selectedNewsItem.coverImageUrl || selectedNewsItem.coverImage}
                       alt={selectedNewsItem.title}
                       className="w-full h-full object-cover"
                     />
                   </div>
                 ) : (
                   <div className="w-full h-32 bg-gradient-to-br from-red-500/10 to-blue-500/10 flex items-center justify-center rounded-md text-muted-foreground text-sm border">
                     <Newspaper className="h-10 w-10 opacity-40" />
                   </div>
                 )}

                 <div className="flex items-center justify-between">
                   <Badge variant="secondary" className="uppercase font-bold tracking-wider text-[10px]">
                     {selectedNewsItem.category || "Official"}
                   </Badge>
                   <span className="text-xs text-muted-foreground">{selectedNewsItem.views.toLocaleString()} reads</span>
                 </div>

                 <DialogTitle className="text-2xl font-bold tracking-tight leading-tight">
                   {selectedNewsItem.title}
                 </DialogTitle>
                 
                 <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
                   <div className="flex items-center gap-1.5">
                     {selectedNewsItem.authorImageUrl || selectedNewsItem.authorImage ? (
                       <img 
                         src={selectedNewsItem.authorImageUrl || selectedNewsItem.authorImage} 
                         alt="Author" 
                         className="h-6 w-6 rounded-full object-cover border" 
                       />
                     ) : (
                       <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                         A
                       </div>
                     )}
                     <span className="font-semibold text-foreground">Official Publisher</span>
                   </div>
                   <span>•</span>
                   <span>{format(new Date(selectedNewsItem.publishedAt), "PPP p")}</span>
                 </div>
               </DialogHeader>

               <div className="space-y-4 py-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-line border-t border-b">
                 {selectedNewsItem.content}
               </div>

               {/* Inline Post Images */}
               {selectedNewsItem.postImages && selectedNewsItem.postImages.length > 0 && (
                 <div className="space-y-2">
                   <p className="text-xs font-semibold uppercase text-muted-foreground">Article Images</p>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                     {selectedNewsItem.postImages.map((imgUrl, idx) => (
                       <div key={idx} className="h-28 rounded-md overflow-hidden bg-muted border">
                         <img
                           src={imgUrl}
                           alt={`Article inline ${idx + 1}`}
                           className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                           onClick={() => window.open(imgUrl, "_blank")}
                         />
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               <DialogFooter className="pt-2">
                 <Button
                   variant="outline"
                   onClick={() => {
                     setNewsDetailsDialogOpen(false);
                     setSelectedNewsItem(null);
                   }}
                   className="w-full sm:w-auto"
                 >
                   Close
                 </Button>
               </DialogFooter>
             </>
           )}
         </DialogContent>
       </Dialog>
     </TabsContent>

        {/* --- OFFICIAL NEWS FEED --- */}
        <TabsContent value="news" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {newsItemsLoading ? (
              <div className="flex items-center justify-center py-12 col-span-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : newsItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 col-span-full">
                No news articles published yet.
              </p>
            ) : (
              newsItems.map((news) => (
                <Card 
                  key={news.id} 
                  className="overflow-hidden flex flex-col justify-between h-full cursor-pointer hover:border-primary/50 transition-colors duration-200"
                  onClick={() => {
                    setSelectedNewsItem(news);
                    setNewsDetailsDialogOpen(true);
                  }}
                >
                  <div>
                    {news.coverImage ? (
                      <div className="w-full h-40 overflow-hidden bg-muted">
                        <img
                          src={news.coverImage}
                          alt={news.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-red-500/10 to-blue-500/10 flex items-center justify-center text-muted-foreground text-sm border-b">
                        <Newspaper className="h-8 w-8 opacity-40" />
                      </div>
                    )}
                    <CardHeader className="pb-2 pt-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="secondary" className="w-fit text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                          {news.category || "Official"}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-semibold line-clamp-2 tracking-tight">
                        {news.title}
                      </CardTitle>
                    </CardHeader>
                  </div>
                  <CardContent className="pt-0 pb-4">
                    <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                      <div className="flex items-center gap-2">
                        {news.authorImageUrl || news.authorImage ? (
                          <img 
                            src={news.authorImageUrl || news.authorImage} 
                            alt="Author" 
                            className="h-5 w-5 rounded-full object-cover border" 
                          />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[8px]">
                            A
                          </div>
                        )}
                        <span>Published: {format(new Date(news.publishedAt), "MMM dd, yyyy")}</span>
                      </div>
                      <span>{news.views.toLocaleString()} reads</span>
                    </div>
                    <div className="mt-4 flex gap-2 justify-end">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditNewsForm({
                            title: news.title,
                            category: news.category,
                            body: news.content,
                          });
                          setEditNewsImages([]);
                          if (newsImagesRef.current) newsImagesRef.current.value = "";
                          setEditingNewsId(news.id);
                          setEditNewsDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditNewsForm({
                                title: news.title,
                                category: news.category,
                                body: news.content,
                              });
                              setEditNewsImages([]);
                              if (newsImagesRef.current) newsImagesRef.current.value = "";
                              setEditingNewsId(news.id);
                              setEditNewsDialogOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNewsMutation.mutate(news.id);
                            }}
                            disabled={deleteNewsMutation.isPending}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        {/* --- EVENTS: Grid & Calendar View --- */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2 border rounded-md p-1 bg-muted/50 w-full sm:w-auto">
              <Select value={eventStatusFilter} onValueChange={setEventStatusFilter}>
                <SelectTrigger className="h-8 border-0 bg-transparent shadow-none focus:ring-0 w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="h-8 border-0 bg-transparent shadow-none focus:ring-0 w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-1 items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span> Approved
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span> Pending
              </div>
            </div>

            <div className="inline-flex border rounded-md p-1 bg-muted">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "calendar" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {eventsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.length === 0 ? (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  No events found.
                </p>
              ) : (
                filteredEvents.map((event) => (
                  <Card key={event.eventId} className="overflow-hidden">
                    <div className="relative">
                      {event.coverImageUrl ? (
                        <img
                          src={event.coverImageUrl}
                          alt={event.name}
                          className="h-32 w-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="h-32 bg-slate-200 rounded-t-lg flex items-center justify-center">
                          <CalendarIcon className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        <Badge 
                          variant={event.eventStatus === 'pending' ? "secondary" : "default"}
                          className={event.eventStatus === 'pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200' : 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'}
                        >
                          {event.eventStatus === 'pending' ? 'Pending Validation' : 'Approved'}
                        </Badge>
                        {event.visibility && (
                          <Badge variant="outline" className="bg-white/95 text-slate-700 border-slate-200 shadow-sm">
                            {event.visibility === "PUBLIC" ? "Public" : "Connections Only"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base line-clamp-1">
                        {event.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        {format(new Date(event.startTime), "MMM dd")}
                        {event.address ? ` • ${event.address}` : event.venue ? ` • ${event.venue}` : ""}
                      </CardDescription>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => handleViewEventDetails(event)}
                      >
                        View Details
                      </Button>
                      {event.eventStatus === 'pending' && (
                         <div className="pt-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-green-200 hover:bg-green-50 text-green-700"
                              onClick={() => handleApproveEvent(event.eventId)}
                              disabled={approveEventMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-200 hover:bg-red-50 text-red-700"
                              onClick={() => handleDeclineEvent(event.eventId)}
                              disabled={declineEventMutation.isPending}
                            >
                              Decline
                            </Button>
                         </div>
                      )}
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold">
                  {format(calendarMonth, "MMMM yyyy")}
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                      )
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="bg-muted/50 p-2 text-center text-xs font-bold"
                  >
                    {d}
                  </div>
                ))}
                {(() => {
                  const year = calendarMonth.getFullYear();
                  const month = calendarMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const cells = [];

                  // Empty cells before the 1st
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(
                      <div key={`empty-${i}`} className="bg-background min-h-[80px] p-2 border-t" />
                    );
                  }

                  for (let day = 1; day <= daysInMonth; day++) {
                    const currentDayDate = new Date(year, month, day);
                    const dayEvents = filteredEvents.filter((e) => {
                      const d = new Date(e.startTime);
                      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
                    });
                    cells.push(
                      <div 
                        key={day} 
                        className="bg-background min-h-[80px] p-2 border-t hover:bg-muted/10 cursor-pointer transition-colors relative"
                        onClick={() => {
                          setEventForm(prev => ({ ...prev, date: currentDayDate }));
                          setEventDialogOpen(true);
                        }}
                      >
                        <span className="text-xs text-muted-foreground">{day}</span>
                        {dayEvents.map((e) => (
                          <Popover key={e.eventId}>
                            <PopoverTrigger asChild>
                              <div
                                onClick={(ev) => ev.stopPropagation()}
                                className={`mt-1 p-1 text-[10px] rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${
                                  e.eventStatus === 'pending'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                                title={e.name}
                              >
                                {e.eventStatus === 'pending' ? '⏳ ' : ''}{e.name}
                              </div>
                            </PopoverTrigger>
                            <PopoverContent 
                              align="start" 
                              className="w-[300px] p-0 overflow-hidden" 
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              {e.coverImageUrl ? (
                                <img src={e.coverImageUrl} className="w-full h-32 object-cover" alt="cover" />
                              ) : (
                                <div className="w-full h-24 bg-slate-100 flex items-center justify-center">
                                  <CalendarIcon className="h-8 w-8 text-slate-300" />
                                </div>
                              )}
                              <div className="p-4 space-y-3">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge variant={e.eventStatus === 'pending' ? "secondary" : "default"} className={e.eventStatus === 'pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}>
                                      {e.eventStatus === 'pending' ? 'Pending' : 'Approved'}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground uppercase">{format(new Date(e.startTime), 'h:mm a')}</span>
                                  </div>
                                  <h4 className="font-bold leading-tight mt-2">{e.name}</h4>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.description || "No description provided."}</p>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  {e.type === 'online' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                  {e.address || e.venue || (e.type === 'online' ? "Online Event" : "No location set")}
                                </div>
                                <div className="pt-3 flex gap-2 border-t mt-3">
                                  {e.eventStatus === 'pending' ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 border-green-200 hover:bg-green-50 text-green-700"
                                        onClick={() => handleApproveEvent(e.eventId)}
                                        disabled={approveEventMutation.isPending}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 border-red-200 hover:bg-red-50 text-red-700"
                                        onClick={() => handleDeclineEvent(e.eventId)}
                                        disabled={declineEventMutation.isPending}
                                      >
                                        Decline
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => handleViewEventDetails(e)}
                                    >
                                      View Details
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ))}
                      </div>
                    );
                  }

                  return cells;
                })()}
              </div>
            </Card>
          )}
        </TabsContent>
        {/* --- RESOURCE LIBRARY --- */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4">
              <div>
                <CardTitle>Resource Library</CardTitle>
                <CardDescription>Manage official and community user-uploaded assets.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex border rounded-lg p-0.5 bg-muted">
                  <Button
                    variant={resourceSubTab === "official" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 text-xs font-medium"
                    onClick={() => setResourceSubTab("official")}
                  >
                    Official Resources
                  </Button>
                  <Button
                    variant={resourceSubTab === "user-uploaded" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 text-xs font-medium"
                    onClick={() => setResourceSubTab("user-uploaded")}
                  >
                    User Uploaded
                  </Button>
                  <Button
                    variant={resourceSubTab === "pending" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 text-xs font-medium relative"
                    onClick={() => setResourceSubTab("pending")}
                  >
                    Pending Approval
                    {pendingResources.length > 0 && (
                      <Badge className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center bg-amber-500 text-white hover:bg-amber-600 text-[9px] font-bold rounded-full">
                        {pendingResources.length}
                      </Badge>
                    )}
                  </Button>
                </div>
                {resourceSubTab === "official" && (
                  <Button size="sm" onClick={() => setResourceDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Upload Resource
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setAnalyticsDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" /> Analytics
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {resourceSubTab === "official" && (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-left">
                      <th className="p-4 font-semibold text-muted-foreground">Asset Name</th>
                      <th className="p-4 font-semibold text-muted-foreground">Category</th>
                      <th className="p-4 font-semibold text-muted-foreground">Visibility</th>
                      <th className="p-4 font-semibold text-muted-foreground text-center">Downloads</th>
                      <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resourcesLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        </td>
                      </tr>
                    ) : resources.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No resources found.
                        </td>
                      </tr>
                    ) : (
                      resources.map((resource) => (
                        <tr
                          key={resource.id}
                          className="border-b last:border-0 hover:bg-muted/10 transition-colors"
                        >
                          <td className="p-4 flex items-center gap-3 font-medium">
                            <div className="p-2 bg-blue-100 rounded-md">
                              <FileBox className="h-4 w-4 text-blue-600" />
                            </div>
                            {resource.name}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px]">
                              {resource.category}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {resource.visibility === "All" ? (
                                <Globe className="h-3 w-3" />
                              ) : (
                                <Lock className="h-3 w-3" />
                              )}
                              {resource.visibility}
                            </div>
                          </td>
                          <td className="p-4 text-center font-bold text-blue-600 font-mono">
                            {resource.downloads}
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleDownloadResource(resource)}
                                  disabled={downloadResourceMutation.isPending}
                                >
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  Edit Metadata
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive cursor-pointer"
                                  onClick={() => handleDeleteResource(resource.id)}
                                  disabled={deleteResourceMutation.isPending}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {resourceSubTab === "user-uploaded" && (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-left">
                      <th className="p-4 font-semibold text-muted-foreground">Asset Name</th>
                      <th className="p-4 font-semibold text-muted-foreground">Category</th>
                      <th className="p-4 font-semibold text-muted-foreground">Uploaded By</th>
                      <th className="p-4 font-semibold text-muted-foreground">Visibility</th>
                      <th className="p-4 font-semibold text-muted-foreground text-center">Downloads</th>
                      <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userUploadedLoading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        </td>
                      </tr>
                    ) : userUploadedResources.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No user uploaded resources found.
                        </td>
                      </tr>
                    ) : (
                      userUploadedResources.map((resource) => (
                        <tr
                          key={resource.id}
                          className="border-b last:border-0 hover:bg-muted/10 transition-colors"
                        >
                          <td className="p-4 flex items-center gap-3 font-medium">
                            <div className="p-2 bg-blue-100 rounded-md">
                              <FileBox className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p>{resource.name}</p>
                              {resource.description && (
                                <p className="text-xs text-muted-foreground font-normal line-clamp-1">{resource.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px]">
                              {resource.category}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-xs">
                                {resource.uploaderFirstName || resource.uploaderLastName 
                                  ? `${resource.uploaderFirstName || ""} ${resource.uploaderLastName || ""}`.trim()
                                  : "Alumni User"}
                              </span>
                              {resource.uploaderEmail && (
                                <span className="text-[10px] text-muted-foreground">{resource.uploaderEmail}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {resource.visibility === "All" ? (
                                <Globe className="h-3 w-3" />
                              ) : (
                                <Lock className="h-3 w-3" />
                              )}
                              {resource.visibility}
                            </div>
                          </td>
                          <td className="p-4 text-center font-bold text-blue-600 font-mono">
                            {resource.downloads}
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleDownloadResource(resource)}
                                  disabled={downloadResourceMutation.isPending}
                                >
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive cursor-pointer"
                                  onClick={() => handleDeleteResource(resource.id)}
                                  disabled={deleteResourceMutation.isPending}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {resourceSubTab === "pending" && (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-left">
                      <th className="p-4 font-semibold text-muted-foreground">Asset Name</th>
                      <th className="p-4 font-semibold text-muted-foreground">Category</th>
                      <th className="p-4 font-semibold text-muted-foreground">Uploaded By</th>
                      <th className="p-4 font-semibold text-muted-foreground text-center">Downloads</th>
                      <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingResourcesLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        </td>
                      </tr>
                    ) : pendingResources.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No resources pending approval.
                        </td>
                      </tr>
                    ) : (
                      pendingResources.map((resource) => (
                        <tr
                          key={resource.id}
                          className="border-b last:border-0 hover:bg-muted/10 transition-colors"
                        >
                          <td className="p-4 flex items-center gap-3 font-medium">
                            <div className="p-2 bg-blue-100 rounded-md">
                              <FileBox className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p>{resource.name}</p>
                              {resource.description && (
                                <p className="text-xs text-muted-foreground font-normal line-clamp-1">{resource.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px]">
                              {resource.category}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-xs">
                                {resource.uploaderFirstName || resource.uploaderLastName 
                                  ? `${resource.uploaderFirstName || ""} ${resource.uploaderLastName || ""}`.trim()
                                  : "Alumni User"}
                              </span>
                              {resource.uploaderEmail && (
                                <span className="text-[10px] text-muted-foreground">{resource.uploaderEmail}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center font-bold text-blue-600 font-mono">
                            {resource.downloads}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-green-200 bg-green-50/50 hover:bg-green-50 text-green-700 hover:text-green-800"
                                onClick={() => reviewResourceMutation.mutate({ resourceId: resource.id, action: "approve" })}
                                disabled={reviewResourceMutation.isPending}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive"
                                onClick={() => reviewResourceMutation.mutate({ resourceId: resource.id, action: "reject" })}
                                disabled={reviewResourceMutation.isPending}
                              >
                                <X className="h-3.5 w-3.5 mr-1" /> Reject
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleDownloadResource(resource)}
                                    disabled={downloadResourceMutation.isPending}
                                  >
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive cursor-pointer"
                                    onClick={() => handleDeleteResource(resource.id)}
                                    disabled={deleteResourceMutation.isPending}
                                  >
                                    Delete Permanent
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
       </Tabs>
     </div>

     <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
       <DialogContent className="sm:max-w-[650px]">
         <DialogHeader>
           <DialogTitle>{selectedEvent?.name || "Event Details"}</DialogTitle>
           <DialogDescription>
             {eventDetailsLoading ? "Loading event details..." : "Review event information and status."}
           </DialogDescription>
         </DialogHeader>
         {selectedEvent && (
           <div className="space-y-4">
             {selectedEvent.coverImageUrl ? (
               <img
                 src={selectedEvent.coverImageUrl}
                 alt={selectedEvent.name}
                 className="h-48 w-full rounded-md object-cover"
               />
             ) : null}
             <div className="grid gap-4 md:grid-cols-2">
               <DetailItem label="Status" value={selectedEvent.eventStatus || "approved"} />
               <DetailItem label="Type" value={selectedEvent.type || "-"} />
               <DetailItem
                 label="Starts"
                 value={selectedEvent.startTime ? format(new Date(selectedEvent.startTime), "PPP p") : "-"}
               />
               <DetailItem
                 label="Ends"
                 value={selectedEvent.endTime ? format(new Date(selectedEvent.endTime), "PPP p") : "-"}
               />
               <DetailItem
                 label="Location"
                 value={selectedEvent.address || selectedEvent.venue || selectedEvent.externalLink || "-"}
               />
               <DetailItem label="Time Zone" value={selectedEvent.timeZone || "-"} />
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Visibility</span>
                  <Select
                    value={selectedEvent.visibility || "PUBLIC"}
                    onValueChange={(value: "PUBLIC" | "CONNECTIONS_ONLY") => {
                      updateEventVisibilityMutation.mutate({
                        eventId: selectedEvent.eventId,
                        visibility: value,
                      });
                    }}
                    disabled={updateEventVisibilityMutation.isPending}
                  >
                    <SelectTrigger className="h-9 w-[180px] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="CONNECTIONS_ONLY">Connections Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
             <div>
               <p className="text-xs font-semibold uppercase text-muted-foreground">Description</p>
               <p className="mt-1 text-sm">{selectedEvent.description || "No description provided."}</p>
             </div>
           </div>
         )}
         <DialogFooter>
           {selectedEvent?.eventStatus === "pending" ? (
             <>
               <Button
                 variant="outline"
                 className="border-red-200 text-red-700 hover:bg-red-50"
                 onClick={() => handleDeclineEvent(selectedEvent.eventId)}
                 disabled={declineEventMutation.isPending}
               >
                 Decline
               </Button>
               <Button
                 variant="outline"
                 className="border-green-200 text-green-700 hover:bg-green-50"
                 onClick={() => handleApproveEvent(selectedEvent.eventId)}
                 disabled={approveEventMutation.isPending}
               >
                 Approve
               </Button>
             </>
           ) : null}
           <Button variant="outline" onClick={() => setEventDetailsOpen(false)}>
             Close
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>

     <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
       <DialogContent className="sm:max-w-[520px]">
         <DialogHeader>
           <DialogTitle>Upload Resource</DialogTitle>
           <DialogDescription>Add a resource to the alumni library.</DialogDescription>
         </DialogHeader>
         <div className="space-y-4">
           <div className="space-y-2">
             <Label>Title</Label>
             <Input
               value={resourceForm.title}
               onChange={(event) =>
                 setResourceForm((prev) => ({ ...prev, title: event.target.value }))
               }
               disabled={uploadResourceMutation.isPending}
             />
           </div>
           <div className="space-y-2">
             <Label>Category</Label>
             <Input
               value={resourceForm.category}
               onChange={(event) =>
                 setResourceForm((prev) => ({ ...prev, category: event.target.value }))
               }
               disabled={uploadResourceMutation.isPending}
             />
           </div>
           <div className="space-y-2">
             <Label>Description</Label>
             <Textarea
               value={resourceForm.description}
               onChange={(event) =>
                 setResourceForm((prev) => ({ ...prev, description: event.target.value }))
               }
               disabled={uploadResourceMutation.isPending}
             />
           </div>
           <div className="space-y-2">
             <Label>Visibility</Label>
             <Select
               value={resourceForm.visibility}
               onValueChange={(value) =>
                 setResourceForm((prev) => ({ ...prev, visibility: value }))
               }
               disabled={uploadResourceMutation.isPending}
             >
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="All">All</SelectItem>
                 <SelectItem value="Verified">Verified</SelectItem>
               </SelectContent>
             </Select>
           </div>
           <div className="space-y-2">
             <Label>File</Label>
             <Input
               ref={resourceFileRef}
               type="file"
               disabled={uploadResourceMutation.isPending}
             />
           </div>
         </div>
         <DialogFooter>
           <Button
             variant="outline"
             onClick={() => setResourceDialogOpen(false)}
             disabled={uploadResourceMutation.isPending}
           >
             Cancel
           </Button>
           <Button onClick={handleUploadResource} disabled={uploadResourceMutation.isPending}>
             {uploadResourceMutation.isPending ? "Uploading..." : "Upload Resource"}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
     
     {/* ANALYTICS DIALOG */}
     <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
       <DialogTrigger asChild>
         <div className="pointer-events-none" />
       </DialogTrigger>
       <DialogContent className="sm:max-w-[600px]">
         <DialogHeader>
           <DialogTitle>Resource Analytics</DialogTitle>
           <DialogDescription>
             View download statistics and engagement metrics for resources.
           </DialogDescription>
         </DialogHeader>
         <div className="space-y-6">
           {/* Placeholder for analytics content */}
           <div className="text-center py-12">
             <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-4" />
             <p className="text-muted-foreground">Loading analytics data...</p>
           </div>
         </div>
         <DialogFooter>
           <Button
             variant="outline"
             onClick={() => {
               setAnalyticsDialogOpen(false);
             }}
           >
             Close
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
     </>
   );
 }

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
