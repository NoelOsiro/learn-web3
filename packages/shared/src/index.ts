import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

export const decimalSchema = z.string().regex(/^\d+\.?\d*$/, 'Invalid decimal number');

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Date range
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// Money utilities (no floating point)
export function formatMoney(amount: string | number, currency = 'KES'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(num);
}

export function parseMoney(value: string): string {
  return value.replace(/[^0-9.-]/g, '');
}

// Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
