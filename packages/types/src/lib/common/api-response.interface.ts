import { PaginationMeta } from './pagination.interface.ts';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  statusCode: number;
  timestamp: string;
  message?: string;
  meta?: PaginationMeta;
  path?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
