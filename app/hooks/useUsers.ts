import { fetchUsers, fetchUserProfile, fetchUsersSummary } from "@/services/apiUsers";
import { useUsersStore } from "@/stores/usersStore";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export function useUsers(page: number = 1, perPage: number = 10) {
  const users = useUsersStore((state) => state.users);
  const isLoading = useUsersStore((state) => state.isLoading);
  const error = useUsersStore((state) => state.error);
  const setUsers = useUsersStore((state) => state.setUsers);
  const setIsLoading = useUsersStore((state) => state.setIsLoading);
  const setError = useUsersStore((state) => state.setError);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("stp_token") : null;
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchUsers(page, perPage + 1);
        setUsers(response.data);
      } catch (error: any) {
        setError(error?.message || "Failed to fetch users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, page, perPage, setUsers, setIsLoading, setError]);

  const allItems = users ?? [];
  const hasNextPage = allItems.length > perPage;
  const paginatedUsers = hasNextPage ? allItems.slice(0, perPage) : allItems;

  return {
    data: { data: paginatedUsers },
    isLoading,
    error,
    hasNextPage,
  };
}

export function useAllUsers() {
  const allUsers = useUsersStore((state) => state.allUsers);
  const allUsersLoading = useUsersStore((state) => state.allUsersLoading);
  const error = useUsersStore((state) => state.error);
  const setAllUsers = useUsersStore((state) => state.setAllUsers);
  const setAllUsersLoading = useUsersStore((state) => state.setAllUsersLoading);
  const setError = useUsersStore((state) => state.setError);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("stp_token") : null;
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || hasFetched) return;

    const fetchData = async () => {
      setAllUsersLoading(true);
      setError(null);

      try {
        const response = await fetchUsers(1, 10000);
        setAllUsers(response.data);
      } catch (error: any) {
        setError(error?.message || "Failed to fetch users");
      } finally {
        setAllUsersLoading(false);
      }
    };

    fetchData();
    setHasFetched(true);
  }, [isAuthenticated, hasFetched, setAllUsers, setAllUsersLoading, setError]);

  return {
    data: { data: allUsers },
    isLoading: allUsersLoading,
    error,
  };
}

export function useUserProfile(userId: string | null) {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("stp_token") : null;
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchUserProfile(userId);
        setProfile(response.data);
      } catch (error: any) {
        setError(error?.message || "Failed to fetch user profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, isAuthenticated]);

  return {
    profile,
    isLoading,
    error,
  };
}

export function useUsersSummary() {
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("stp_token");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["users-summary"],
    queryFn: fetchUsersSummary,
    enabled: hasToken,
    staleTime: 60 * 1000,
  });

  return {
    summary: data?.data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
