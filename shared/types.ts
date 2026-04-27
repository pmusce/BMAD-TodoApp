/**
 * Single source of truth for all domain types shared between client and server.
 * Both workspaces import via the '@shared/types' path alias.
 *
 * Import in client: import type { Task } from '@shared/types'
 * Import in server: import type { Task } from '@shared/types'
 */

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number; // Unix milliseconds — never ISO string
}

export interface CreateTaskPayload {
  text: string;
}

export interface UpdateTaskPayload {
  completed: boolean;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
