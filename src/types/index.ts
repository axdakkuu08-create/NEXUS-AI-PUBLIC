export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type AgentStatus = "idle" | "running" | "success" | "error" | "offline";
export type WorkflowStatus = "draft" | "active" | "paused" | "archived";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  taskCount: number;
  completedTasks: number;
  updatedAt: string;
  tags: string[];
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  projectName: string;
  assignee?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: AgentStatus;
  lastRun?: string;
  runsToday: number;
  successRate: number;
  avatar: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  steps: number;
  lastRun?: string;
  runsTotal: number;
  projectId?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  agentId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messageCount: number;
  projectId?: string;
}

export interface ActivityItem {
  id: string;
  type: "project" | "task" | "agent" | "workflow" | "chat";
  title: string;
  description: string;
  timestamp: string;
  meta?: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}
