import { AIService } from './ai.service';
import { WhatsAppService } from './whatsapp.service';
import { TaskService } from './task.service';
import { ConversationService } from './conversation.service';
import { 
  WhatsAppMessage, 
  Conversation, 
  AIResponse, 
  Task, 
  HeitorConfig,
  GroupConfig 
} from '@/types';
import { logger, whatsappLogger, taskLogger } from '@/utils/logger';
import * as cron from 'node-cron';
import moment from 'moment';

export class HeitorService {
  private aiService: AIService;
  private whatsappService: WhatsAppService;
  private taskService: TaskService;
  private conversationService: ConversationService;
  private config: HeitorConfig;
  private isRunning: boolean = false;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  constructor(config: HeitorConfig) {
    this.config = config;
    this.aiService = new AIService(config);
    this.whatsappService = new WhatsAppService();
    this.taskService = new TaskService();
    this.conversationService = new ConversationService();
    
    this.initializeScheduledTasks();
  }

  /**
   * Inicializa o Heitor
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('🚀 Inicializando Heitor...');
      
      // Conectar WhatsApp
      await this.whatsappService.connect();
      
      // Configurar listeners
      this.setupMessageListeners();
      this.setupTaskListeners();
      
      // Iniciar tarefas agendadas
      this.startScheduledTasks();
      
      this.isRunning = true;
      logger.info('✅ Heitor inicializado com sucesso!');
      
    } catch (error) {
      logger.error('❌ Erro ao inicializar Heitor:', error);
      throw error;
    }
  }

  /**
   * Configura os listeners de mensagens do WhatsApp
   */
  private setupMessageListeners(): void {
    this.whatsappService.onMessage(async (message: WhatsAppMessage) => {
      try {
        await this.handleIncomingMessage(message);
      } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
      }
    });

