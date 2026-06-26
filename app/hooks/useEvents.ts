import { useQuery } from "@tanstack/react-query";
import { fetchEvents, fetchPendingEvents, type BackofficeEvent } from "@/services/apiEvents";

interface EventsQueryResult {
  events: BackofficeEvent[];
  approvedEvents: BackofficeEvent[];
  pendingEvents: BackofficeEvent[];
}

export function useEvents() {
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("stp_token");

  const { data, isLoading, error } = useQuery<EventsQueryResult>({
    queryKey: ["events"],
    enabled: hasToken,
    queryFn: async () => {
      const [allRes, pendingRes] = await Promise.all([
        fetchEvents("ALL"),
        fetchPendingEvents(),
      ]);

      const merged = new Map<string, BackofficeEvent>();

      allRes.data.forEach((event) => {
        merged.set(event.eventId, event);
      });

      pendingRes.data.forEach((event) => {
        merged.set(event.eventId, { ...event, eventStatus: "pending" });
      });

      const events = Array.from(merged.values()).sort((a, b) => {
        const timeA = new Date(a.createdAt || a.startTime).getTime() || 0;
        const timeB = new Date(b.createdAt || b.startTime).getTime() || 0;
        return timeB - timeA;
      });

      return {
        events,
        approvedEvents: events.filter((event) => event.eventStatus === "approved"),
        pendingEvents: events.filter((event) => event.eventStatus === "pending"),
      };
    },
    staleTime: 30 * 1000,
  });

  return {
    events: data?.events ?? [],
    approvedEvents: data?.approvedEvents ?? [],
    pendingEvents: data?.pendingEvents ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
