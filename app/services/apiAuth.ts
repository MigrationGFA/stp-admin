import { apiRequest, type ApiEnvelope } from "./apiClient";
import { API_ENDPOINTS } from "./endpoints";

export interface LoginPayload {
  emailAddress: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email?: string;
  emailAddress?: string;
  password: string;
  role?: string;
  is_onboarded?: boolean | string | number;
  password_change_required?: boolean | string | number;
  isOnboarded?: boolean | string | number;
  passwordChangeRequired?: boolean | string | number;
}

export interface ForgotPasswordPayload {
  email?: string;
  emailAddress?: string;
}

export interface ResetPasswordPayload {
  token: string;
  password?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface VerifyResetTokenPayload {
  token: string;
}

export interface LoginData {
  token: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  email: string;
  name: string;
  role: string;
  isOnboarded: boolean;
  passwordChangeRequired: boolean;
}

export type AuthActionResponse = ApiEnvelope<Record<string, unknown> | null>;
export type LoginResponse = ApiEnvelope<LoginData>;

function mapEmail(email?: string, emailAddress?: string): string {
  return (email ?? emailAddress ?? "").trim();
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const result = await apiRequest<LoginResponse>(API_ENDPOINTS.auth.login, {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });

  if (result?.data?.token) {
    localStorage.setItem("stp_token", result.data.token);
    localStorage.setItem("stp_user_name", result.data.name);
    localStorage.setItem("stp_user_email", result.data.email);
    localStorage.setItem("stp_user_role", result.data.role);
  }

  return result;
}

export async function register(payload: RegisterPayload): Promise<AuthActionResponse> {
  const emailAddress = mapEmail(payload.email, payload.emailAddress);

  return apiRequest<AuthActionResponse>(API_ENDPOINTS.auth.register, {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      ...payload,
      email: emailAddress,
      emailAddress,
      role: payload.role || "MODERATOR_ADMIN",
      is_onboarded: payload.is_onboarded ?? payload.isOnboarded ?? true,
      password_change_required:
        payload.password_change_required ?? payload.passwordChangeRequired ?? true,
    }),
  });
}

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<AuthActionResponse> {
  const emailAddress = mapEmail(payload.email, payload.emailAddress);

  return apiRequest<AuthActionResponse>(API_ENDPOINTS.auth.forgotPassword, {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email: emailAddress,
      emailAddress,
    }),
  });
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<AuthActionResponse> {
  const newPassword = payload.newPassword ?? payload.password ?? "";

  return apiRequest<AuthActionResponse>(API_ENDPOINTS.auth.resetPassword, {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      ...payload,
      newPassword,
      password: newPassword,
    }),
  });
}

export async function verifyResetToken(
  payload: VerifyResetTokenPayload
): Promise<AuthActionResponse> {
  return apiRequest<AuthActionResponse>(API_ENDPOINTS.auth.verifyResetToken, {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}