    this.whatsappService.onGroupMessage(async (message: WhatsAppMessage) => {
      try {
        await this.handleGroupMessage(message);
      } catch (error) {
        logger.error('Erro ao processar mensagem de grupo:', error);
      }
    });
  }

  /**
   * Configura os listeners de tarefas
   */
  private setupTaskListeners(): void {
    this.taskService.onTaskCreated(async (task: Task) => {
      try {
        await this.handleTaskCreated(task);
      } catch (error) {
        taskLogger.error('Erro ao processar tarefa criada:', error);
      }
    });

    this.taskService.onTaskCompleted(async (task: Task) => {
      try {
        await this.handleTaskCompleted(task);
      } catch (error) {
        taskLogger.error('Erro ao processar tarefa completada:', error);
      }
    });
  }

  /**
   * Processa mensagens privadas
   */
  private async handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
    whatsappLogger.info('Processando mensagem privada', {
      from: message.from,
      message: message.body.substring(0, 50)
    });

    // Verificar se é o Andrey (dono)
    if (message.from === this.config.ownerPhone) {
      await this.handleOwnerMessage(message);
      return;
    }

    // Processar mensagem de cliente
    await this.handleClientMessage(message);
  }

  /**
   * Processa mensagens de grupos
   */
  private async handleGroupMessage(message: WhatsAppMessage): Promise<void> {
    whatsappLogger.info('Processando mensagem de grupo', {
      groupId: message.groupId,
      sender: message.senderName,
      message: message.body.substring(0, 50)
    });

    // Verificar se deve responder automaticamente
    if (this.shouldAutoRespond(message)) {
      await this.handleGroupAutoResponse(message);
      return;
    }

    // Processar pedidos específicos
    if (this.isArtRequest(message.body) || this.isPromotionRequest(message.body)) {
      await this.handleGroupRequest(message);
    }
  }

  /**
   * Processa mensagens do Andrey (dono)
   */
  private async handleOwnerMessage(message: WhatsAppMessage): Promise<void> {
    const command = this.parseOwnerCommand(message.body);
    
    switch (command.type) {
      case 'send_message':
        await this.sendMessageToGroup(command.groupId, command.message);
        break;
      
      case 'create_task':
        await this.taskService.createTask({
          title: command.title,
          description: command.description,
          clientPhone: command.clientPhone,
          priority: command.priority || 'medium',
          dueDate: command.dueDate
        });
        break;
      
      case 'get_report':
        await this.sendReportToOwner();
        break;
      
      case 'marketing_tip':
        const tip = await this.aiService.generateMarketingTip();
        await this.whatsappService.sendMessage(this.config.ownerPhone, tip);
        break;
      
      default:
        await this.sendMessageToOwner("Comando não reconhecido. Use: /ajuda para ver os comandos disponíveis.");
    }
  }

  /**
   * Processa mensagens de clientes
   */
  private async handleClientMessage(message: WhatsAppMessage): Promise<void> {
    // Buscar ou criar conversa
    let conversation = await this.conversationService.getConversation(message.from);
    if (!conversation) {
      conversation = await this.conversationService.createConversation(message.from);
    }

    // Gerar resposta com IA
    const aiResponse = await this.aiService.generateResponse(
      message.body,
      conversation,
      false
    );

    // Enviar resposta
    await this.whatsappService.sendMessage(message.from, aiResponse.text);

    // Atualizar conversa
    await this.conversationService.updateConversation(conversation.id, {
      lastActivity: new Date(),
      messages: [...conversation.messages, message]
    });

    // Processar ações sugeridas
    await this.processSuggestedActions(aiResponse, conversation);
  }

  /**
   * Processa respostas automáticas em grupos
   */
  private async handleGroupAutoResponse(message: WhatsAppMessage): Promise<void> {
    const hour = moment().hour();
    let response = '';

    // Cumprimentos automáticos
    if (hour >= 5 && hour < 12) {
      response = "Bom dia, galera! 👋 Como tá o movimento hoje?";
    } else if (hour >= 12 && hour < 18) {
      response = "Boa tarde, pessoal! 😊 Alguém precisando de algo?";
    } else {
      response = "Boa noite, galera! 🌙 Como foi o dia de vocês?";
    }

    // Adicionar dica de marketing ocasionalmente
    if (Math.random() < 0.3) {
      const tip = await this.aiService.generateMarketingTip();
      response += `\n\n${tip}`;
    }

    await this.whatsappService.sendMessage(message.groupId!, response);
  }

  /**
   * Processa pedidos em grupos
   */
  private async handleGroupRequest(message: WhatsAppMessage): Promise<void> {
    const conversation = await this.conversationService.getConversation(message.from);
    
    const aiResponse = await this.aiService.generateResponse(
      message.body,
      conversation || await this.conversationService.createConversation(message.from),
      true
    );

    await this.whatsappService.sendMessage(message.groupId!, aiResponse.text);
  }

  /**
   * Verifica se deve responder automaticamente
   */
  private shouldAutoRespond(message: WhatsAppMessage): boolean {
    const now = moment();
    const lastMessage = this.getLastMessageTime(message.groupId!);
    
    // Responder apenas se passou mais de 30 minutos desde a última mensagem
    return now.diff(lastMessage, 'minutes') > 30;
  }

  /**
   * Verifica se é pedido de arte
   */
  private isArtRequest(message: string): boolean {
    const artKeywords = ['arte', 'design', 'layout', 'banner', 'logo', 'imagem'];
    return artKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  /**
   * Verifica se é pedido de promoção
   */
  private isPromotionRequest(message: string): boolean {
    const promoKeywords = ['promoção', 'campanha', 'marketing', 'publicidade', 'anúncio'];
    return promoKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  /**
   * Processa ações sugeridas pela IA
   */
  private async processSuggestedActions(aiResponse: AIResponse, conversation: Conversation): Promise<void> {
    for (const action of aiResponse.suggestedActions) {
      switch (action) {
        case 'create_content':
          await this.createContentTask(conversation);
          break;
        
        case 'set_reminder':
          await this.setReminder(conversation);
          break;
        
        case 'ask_question':
          await this.askFollowUpQuestion(conversation);
          break;
      }
    }
  }

  /**
   * Cria tarefa de conteúdo
   */
  private async createContentTask(conversation: Conversation): Promise<void> {
    const task: Partial<Task> = {
      title: `Criar conteúdo para ${conversation.context.clientName || 'Cliente'}`,
      description: `Solicitação de conteúdo baseada na conversa`,
      clientPhone: conversation.phoneNumber,
      clientName: conversation.context.clientName,
      priority: 'medium',
      tags: ['conteudo', 'marketing']
    };

    await this.taskService.createTask(task as Task);
  }

  /**
   * Define lembrete
   */
  private async setReminder(conversation: Conversation): Promise<void> {
    // Implementar sistema de lembretes
    logger.info('Lembrete definido para conversa', { conversationId: conversation.id });
  }

  /**
   * Faz pergunta de acompanhamento
   */
  private async askFollowUpQuestion(conversation: Conversation): Promise<void> {
    const question = await this.aiService.generateEngagementQuestion();
    await this.whatsappService.sendMessage(conversation.phoneNumber, question);
  }

  /**
   * Processa tarefa criada
   */
  private async handleTaskCreated(task: Task): Promise<void> {
    // Notificar Andrey sobre nova tarefa
    const message = `📋 Nova tarefa criada!\n\nTítulo: ${task.title}\nCliente: ${task.clientName || 'N/A'}\nPrioridade: ${task.priority}\nPrazo: ${task.dueDate ? moment(task.dueDate).format('DD/MM/YYYY') : 'Não definido'}`;
    
    await this.whatsappService.sendMessage(this.config.ownerPhone, message);
  }

  /**
   * Processa tarefa completada
   */
  private async handleTaskCompleted(task: Task): Promise<void> {
    // Notificar cliente sobre conclusão
    if (task.clientPhone) {
      const message = `✅ Sua solicitação foi concluída!\n\nTarefa: ${task.title}\n\nEm breve entraremos em contato com o resultado. Obrigado pela confiança! 😊`;
      await this.whatsappService.sendMessage(task.clientPhone, message);
    }

    // Notificar Andrey
    const ownerMessage = `✅ Tarefa concluída!\n\nTítulo: ${task.title}\nCliente: ${task.clientName || 'N/A'}\nConcluída em: ${moment().format('DD/MM/YYYY HH:mm')}`;
    await this.whatsappService.sendMessage(this.config.ownerPhone, ownerMessage);
  }

  /**
   * Envia mensagem para grupo
   */
  private async sendMessageToGroup(groupId: string, message: string): Promise<void> {
    await this.whatsappService.sendMessage(groupId, message);
  }

  /**
   * Envia mensagem para o dono
   */
  private async sendMessageToOwner(message: string): Promise<void> {
    await this.whatsappService.sendMessage(this.config.ownerPhone, message);
  }

  /**
   * Envia relatório para o dono
   */
  private async sendReportToOwner(): Promise<void> {
    const report = await this.generateDailyReport();
    await this.sendMessageToOwner(report);
  }

  /**
   * Gera relatório diário
   */
  private async generateDailyReport(): Promise<string> {
    const today = moment().startOf('day');
    const tasks = await this.taskService.getTasksByDate(today.toDate());
    const conversations = await this.conversationService.getConversationsByDate(today.toDate());

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const activeConversations = conversations.length;

    return `📊 Relatório Diário - ${today.format('DD/MM/YYYY')}\n\n` +
           `✅ Tarefas concluídas: ${completedTasks}\n` +
           `⏳ Tarefas pendentes: ${pendingTasks}\n` +
           `💬 Conversas ativas: ${activeConversations}\n\n` +
           `🎯 Meta do dia: ${completedTasks >= 5 ? '✅ Atingida' : '❌ Em andamento'}`;
  }

  /**
   * Inicializa tarefas agendadas
   */
  private initializeScheduledTasks(): void {
    // Lembretes diários às 9h
    this.scheduledTasks.set('daily_reminders', cron.schedule('0 9 * * *', async () => {
      await this.sendDailyReminders();
    }));

    // Dicas de marketing às 15h
    this.scheduledTasks.set('marketing_tips', cron.schedule('0 15 * * *', async () => {
      await this.sendMarketingTips();
    }));

    // Relatório semanal aos domingos às 18h
    this.scheduledTasks.set('weekly_report', cron.schedule('0 18 * * 0', async () => {
      await this.sendWeeklyReport();
    }));
  }

  /**
   * Inicia tarefas agendadas
   */
  private startScheduledTasks(): void {
    this.scheduledTasks.forEach((task, name) => {
      task.start();
      logger.info(`Tarefa agendada iniciada: ${name}`);
    });
  }

  /**
   * Envia lembretes diários
   */
  private async sendDailyReminders(): Promise<void> {
    const pendingTasks = await this.taskService.getPendingTasks();
    
    if (pendingTasks.length > 0) {
      const message = `📋 Lembretes do dia:\n\n${pendingTasks.map(task => 
        `• ${task.title} (${task.priority})`
      ).join('\n')}\n\nBora fazer acontecer! 💪`;
      
      await this.sendMessageToOwner(message);
    }
  }

  /**
   * Envia dicas de marketing
   */
  private async sendMarketingTips(): Promise<void> {
    const tip = await this.aiService.generateMarketingTip();
    await this.sendMessageToOwner(`💡 Dica do dia:\n\n${tip}`);
  }

  /**
   * Envia relatório semanal
   */
  private async sendWeeklyReport(): Promise<void> {
    const report = await this.generateWeeklyReport();
    await this.sendMessageToOwner(report);
  }

  /**
   * Gera relatório semanal
   */
  private async generateWeeklyReport(): Promise<string> {
    const weekStart = moment().startOf('week');
    const weekEnd = moment().endOf('week');
    
    const tasks = await this.taskService.getTasksByDateRange(weekStart.toDate(), weekEnd.toDate());
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    
    return `📈 Relatório Semanal - ${weekStart.format('DD/MM')} a ${weekEnd.format('DD/MM')}\n\n` +
           `✅ Tarefas concluídas: ${completedTasks}/${totalTasks}\n` +
           `📊 Taxa de conclusão: ${totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}%\n\n` +
           `🎯 Performance: ${completedTasks >= 20 ? 'Excelente' : completedTasks >= 15 ? 'Boa' : 'Pode melhorar'}`;
  }

  /**
   * Para o Heitor
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    
    // Parar tarefas agendadas
    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      logger.info(`Tarefa agendada parada: ${name}`);
    });

    // Desconectar WhatsApp
    await this.whatsappService.disconnect();
    
    logger.info('🛑 Heitor parado');
  }

  /**
   * Verifica se está rodando
   */
  public isRunningStatus(): boolean {
    return this.isRunning;
  }

  // Métodos auxiliares
  private parseOwnerCommand(message: string): any {
    // Implementar parser de comandos
    return { type: 'unknown' };
  }

  private getLastMessageTime(groupId: string): moment.Moment {
    // Implementar cache de última mensagem
    return moment().subtract(1, 'hour');
  }
} 