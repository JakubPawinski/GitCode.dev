// GitCode.dev/frontend/interfaces/api-response-interface.ts
import { User } from "./user-interface";

export interface ApiResponse {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: User;
  timestamp: string;
}