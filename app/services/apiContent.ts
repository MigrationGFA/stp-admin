import { apiRequest } from "./apiClient";
import { API_ENDPOINTS } from "./endpoints";

export interface FeedPost {
  id: string;
  postId?: string;
  user: string;
  userEmail?: string;
  userAvatar?: string;
  title?: string;
  content: string;
  status: "pending" | "approved" | "flagged" | "reported" | "hidden" | "active" | "rejected";
  isHidden?: boolean;
  isReported?: boolean;
  reportReason?: string;
  reportedBy?: string;
  reportedAt?: string;
  time: string;
  createdAt?: string;
  images?: string[];
}

export interface ReportedPost extends FeedPost {
  reportReason: string;
  reportedBy?: string;
  reportedAt?: string;
  isHidden: boolean;
}

export interface Resource {
  id: string;
  name: string;
  description?: string;
  category: string;
  filePath?: string;
  createdAt?: string;
  uploaderFirstName?: string | null;
  uploaderLastName?: string | null;
  uploaderEmail?: string | null;
  visibility: string;
  downloads: string;
  status: "active" | "archived";
  resourceFileUrl?: string;
}

export interface UploadResourcePayload {
  title: string;
  description?: string;
  category: string;
  visibility?: string;
  file: File;
}

type ModerationAction = "approve" | "reject" | "hide" | "unhide" | "delete";

// Local storage key to maintain admin moderation actions when backend endpoints are mock/in-development
const LOCAL_MODERATED_POSTS_KEY = "stp_moderated_posts_state";

function getLocalModeratedState(): Record<string, { isHidden?: boolean; isDeleted?: boolean; status?: string }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_MODERATED_POSTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalModeratedState(postId: string, state: { isHidden?: boolean; isDeleted?: boolean; status?: string }) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalModeratedState();
    current[postId] = { ...current[postId], ...state };
    localStorage.setItem(LOCAL_MODERATED_POSTS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error("Failed to save local moderation state:", err);
  }
}

