export type AgentStatus = "online" | "busy" | "offline" | "error";
export type TaskStatus = "pending" | "running" | "completed" | "failed";
export type ConnectionStatus = "connected" | "disconnected" | "pending" | "error";

export interface Project {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  conversationCount?: number;
  taskCount?: number;
}

export interface Conversation {
  id: string;
  title: string;
  projectId?: string;
  updatedAt: string;
  preview?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  streaming?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: AgentStatus;
  lastActiveAt?: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  progress?: number;
  projectId?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
  logPreview?: string;
}

export interface ToolIntegration {
  id: string;
  name: string;
  description: string;
  status: ConnectionStatus;
  permissions?: string[];
}

export interface ActivityItem {
  id: string;
  title: string;
  detail?: string;
  status: "success" | "failure" | "info" | "warning";
  timestamp: string;
  agentName?: string;
}

export interface UserPreferences {
  theme: "dark" | "light" | "system";
  notifications: boolean;
}
