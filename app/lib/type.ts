export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isOnboarded: string;
  passwordChangeRequired: string;
  isActive: boolean;
  isLocked: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  tempPassword?: string | null;
}

export interface Event {
  eventId: string;
  type: string;
  format: string;
  eventStatus?: "approved" | "pending" | "rejected";
  visibility?: "PUBLIC" | "CONNECTIONS_ONLY";
  name: string;
  timeZone: string;
  startTime: string;
  endTime: string;
  description: string;
  externalLink: string;
  address: string;
  venue: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  coverImageUrl: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  category: string;
  altPhoneNumber: string | null;
  altEmail: string | null;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  requestId: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

