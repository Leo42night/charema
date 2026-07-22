import user_to_nim from "../data/user_to_nim.json";
export const userToNim = user_to_nim as Record<string, string>;
export const TARGET_TAGS = 20;
export const TARGET_KRITIK = 4;
export interface HealthCheck {
  version: string;
  status: string;
  database: {
    status: string;
    message: string;
  };
  uptime: string;
  responseTime: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}