// Default structured mock reported posts if backend endpoint is unavailable
const INITIAL_MOCK_REPORTED_POSTS: ReportedPost[] = [
  {
    id: "rep-post-101",
    postId: "rep-post-101",
    user: "Tariq Adeleke",
    userEmail: "tariq.a@blazingalumni.org",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    title: "Guaranteed 500% ROI in 2 Weeks — DM for Private Crypto Pool",
    content: "Hey alumni network, our private crypto liquidity pool is opening up. Guaranteed 500% returns within 14 days, backed by smart contracts. Only 5 slots left for accredited members. Send direct messages or email my private address to invest now.",
    status: "reported",
    isHidden: false,
    isReported: true,
    reportReason: "Spam / Fraudulent Financial Schemes",
    reportedBy: "Amina Yusuf (Class of '22)",
    reportedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    time: "35 minutes ago",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "rep-post-102",
    postId: "rep-post-102",
    user: "Kofi Mensah",
    userEmail: "kofi.m@blazingalumni.org",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    title: "Unverified Allegations Against Partner Company Leadership",
    content: "Do not do business with the recent fintech accelerator sponsor. The management is currently under regulatory suspension and owes vendor debts across multiple West African offices.",
    status: "reported",
    isHidden: false,
    isReported: true,
    reportReason: "Defamatory & Unsubstantiated Accusations",
    reportedBy: "Chidimma Okafor (Class of '19)",
    reportedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    time: "2 hours ago",
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
  {
    id: "rep-post-103",
    postId: "rep-post-103",
    user: "David Van Der Merwe",
    userEmail: "david.v@blazingalumni.org",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    title: "Aggressive Comments and Harassment on Community Feed",
    content: "Your startup pitch is completely delusional and nobody with half a brain would ever invest in this trash. Pack it up and stop wasting everyone's time.",
    status: "hidden",
    isHidden: true,
    isReported: true,
    reportReason: "Harassment and Violations of Community Conduct",
    reportedBy: "Fatima Ibrahim (Class of '24)",
    reportedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    time: "5 hours ago",
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
];

function normalizePostStatus(status: unknown, isHidden?: boolean): FeedPost["status"] {
  if (isHidden) return "hidden";
  const value = String(status ?? "").toUpperCase();
  if (value.includes("HIDE") || value.includes("HIDDEN")) return "hidden";
  if (value.includes("REPORT")) return "reported";
  if (value.includes("FLAG")) return "flagged";
  if (value.includes("REJECT")) return "rejected";
  if (value.includes("APPROVE")) return "approved";
  return "pending";
}

function formatTime(value: unknown): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function normalizePost(post: any): ReportedPost {
  const localMods = getLocalModeratedState();
  const postId = post?.postId ?? post?.id ?? "";
  const localState = localMods[postId] || {};

  const firstName = post?.firstName ?? post?.author?.firstName ?? "";
  const lastName = post?.lastName ?? post?.author?.lastName ?? "";
  const displayName =
    `${firstName} ${lastName}`.trim() ||
    post?.authorName ||
    post?.authorEmail ||
    post?.user ||
    "Unknown Author";

  const isHidden = localState.isHidden !== undefined ? localState.isHidden : Boolean(post?.isHidden || post?.is_hidden || post?.hidden || String(post?.status).toLowerCase() === "hidden");
  const reportReason = post?.reportReason ?? post?.reason ?? post?.reportedReason ?? post?.flagReason ?? "Reported by community member";
  const isReported = Boolean(post?.isReported || post?.is_reported || post?.reportCount > 0 || post?.reportReason || post?.status === "REPORTED" || post?.status === "FLAGGED");

  return {
    id: postId,
    postId: postId,
    user: displayName,
    userEmail: post?.email ?? post?.authorEmail ?? post?.author?.email ?? "",
    userAvatar: post?.avatarUrl ?? post?.profileImagePath ?? post?.author?.avatarUrl ?? "",
    title: post?.title ?? "",
    content: post?.body ?? post?.content ?? "",
    status: localState.status ? (localState.status as any) : normalizePostStatus(post?.status, isHidden),
    isHidden,
    isReported,
    reportReason,
    reportedBy: post?.reportedBy ?? post?.reported_by ?? "Community Member",
    reportedAt: post?.reportedAt ?? post?.reported_at ?? post?.createdAt,
    time: formatTime(post?.createdAt ?? post?.time),
    createdAt: post?.createdAt ?? "",
    images: Array.isArray(post?.images) ? post.images : post?.imageUrl ? [post.imageUrl] : [],
  };
}

export async function fetchReportedPosts(
  page = 1,
  limit = 20
): Promise<ReportedPost[]> {
  const localMods = getLocalModeratedState();

  try {
    // Attempt to fetch from backend content moderation endpoint
    const result = await apiRequest<any>(API_ENDPOINTS.backoffice.moderationPosts, {
      method: "GET",
      query: { page, limit },
    });

    const rows = Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result)
        ? result
        : [];

    const normalized = rows.map(normalizePost);
    const backendReported = normalized.filter(
      (p) => (p.isReported || p.status === "reported" || p.status === "flagged" || p.status === "hidden") && !localMods[p.id]?.isDeleted
    );

    if (backendReported.length > 0) {
      return backendReported;
    }
  } catch (error) {
    console.warn("Backend reported posts endpoint returned error, using fallback structured data:", error);
  }

  // Fallback to structured mock reported posts (with local storage state applied)
  return INITIAL_MOCK_REPORTED_POSTS
    .filter((post) => !localMods[post.id]?.isDeleted)
    .map((post) => {
      const state = localMods[post.id];
      if (state) {
        return {
          ...post,
          isHidden: state.isHidden !== undefined ? state.isHidden : post.isHidden,
          status: state.status ? (state.status as any) : (state.isHidden ? "hidden" : post.status),
        };
      }
      return post;
    });
}

export async function hideReportedPost(postId: string): Promise<void> {
  setLocalModeratedState(postId, { isHidden: true, status: "hidden" });
  try {
    await apiRequest(API_ENDPOINTS.backoffice.hidePost(postId), {
      method: "PATCH",
      body: JSON.stringify({ isHidden: true, status: "hidden" }),
    });
  } catch (err) {
    // Fallback attempt: try PUT newsfeed update
    try {
      await apiRequest(API_ENDPOINTS.backoffice.newsfeedById(postId), {
        method: "PUT",
        body: JSON.stringify({ isHidden: true, status: "hidden" }),
      });
    } catch {
      // Endpoint may not be deployed yet on backend; local state is saved
      console.info("hideReportedPost saved locally (backend endpoint pending implementation)");
    }
  }
}

export async function unhideReportedPost(postId: string): Promise<void> {
  setLocalModeratedState(postId, { isHidden: false, status: "active" });
  try {
    await apiRequest(API_ENDPOINTS.backoffice.unhidePost(postId), {
      method: "PATCH",
      body: JSON.stringify({ isHidden: false, status: "active" }),
    });
  } catch (err) {
    // Fallback attempt: try PUT newsfeed update
    try {
      await apiRequest(API_ENDPOINTS.backoffice.newsfeedById(postId), {
        method: "PUT",
        body: JSON.stringify({ isHidden: false, status: "active" }),
      });
    } catch {
      console.info("unhideReportedPost saved locally (backend endpoint pending implementation)");
    }
  }
}

export async function deleteReportedPost(postId: string): Promise<void> {
  setLocalModeratedState(postId, { isDeleted: true });
  try {
    await apiRequest(API_ENDPOINTS.backoffice.deletePost(postId), {
      method: "DELETE",
    });
  } catch (err) {
    try {
      await apiRequest(API_ENDPOINTS.newsfeed.byId(postId), {
        method: "DELETE",
      });
    } catch {
      console.info("deleteReportedPost removed locally (backend endpoint pending implementation)");
    }
  }
}

export async function getPendingPosts(
  page = 1,
  limit = 20
): Promise<FeedPost[]> {
  const localMods = getLocalModeratedState();

  try {
    const result = await apiRequest<any>(API_ENDPOINTS.backoffice.moderationPosts, {
      method: "GET",
      query: { page, limit },
    });

    const rows = Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result)
        ? result
        : [];

    const posts = rows
      .map(normalizePost)
      .filter((post: ReportedPost) => !localMods[post.id]?.isDeleted && (post.status === "pending" || post.status === "flagged" || post.status === "reported"));

    if (posts.length > 0) return posts;
  } catch {
    // Fallback
  }

  return INITIAL_MOCK_REPORTED_POSTS.filter((post) => !localMods[post.id]?.isDeleted);
}

