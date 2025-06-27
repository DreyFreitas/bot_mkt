import { Task } from '../types';

type TaskCallback = (task: Task) => void;

export class TaskService {
  private onCreated: TaskCallback | null = null;
  private onCompleted: TaskCallback | null = null;

  async createTask(task: Task): Promise<void> {
    console.log('[MOCK] Criando tarefa:', task);
    if (this.onCreated) this.onCreated(task);
  }

  async getTasksByDate(date: Date): Promise<Task[]> {
    console.log('[MOCK] Buscando tarefas por data:', date);
    return [];
  }

  async getTasksByDateRange(start: Date, end: Date): Promise<Task[]> {
    console.log('[MOCK] Buscando tarefas por período:', start, end);
    return [];
  }

  async getPendingTasks(): Promise<Task[]> {
    console.log('[MOCK] Buscando tarefas pendentes');
    return [];
  }

  onTaskCreated(callback: TaskCallback): void {
    this.onCreated = callback;
  }

  onTaskCompleted(callback: TaskCallback): void {
    this.onCompleted = callback;
  }
} 