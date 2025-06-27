// Tipos principais do sistema Heitor

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  isGroup: boolean;
  groupId?: string;
  senderName?: string;
  quotedMessage?: string;
}

export interface Conversation {
  id: string;
  phoneNumber: string;
  isGroup: boolean;
  groupId?: string;
  groupName?: string;
  messages: WhatsAppMessage[];
  lastActivity: Date;
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationContext {
  clientName?: string;
  businessType?: string;
  preferences?: ClientPreferences;
  lastRequest?: string;
  pendingTasks?: Task[];
  conversationHistory: string[];
}

export interface ClientPreferences {
  preferredColors?: string[];
  preferredStyle?: 'minimalist' | 'colorful' | 'professional' | 'creative';
  businessHours?: string;
  targetAudience?: string;
  socialMediaPlatforms?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  clientPhone: string;
  clientName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  tags?: string[];
}

export interface AIResponse {
  text: string;
  confidence: number;
  intent: string;
  entities: Record<string, any>;
  suggestedActions?: string[];
  shouldSendAudio?: boolean;
  audioUrl?: string;
}

export interface HeitorConfig {
  name: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  personality: PersonalityConfig;
  aiSettings: AISettings;
  responseSettings: ResponseSettings;
}

export interface PersonalityConfig {
  tone: 'friendly' | 'professional' | 'casual' | 'enthusiastic';
  useEmojis: boolean;
  useSlang: boolean;
  responseStyle: 'short' | 'medium' | 'long';
  spontaneityLevel: number; // 0-10
  creativityLevel: number; // 0-10
}

export interface AISettings {
  provider: 'openai' | 'anthropic' | 'hybrid';
  model: string;
  maxTokens: number;
  temperature: number;
  fallbackProvider?: string;
  contextWindow: number;
}

export interface ResponseSettings {
  minDelay: number;
  maxDelay: number;
  autoGreetings: boolean;
  greetingHours: {
    morning: { start: number; end: number };
    afternoon: { start: number; end: number };
    evening: { start: number; end: number };
  };
  reminderFrequency: 'hourly' | 'daily' | 'weekly';
}

export interface GroupConfig {
  id: string;
  name: string;
  isActive: boolean;
  autoGreetings: boolean;
  marketingTips: boolean;
  engagementQuestions: boolean;
  allowedCommands: string[];
  customResponses?: Record<string, string>;
}

export interface Analytics {
  totalMessages: number;
  totalConversations: number;
  averageResponseTime: number;
  mostActiveHours: number[];
  popularTopics: string[];
  clientSatisfaction: number;
  tasksCompleted: number;
  tasksPending: number;
}

export interface MarketingTip {
  id: string;
  title: string;
  content: string;
  category: 'design' | 'copywriting' | 'strategy' | 'trends' | 'tools';
  tags: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  category: 'greeting' | 'promotion' | 'reminder' | 'followup' | 'custom';
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  isRecurring: boolean;
  recurrencePattern?: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: Record<string, any>;
  timestamp: Date;
  source: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  lastError?: string;
  lastErrorTime?: Date;
}

// Enums
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact'
}

export enum IntentType {
  GREETING = 'greeting',
  ART_REQUEST = 'art_request',
  PROMOTION_REQUEST = 'promotion_request',
  REMINDER = 'reminder',
  QUESTION = 'question',
  COMPLAINT = 'complaint',
  THANK_YOU = 'thank_you',
  GOODBYE = 'goodbye',
  UNKNOWN = 'unknown'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
} 