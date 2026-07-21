import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUsersStore } from "@/stores/usersStore";
import {
  createUser,
  verifyUser,
  deleteUser,
  activateUser,
  deactivateUser,
  lockUser,
  unlockUser,
  changeUserRole,
  rejectUserVerification,
  exportUsersCsv,
  type CreateUserPayload,
  type ExportUsersFilters,
} from "@/services/apiUsers";

export function useCreateUserMutation() {
  const store = useUsersStore();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: async () => {
      toast.success("User created successfully");
      // Refetch all users to get the new user
      store.setIsLoading(true);
      try {
        const { fetchUsers } = await import("@/services/apiUsers");
        const response = await fetchUsers(1, 10000);
        store.setAllUsers(response.data);
      } catch (error: any) {
        toast.error("Failed to refresh user list");
      } finally {
        store.setIsLoading(false);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create user");
    },
  });
}

export function useVerifyUserMutation() {
  const store = useUsersStore();

  return useMutation({
    mutationFn: (userId: string) => verifyUser(userId),
    onSuccess: (_data, userId) => {
      store.updateUser(userId, { isVerified: true });
      toast.success("User verified successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to verify user");
    },
  });
}

export function useDeleteUserMutation() {
  const store = useUsersStore();

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: (_data, userId) => {
      store.removeUser(userId);
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete user");
    },
  });
}

export function useActivateUserMutation() {
  const store = useUsersStore();

  return useMutation({
    mutationFn: (userId: string) => activateUser(userId),
    onSuccess: (_data, userId) => {
      store.updateUser(userId, { isActive: true });
      toast.success("User activated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to activate user");
    },
  });
}

export function useDeactivateUserMutation() {
  const store = useUsersStore();

  return useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onSuccess: (_data, userId) => {
      store.updateUser(userId, { isActive: false });
      toast.success("User deactivated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to deactivate user");
    },
  });
}

export function useLockUserMutation() {
  const store = useUsersStore();

  return useMutation({
    mutationFn: (userId: string) => lockUser(userId),
    onSuccess: (_data, userId) => {
      store.updateUser(userId, { isLocked: true });
      toast.success("User locked successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to lock user");
    },
  });
}

export function useUnlockUserMutation() {
  const store = useUsersStore();

  return useMutation({
    mutationFn: (userId: string) => unlockUser(userId),
    onSuccess: (_data, userId) => {
      store.updateUser(userId, { isLocked: false });
      toast.success("User unlocked successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to unlock user");
    },
  });
}

export function useChangeUserRoleMutation() {
  const store = useUsersStore();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      changeUserRole(userId, role),
    onSuccess: (_data, { userId, role }) => {
      store.updateUser(userId, { role });
      toast.success("User role changed successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to change user role");
    },
  });
}

export function useRejectUserMutation() {
  const store = useUsersStore();

  return useMutation({
    mutationFn: (userId: string) => rejectUserVerification(userId),
    onSuccess: (_data, userId) => {
      store.removeUser(userId);
      toast.success("Applicant rejected successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to reject user");
    },
  });
}

export function useExportUsersMutation() {
  return useMutation({
    mutationFn: (filters?: ExportUsersFilters) => exportUsersCsv(filters),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `alumni_users_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Users CSV exported successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to export users CSV");
    },
  });
}
