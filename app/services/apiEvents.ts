import type { Event } from "@/lib/type";
import { apiRequest } from "./apiClient";
import { API_ENDPOINTS } from "./endpoints";

export type EventStatusFilter = "ALL" | "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";
export type EventModerationAction = "approve" | "reject";

export interface BackofficeEvent extends Event {
  eventStatus: "approved" | "pending" | "rejected";
}

export interface EventsResponse {
  status: boolean;
  message: string;
  data: BackofficeEvent[];
}

export interface CreateEventPayload {
  type: string;
  name: string;
  timeZone: string;
  startTime: string;
  endTime: string;
  description: string;
  externalLink: string;
  address: string;
  venue: string;
  coverImage?: File;
}

export interface CreateEventResponse {
  status: boolean;
  message: string;
  data: {
    eventId: string;
  };
}

export interface EventDetailResponse {
  status: boolean;
  message: string;
  data: BackofficeEvent;
}

export interface ApproveEventPayload {
  action: EventModerationAction;
  reason?: string;
}

function normalizeEventStatus(rawStatus: unknown): BackofficeEvent["eventStatus"] {
  const status = String(rawStatus ?? "").toUpperCase();
  if (status.includes("PENDING")) return "pending";
  if (status.includes("REJECT")) return "rejected";
  if (status.includes("APPROVE") || status.includes("ACTIVE")) return "approved";
  return "approved";
}

function normalizeEvent(event: any, fallbackStatus?: unknown): BackofficeEvent {
  const type = String(event?.type ?? "online").toLowerCase();
  return {
    eventId: event?.eventId ?? event?.id ?? "",
    type,
    format: event?.format ?? "",
    name: event?.name ?? "",
    timeZone: event?.timeZone ?? "UTC",
    startTime: event?.startTime ?? event?.startDateTime ?? "",
    endTime: event?.endTime ?? event?.endDateTime ?? event?.startTime ?? "",
    description: event?.description ?? "",
    externalLink: event?.externalLink ?? "",
    address: event?.address ?? "",
    venue: event?.venue ?? "",
    createdBy: event?.createdBy ?? "",
    createdAt: event?.createdAt ?? "",
    updatedAt: event?.updatedAt ?? "",
    coverImageUrl: event?.coverImageUrl ?? event?.coverImagePath ?? "",
    eventStatus: normalizeEventStatus(event?.eventStatus ?? event?.status ?? fallbackStatus),
    visibility: event?.visibility ?? "PUBLIC",
  };
}

function extractRows(result: any): any[] {
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  return [];
}

export async function fetchEvents(status: EventStatusFilter = "ALL"): Promise<EventsResponse> {
  const result = await apiRequest<any>(API_ENDPOINTS.backoffice.events, {
    method: "GET",
    query: { status },
  });

  return {
    status: Boolean(result?.status ?? true),
    message: result?.message ?? "Events fetched successfully",
    data: extractRows(result).map((event) => normalizeEvent(event, status)),
  };
}

export async function fetchPendingEvents(): Promise<EventsResponse> {
  const result = await apiRequest<any>(API_ENDPOINTS.backoffice.pendingEvents, {
    method: "GET",
  });

  return {
    status: Boolean(result?.status ?? true),
    message: result?.message ?? "Pending events fetched successfully",
    data: extractRows(result).map((event) => normalizeEvent(event, "PENDING_APPROVAL")),
  };
}

export async function fetchEventById(eventId: string): Promise<EventDetailResponse> {
  const result = await apiRequest<any>(API_ENDPOINTS.events.byId(eventId), {
    method: "GET",
  });

  return {
    status: Boolean(result?.status ?? true),
    message: result?.message ?? "Event details fetched successfully",
    data: normalizeEvent(result?.data ?? result),
  };
}

export async function createEvent(
  payload: CreateEventPayload
): Promise<CreateEventResponse> {
  const formData = new FormData();
  formData.append("type", payload.type);
  formData.append("name", payload.name);
  formData.append("format", "json");
  formData.append("timeZone", payload.timeZone);
  formData.append("startTime", payload.startTime);
  formData.append("endTime", payload.endTime);
  formData.append("description", payload.description);
  formData.append("externalLink", payload.externalLink);
  formData.append("address", payload.address);
  formData.append("venue", payload.venue);
  if (payload.coverImage) {
    formData.append("coverImage", payload.coverImage);
  }

  const result = await apiRequest<any>(API_ENDPOINTS.events.create, {
    method: "POST",
    body: formData,
  });

  return {
    status: Boolean(result?.status ?? true),
    message: result?.message ?? "Event created successfully",
    data: result?.data ?? { eventId: "" },
  };
}

export async function moderateEvent(
  eventId: string,
  payload: ApproveEventPayload
): Promise<void> {
  await apiRequest(API_ENDPOINTS.backoffice.approveEvent(eventId), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function approveEvent(eventId: string): Promise<void> {
  await moderateEvent(eventId, { action: "approve" });
}

export async function declineEvent(eventId: string, reason?: string): Promise<void> {
  await moderateEvent(eventId, { action: "reject", reason });
}

export async function updateEventVisibility(
  eventId: string,
  visibility: "PUBLIC" | "CONNECTIONS_ONLY"
): Promise<{ status: boolean; message: string; data: { visibility: string } }> {
  return await apiRequest(API_ENDPOINTS.backoffice.updateEventVisibility(eventId), {
    method: "PATCH",
    body: JSON.stringify({ visibility }),
  });
}
