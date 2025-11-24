// GitCode.dev/frontend/interfaces/api-response-interface.ts
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  timestamp: string;
}