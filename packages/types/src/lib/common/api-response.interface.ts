export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  statusCode: number;
  timestamp: string;
  message?: string;
  meta?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  path?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
