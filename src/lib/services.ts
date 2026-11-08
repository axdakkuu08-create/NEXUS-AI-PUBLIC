/**
 * Service interfaces for future Convex integration.
 * M1: stubs only — return empty / throw "not connected".
 * Do not fake successful backend operations.
 *
 * Convex URL (M2): https://shocking-salamander-814.convex.cloud/
 */

import type {
  Project,
  Conversation,
  Message,
  Agent,
  Task,
  ToolIntegration,
  ActivityItem,
  UserPreferences,
} from "./types";

const NOT_CONNECTED = "Backend not connected. Convex integration is planned for M2.";

export const projectsService = {
  async list(): Promise<Project[]> {
    throw new Error(NOT_CONNECTED);
  },
  async create(_input: { name: string; description?: string }): Promise<Project> {
    throw new Error(NOT_CONNECTED);
  },
};

export const conversationsService = {
  async list(_projectId?: string): Promise<Conversation[]> {
    throw new Error(NOT_CONNECTED);
  },
  async getMessages(_conversationId: string): Promise<Message[]> {
    throw new Error(NOT_CONNECTED);
  },
  async sendMessage(
    _conversationId: string,
    _content: string
  ): Promise<Message> {
    throw new Error(NOT_CONNECTED);
  },
};

export const agentsService = {
  async list(): Promise<Agent[]> {
    throw new Error(NOT_CONNECTED);
  },
};

export const tasksService = {
  async list(): Promise<Task[]> {
    throw new Error(NOT_CONNECTED);
  },
};

export const toolsService = {
  async list(): Promise<ToolIntegration[]> {
    throw new Error(NOT_CONNECTED);
  },
};

export const activityService = {
  async list(): Promise<ActivityItem[]> {
    throw new Error(NOT_CONNECTED);
  },
};

export const preferencesService = {
  async get(): Promise<UserPreferences> {
    return { theme: "dark", notifications: true };
  },
  async update(_prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    throw new Error(NOT_CONNECTED);
  },
};
