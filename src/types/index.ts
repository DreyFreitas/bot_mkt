// Tipos principais do sistema Heitor

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
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
  currentTopic: string;
  topicStartTime: Date;
  topicMessages: string[];
  emotionalState: 'positive' | 'negative' | 'neutral' | 'urgent';
  urgency: 'low' | 'normal' | 'high';
  lastIntent: string;
  conversationFlow: ConversationFlow[];
  contextWindow: ContextMessage[];
}

export interface ClientPreferences {
  preferredColors: string[];
  preferredStyle?: string;
  businessHours?: string;
  targetAudience?: string;
  socialMediaPlatforms: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  clientPhone?: string;
  clientName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  completedAt?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIResponse {
  text: string;
  confidence: number;
  intent: string;
  entities: Record<string, any>;
  suggestedActions: string[];
  shouldSendAudio: boolean;
  audioUrl?: string;
}

export interface HeitorConfig {
  name: string;
  ownerPhone: string;
  personality: PersonalityConfig;
  groups: GroupConfig;
  aiProvider: 'openai' | 'anthropic' | 'both';
  maxResponseTime: number; // segundos
  enableAudio: boolean;
  enableAnalytics: boolean;
}

export interface PersonalityConfig {
  tone: 'friendly' | 'professional' | 'casual' | 'enthusiastic';
  useEmojis: boolean;
  useSlang: boolean;
  responseStyle: 'concise' | 'detailed' | 'conversational';
  spontaneityLevel: number; // 1-10
  creativityLevel: number; // 1-10
}

export interface GroupConfig {
  autoRespond: boolean;
  responseInterval: number; // minutos
  allowedKeywords: string[];
  excludedKeywords: string[];
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
  category: 'greeting' | 'promotion' | 'art_request' | 'follow_up' | 'reminder';
  content: string;
  variables: string[];
  isActive: boolean;
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

export interface ConversationFlow {
  timestamp: Date;
  intent: string;
  confidence: number;
  response: string;
  entities: Record<string, any>;
}

export interface ContextMessage {
  message: string;
  timestamp: Date;
  importance: number; // 1-10
}

export interface Report {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalConversations: number;
    totalTasks: number;
    completedTasks: number;
    averageResponseTime: number;
    topTopics: string[];
    clientSatisfaction: number;
  };
  createdAt: Date;
}

export interface SentimentAnalysis {
  score: number; // -1 a 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
  emotions: string[];
}

export interface Notification {
  id: string;
  type: 'task_reminder' | 'message_received' | 'report_ready' | 'system_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  recipient: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface Backup {
  id: string;
  type: 'full' | 'conversations' | 'tasks' | 'config';
  size: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
}

export interface Metrics {
  conversations: {
    total: number;
    active: number;
    newToday: number;
    averageDuration: number;
  };
  tasks: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
  };
  performance: {
    averageResponseTime: number;
    satisfactionScore: number;
    uptime: number;
  };
  clients: {
    total: number;
    active: number;
    newThisWeek: number;
  };
}

export interface SecurityConfig {
  encryptionEnabled: boolean;
  accessControl: {
    requireAuthentication: boolean;
    allowedIPs: string[];
    sessionTimeout: number;
  };
  dataRetention: {
    conversationDays: number;
    taskDays: number;
    logDays: number;
  };
}

export interface Integration {
  id: string;
  name: string;
  type: 'whatsapp' | 'telegram' | 'email' | 'crm' | 'calendar';
  config: Record<string, any>;
  isActive: boolean;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  headers: Record<string, string>;
  isActive: boolean;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId?: string;
  changes: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // segundos
  maxSize: number; // MB
  strategy: 'lru' | 'lfu' | 'fifo';
}

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: {
    cpu: boolean;
    memory: boolean;
    disk: boolean;
    network: boolean;
  };
  alerts: {
    cpuThreshold: number;
    memoryThreshold: number;
    diskThreshold: number;
    responseTimeThreshold: number;
  };
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface DeployConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildNumber: string;
  deployedAt: Date;
  deployedBy: string;
  rollbackVersion?: string;
}

export interface TestResult {
  id: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  timestamp: Date;
}

export interface Documentation {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  version: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Feedback {
  id: string;
  type: 'bug_report' | 'feature_request' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  submittedBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
} 