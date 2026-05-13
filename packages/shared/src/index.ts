export interface HealthCheck {
  status: string
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface UserData {
    name: string;
    given_name: string;
    email: string;
    picture: string;
}