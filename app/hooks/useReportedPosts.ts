import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchReportedPosts,
  hideReportedPost,
  unhideReportedPost,
  deleteReportedPost,
  type ReportedPost,
} from "@/services/apiContent";
import { toast } from "sonner";

export function useReportedPosts(page = 1, limit = 20) {
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("stp_token");

  const {
    data: reportedPosts = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<ReportedPost[]>({
    queryKey: ["reported-posts", page, limit],
    queryFn: () => fetchReportedPosts(page, limit),
    enabled: hasToken,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    reportedPosts,
    isLoading,
    isRefetching,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

export function useReportedPostMutations() {
  const queryClient = useQueryClient();

  const hideMutation = useMutation({
    mutationFn: (postId: string) => hideReportedPost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["reported-posts"] });
      queryClient.invalidateQueries({ queryKey: ["pending-posts"] });
      queryClient.invalidateQueries({ queryKey: ["platform-analytics"] });
      toast.success("Post hidden from community feed");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to hide post");
    },
  });

  const unhideMutation = useMutation({
    mutationFn: (postId: string) => unhideReportedPost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["reported-posts"] });
      queryClient.invalidateQueries({ queryKey: ["pending-posts"] });
      queryClient.invalidateQueries({ queryKey: ["platform-analytics"] });
      toast.success("Post unhidden and restored to community feed");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to unhide post");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => deleteReportedPost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["reported-posts"] });
      queryClient.invalidateQueries({ queryKey: ["pending-posts"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      queryClient.invalidateQueries({ queryKey: ["platform-analytics"] });
      toast.success("Reported post permanently deleted");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete post");
    },
  });

  return {
    hidePost: hideMutation.mutate,
    unhidePost: unhideMutation.mutate,
    deletePost: deleteMutation.mutate,
    isHiding: hideMutation.isPending,
    isUnhiding: unhideMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