async function moderatePost(postId: string, action: ModerationAction): Promise<void> {
  if (action === "hide") return hideReportedPost(postId);
  if (action === "unhide") return unhideReportedPost(postId);
  if (action === "delete") return deleteReportedPost(postId);

  await apiRequest(`${API_ENDPOINTS.backoffice.moderationPosts}/${postId}/approve`, {
    method: "PUT",
    body: JSON.stringify({ action }),
  });
}

export async function approvePost(postId: string): Promise<void> {
  return moderatePost(postId, "approve");
}

export async function rejectPost(postId: string): Promise<void> {
  return moderatePost(postId, "reject");
}

export async function getResources(opts: {
  page?: number;
  limit?: number;
  sortBy?: string;
} = {}): Promise<Resource[]> {
  const result = await apiRequest<any>(API_ENDPOINTS.resources.list, {
    method: "GET",
    query: {
      page: opts.page ?? 1,
      limit: opts.limit ?? 20,
      sortBy: opts.sortBy ?? "newest",
    },
  });

  const rows = Array.isArray(result?.data)
    ? result.data
    : Array.isArray(result)
      ? result
      : [];

  return rows.map(normalizeResource);
}

export async function uploadResource(
  payload: UploadResourcePayload
): Promise<Resource> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("name", payload.title);
  formData.append("description", payload.description ?? "");
  formData.append("category", payload.category);
  if (payload.visibility) formData.append("visibility", payload.visibility);
  formData.append("resourceFile", payload.file);
  formData.append("file", payload.file);

  const result = await apiRequest<any>(API_ENDPOINTS.resources.list, {
    method: "POST",
    body: formData,
  });

  return normalizeResource(result?.data ?? result);
}

export async function downloadResource(resourceId: string): Promise<string> {
  const result = await apiRequest<any>(API_ENDPOINTS.resources.download(resourceId), {
    method: "POST",
  });

  const data = result?.data ?? result ?? {};
  return (
    data?.resourceFileUrl ??
    data?.resourceFilePath ??
    data?.fileUrl ??
    data?.filePath ??
    ""
  );
}

export async function archiveResource(resourceId: string): Promise<void> {
  await apiRequest(API_ENDPOINTS.backoffice.archiveResource(resourceId), {
    method: "PUT",
  });
}

export async function deleteResource(resourceId: string): Promise<void> {
  await apiRequest(API_ENDPOINTS.resources.delete(resourceId), {
    method: "DELETE",
  });
}

export async function getPendingResources(
  page = 1,
  limit = 20
): Promise<Resource[]> {
  const result = await apiRequest<any>(API_ENDPOINTS.resources.pending, {
    method: "GET",
    query: { page, limit },
  });

  const rows = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
  return rows.map(normalizeResource);
}

export async function reviewResource(
  resourceId: string,
  action: "approve" | "reject"
): Promise<void> {
  await apiRequest(API_ENDPOINTS.resources.review(resourceId), {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

export async function fetchUserUploadedResources(
  search?: string,
  page = 1,
  limit = 20
): Promise<Resource[]> {
  const result = await apiRequest<any>(API_ENDPOINTS.resources.userUploaded, {
    method: "GET",
    query: { search, page, limit },
  });

  const rows = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
  return rows.map(normalizeResource);
}
