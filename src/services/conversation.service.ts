import mongoose from 'mongoose';
import { Conversation, ConversationContext, WhatsAppMessage, ClientPreferences } from '@/types';
import { logger, taskLogger } from '@/utils/logger';
import moment from 'moment';

// Schema do MongoDB para Conversation
const ConversationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  isGroup: { type: Boolean, default: false },
  groupId: { type: String },
  groupName: { type: String },
  messages: [{
    id: String,
    from: String,
    to: String,
    body: String,
    timestamp: Date,
    type: String,
    isGroup: Boolean,
    groupId: String,
    senderName: String,
    quotedMessage: String
  }],
  lastActivity: { type: Date, default: Date.now },
  context: {
    clientName: String,
    businessType: String,
    preferences: {
      preferredColors: [String],
      preferredStyle: String,
      businessHours: String,
      targetAudience: String,
      socialMediaPlatforms: [String]
    },
    lastRequest: String,
    pendingTasks: [{
      id: String,
      title: String,
      description: String,
      priority: String,
      status: String,
      dueDate: Date
    }],
    conversationHistory: [String],
    currentTopic: String,
    topicStartTime: Date,
    topicMessages: [String],
    emotionalState: String,
    urgency: String,
    lastIntent: String,
    conversationFlow: [{
      timestamp: Date,
      intent: String,
      confidence: Number,
      response: String,
      entities: mongoose.Schema.Types.Mixed
    }],
    contextWindow: [{
      message: String,
      timestamp: Date,
      importance: Number // 1-10, onde 10 é muito importante
    }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices para otimização
ConversationSchema.index({ phoneNumber: 1 }, { unique: true });
ConversationSchema.index({ lastActivity: -1 });
ConversationSchema.index({ isGroup: 1 });
ConversationSchema.index({ 'context.currentTopic': 1 });

const ConversationModel = mongoose.model('Conversation', ConversationSchema);

export class ConversationService {
  private maxContextWindow = 20; // Máximo de mensagens no contexto
  private maxHistoryLength = 50; // Máximo de mensagens no histórico
  private topicTimeoutMinutes = 30; // Tempo para considerar novo tópico

  /**
   * Busca ou cria uma conversa
   */
  public async getConversation(phoneNumber: string): Promise<Conversation | null> {
    try {
      const conversation = await ConversationModel.findOne({ phoneNumber });
      return conversation ? this.mapToConversation(conversation) : null;
    } catch (error) {
      logger.error('Erro ao buscar conversa:', error);
      return null;
    }
  }

  /**
   * Cria uma nova conversa
   */
  public async createConversation(phoneNumber: string, isGroup: boolean = false, groupId?: string, groupName?: string): Promise<Conversation> {
    try {
      const conversation = new ConversationModel({
        id: this.generateId(),
        phoneNumber,
        isGroup,
        groupId,
        groupName,
        context: {
          conversationHistory: [],
          currentTopic: '',
          topicStartTime: new Date(),
          topicMessages: [],
          emotionalState: 'neutral',
          urgency: 'normal',
          lastIntent: '',
          conversationFlow: [],
          contextWindow: []
        }
      });

      await conversation.save();
      logger.info('Nova conversa criada', { phoneNumber, isGroup });
      return this.mapToConversation(conversation);
    } catch (error) {
      logger.error('Erro ao criar conversa:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma conversa com nova mensagem e contexto
   */
  public async updateConversation(
    conversationId: string, 
    message: WhatsAppMessage, 
    aiResponse?: any
  ): Promise<Conversation> {
    try {
      const conversation = await ConversationModel.findOne({ id: conversationId });
      if (!conversation) {
        throw new Error('Conversa não encontrada');
      }

      // Adicionar mensagem ao histórico
      conversation.messages.push({
        id: message.id,
        from: message.from,
        to: message.to,
        body: message.body,
        timestamp: message.timestamp,
        type: message.type,
        isGroup: message.isGroup,
        groupId: message.groupId,
        senderName: message.senderName,
        quotedMessage: message.quotedMessage
      });

      // Limitar tamanho do histórico
      if (conversation.messages.length > this.maxHistoryLength) {
        conversation.messages = conversation.messages.slice(-this.maxHistoryLength);
      }

      // Atualizar contexto da conversa
      await this.updateConversationContext(conversation, message, aiResponse);

      // Atualizar timestamp
      conversation.lastActivity = new Date();
      conversation.updatedAt = new Date();

      await conversation.save();
      return this.mapToConversation(conversation);
    } catch (error) {
      logger.error('Erro ao atualizar conversa:', error);
      throw error;
    }
  }

  /**
   * Atualiza o contexto da conversa com inteligência
   */
  private async updateConversationContext(
    conversation: any, 
    message: WhatsAppMessage, 
    aiResponse?: any
  ): Promise<void> {
    const context = conversation.context;
    const now = new Date();

    // Detectar intenção da mensagem
    const intent = this.detectIntent(message.body);
    const entities = this.extractEntities(message.body);
    const emotionalState = this.analyzeEmotionalState(message.body);

    // Atualizar estado emocional
    context.emotionalState = emotionalState;

    // Verificar se é um novo tópico
    const isNewTopic = this.isNewTopic(context, message.body, intent);
    
    if (isNewTopic) {
      // Finalizar tópico anterior
      if (context.currentTopic) {
        await this.finalizeTopic(context);
      }
      
      // Iniciar novo tópico
      context.currentTopic = this.extractTopic(message.body, intent);
      context.topicStartTime = now;
      context.topicMessages = [message.body];
    } else {
      // Continuar tópico atual
      context.topicMessages.push(message.body);
    }

    // Atualizar janela de contexto
    this.updateContextWindow(context, message.body, intent, aiResponse);

    // Atualizar fluxo da conversa
    context.conversationFlow.push({
      timestamp: now,
      intent,
      confidence: aiResponse?.confidence || 0.8,
      response: aiResponse?.text || '',
      entities
    });

    // Manter apenas os últimos 10 fluxos
    if (context.conversationFlow.length > 10) {
      context.conversationFlow = context.conversationFlow.slice(-10);
    }

    // Atualizar última intenção
    context.lastIntent = intent;

    // Detectar urgência
    context.urgency = this.detectUrgency(message.body, context);

    // Atualizar histórico de conversa
    context.conversationHistory.push(`${message.from}: ${message.body}`);
    if (aiResponse?.text) {
      context.conversationHistory.push(`Heitor: ${aiResponse.text}`);
    }

    // Limitar histórico
    if (context.conversationHistory.length > 20) {
      context.conversationHistory = context.conversationHistory.slice(-20);
    }

    // Extrair informações do cliente
    await this.extractClientInfo(context, message.body, intent);
  }

  /**
   * Atualiza a janela de contexto com inteligência
   */
  private updateContextWindow(
    context: any, 
    message: string, 
    intent: string, 
    aiResponse?: any
  ): void {
    const importance = this.calculateMessageImportance(message, intent, context);
    
    context.contextWindow.push({
      message,
      timestamp: new Date(),
      importance
    });

    // Manter apenas as mensagens mais importantes
    context.contextWindow.sort((a: any, b: any) => b.importance - a.importance);
    context.contextWindow = context.contextWindow.slice(0, this.maxContextWindow);
  }

  /**
   * Calcula a importância de uma mensagem
   */
  private calculateMessageImportance(message: string, intent: string, context: any): number {
    let importance = 5; // Base

    // Intenções importantes
    if (['art_request', 'promotion_request', 'urgent_request'].includes(intent)) {
      importance += 3;
    }

    // Palavras-chave importantes
    const importantKeywords = ['urgente', 'hoje', 'agora', 'importante', 'preciso', 'necessito'];
    if (importantKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      importance += 2;
    }

    // Mensagens com perguntas
    if (message.includes('?')) {
      importance += 1;
    }

    // Mensagens longas (mais contexto)
    if (message.length > 100) {
      importance += 1;
    }

    // Mensagens com emojis (mais expressivas)
    const emojiCount = (message.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    importance += Math.min(emojiCount, 2);

    return Math.min(importance, 10);
  }

  /**
   * Verifica se é um novo tópico
   */
  private isNewTopic(context: any, message: string, intent: string): boolean {
    const now = moment();
    const topicStart = moment(context.topicStartTime);
    const timeDiff = now.diff(topicStart, 'minutes');

    // Se passou muito tempo, é novo tópico
    if (timeDiff > this.topicTimeoutMinutes) {
      return true;
    }

    // Se a intenção mudou drasticamente
    const intentChanges = {
      'greeting': ['art_request', 'promotion_request', 'complaint'],
      'art_request': ['greeting', 'promotion_request', 'complaint'],
      'promotion_request': ['greeting', 'art_request', 'complaint'],
      'complaint': ['greeting', 'art_request', 'promotion_request']
    };

    if (context.lastIntent && intentChanges[context.lastIntent as keyof typeof intentChanges]?.includes(intent)) {
      return true;
    }

    // Se há palavras que indicam mudança de assunto
    const topicChangeWords = ['outra coisa', 'mudando de assunto', 'agora sobre', 'falando nisso', 'por falar nisso'];
    if (topicChangeWords.some(word => message.toLowerCase().includes(word))) {
      return true;
    }

    return false;
  }

  /**
   * Extrai o tópico da mensagem
   */
  private extractTopic(message: string, intent: string): string {
    const topics = {
      'greeting': 'Saudação',
      'art_request': 'Solicitação de Arte',
      'promotion_request': 'Solicitação de Promoção',
      'complaint': 'Reclamação',
      'question': 'Pergunta',
      'thank_you': 'Agradecimento',
      'goodbye': 'Despedida'
    };

    return topics[intent as keyof typeof topics] || 'Conversa Geral';
  }

  /**
   * Finaliza um tópico
   */
  private async finalizeTopic(context: any): Promise<void> {
    // Aqui você pode implementar lógica para salvar resumo do tópico
    // ou gerar insights sobre a conversa
    logger.info('Tópico finalizado', { 
      topic: context.currentTopic, 
      messageCount: context.topicMessages.length 
    });
  }

  /**
   * Detecta a intenção da mensagem
   */
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde') || lowerMessage.includes('boa noite')) {
      return 'greeting';
    }
    
    if (lowerMessage.includes('arte') || lowerMessage.includes('design') || lowerMessage.includes('layout') || lowerMessage.includes('banner')) {
      return 'art_request';
    }
    
    if (lowerMessage.includes('promoção') || lowerMessage.includes('campanha') || lowerMessage.includes('marketing')) {
      return 'promotion_request';
    }
    
    if (lowerMessage.includes('problema') || lowerMessage.includes('erro') || lowerMessage.includes('não funcionou')) {
      return 'complaint';
    }
    
    if (lowerMessage.includes('obrigado') || lowerMessage.includes('valeu') || lowerMessage.includes('thanks')) {
      return 'thank_you';
    }
    
    if (lowerMessage.includes('tchau') || lowerMessage.includes('até') || lowerMessage.includes('bye')) {
      return 'goodbye';
    }
    
    if (lowerMessage.includes('?') || lowerMessage.includes('como') || lowerMessage.includes('quando') || lowerMessage.includes('onde')) {
      return 'question';
    }
    
    return 'general';
  }

  /**
   * Extrai entidades da mensagem
   */
  private extractEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Cores
    const colors = ['azul', 'vermelho', 'verde', 'amarelo', 'rosa', 'roxo', 'laranja', 'preto', 'branco'];
    const foundColors = colors.filter(color => message.toLowerCase().includes(color));
    if (foundColors.length > 0) {
      entities.colors = foundColors;
    }
    
    // Datas
    const dateRegex = /(\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|hoje|amanhã|próxima semana)/gi;
    const dates = message.match(dateRegex);
    if (dates) {
      entities.dates = dates;
    }
    
    // Tamanhos
    const sizeRegex = /(\d+x\d+|\d+\s*cm|\d+\s*px)/gi;
    const sizes = message.match(sizeRegex);
    if (sizes) {
      entities.sizes = sizes;
    }
    
    // Produtos/serviços
    const productKeywords = ['logo', 'banner', 'post', 'flyer', 'cartão', 'site', 'landing page'];
    const foundProducts = productKeywords.filter(product => message.toLowerCase().includes(product));
    if (foundProducts.length > 0) {
      entities.products = foundProducts;
    }
    
    return entities;
  }

  /**
   * Analisa o estado emocional
   */
  private analyzeEmotionalState(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Emojis positivos
    const positiveEmojis = ['😊', '😄', '😃', '😁', '😆', '😍', '🥰', '😘', '👍', '❤️', '💕', '💖'];
    const positiveWords = ['ótimo', 'excelente', 'maravilhoso', 'perfeito', 'adorei', 'gostei', 'show'];
    
    // Emojis negativos
    const negativeEmojis = ['😞', '😔', '😟', '😕', '😣', '😖', '😫', '😩', '😤', '😠', '😡', '💔'];
    const negativeWords = ['ruim', 'péssimo', 'horrível', 'não gostei', 'problema', 'erro', 'frustrado'];
    
    // Emojis urgentes
    const urgentEmojis = ['😰', '😨', '😱', '😳', '😵', '🤯', '💥', '🚨', '⚡'];
    const urgentWords = ['urgente', 'agora', 'hoje', 'preciso', 'necessito', 'importante'];
    
    const hasPositive = positiveEmojis.some(emoji => message.includes(emoji)) || 
                       positiveWords.some(word => lowerMessage.includes(word));
    const hasNegative = negativeEmojis.some(emoji => message.includes(emoji)) || 
                       negativeWords.some(word => lowerMessage.includes(word));
    const hasUrgent = urgentEmojis.some(emoji => message.includes(emoji)) || 
                     urgentWords.some(word => lowerMessage.includes(word));
    
    if (hasUrgent) return 'urgent';
    if (hasPositive) return 'positive';
    if (hasNegative) return 'negative';
    return 'neutral';
  }

  /**
   * Detecta urgência
   */
  private detectUrgency(message: string, context: any): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('urgente') || lowerMessage.includes('agora') || lowerMessage.includes('hoje')) {
      return 'high';
    }
    
    if (lowerMessage.includes('amanhã') || lowerMessage.includes('próxima semana')) {
      return 'medium';
    }
    
    return 'normal';
  }

  /**
   * Extrai informações do cliente
   */
  private async extractClientInfo(context: any, message: string, intent: string): Promise<void> {
    // Extrair nome do cliente (se mencionado)
    const nameMatch = message.match(/me chamo\s+(\w+)|sou\s+(\w+)|nome\s+(\w+)/i);
    if (nameMatch && !context.clientName) {
      context.clientName = nameMatch[1] || nameMatch[2] || nameMatch[3];
    }
    
    // Extrair tipo de negócio
    const businessTypes = ['restaurante', 'loja', 'consultório', 'empresa', 'startup', 'freelancer'];
    const foundBusinessType = businessTypes.find(type => message.toLowerCase().includes(type));
    if (foundBusinessType && !context.businessType) {
      context.businessType = foundBusinessType;
    }
    
    // Extrair preferências de cores
    const colors = ['azul', 'vermelho', 'verde', 'amarelo', 'rosa', 'roxo', 'laranja'];
    const foundColors = colors.filter(color => message.toLowerCase().includes(color));
    if (foundColors.length > 0) {
      if (!context.preferences) context.preferences = {};
      if (!context.preferences.preferredColors) context.preferences.preferredColors = [];
      context.preferences.preferredColors.push(...foundColors);
      context.preferences.preferredColors = [...new Set(context.preferences.preferredColors)];
    }
  }

  /**
   * Busca conversas por data
   */
  public async getConversationsByDate(date: Date): Promise<Conversation[]> {
    try {
      const startOfDay = moment(date).startOf('day').toDate();
      const endOfDay = moment(date).endOf('day').toDate();
      
      const conversations = await ConversationModel.find({
        lastActivity: { $gte: startOfDay, $lte: endOfDay }
      });
      
      return conversations.map(conv => this.mapToConversation(conv));
    } catch (error) {
      logger.error('Erro ao buscar conversas por data:', error);
      return [];
    }
  }

  /**
   * Gera resumo do contexto para IA
   */
  public generateContextSummary(conversation: Conversation): string {
    const context = conversation.context;
    let summary = '';
    
    // Informações básicas
    if (context.clientName) {
      summary += `Cliente: ${context.clientName}\n`;
    }
    
    if (context.businessType) {
      summary += `Tipo de negócio: ${context.businessType}\n`;
    }
    
    // Tópico atual
    if (context.currentTopic) {
      summary += `Tópico atual: ${context.currentTopic}\n`;
      summary += `Mensagens no tópico: ${context.topicMessages.length}\n`;
    }
    
    // Estado emocional
    summary += `Estado emocional: ${context.emotionalState}\n`;
    summary += `Urgência: ${context.urgency}\n`;
    
    // Última intenção
    if (context.lastIntent) {
      summary += `Última intenção: ${context.lastIntent}\n`;
    }
    
    // Preferências
    if (context.preferences?.preferredColors?.length > 0) {
      summary += `Cores preferidas: ${context.preferences.preferredColors.join(', ')}\n`;
    }
    
    // Contexto recente (mensagens importantes)
    if (context.contextWindow.length > 0) {
      summary += '\nContexto recente:\n';
      context.contextWindow
        .filter((item: any) => item.importance >= 7)
        .slice(-5)
        .forEach((item: any) => {
          summary += `- ${item.message}\n`;
        });
    }
    
    // Fluxo da conversa
    if (context.conversationFlow.length > 0) {
      summary += '\nFluxo da conversa:\n';
      context.conversationFlow.slice(-3).forEach((flow: any) => {
        summary += `${flow.intent} (${flow.confidence.toFixed(2)}) -> ${flow.response.substring(0, 50)}...\n`;
      });
    }
    
    return summary;
  }

  /**
   * Mapeia documento do MongoDB para interface
   */
  private mapToConversation(doc: any): Conversation {
    return {
      id: doc.id,
      phoneNumber: doc.phoneNumber,
      isGroup: doc.isGroup,
      groupId: doc.groupId,
      groupName: doc.groupName,
      messages: doc.messages,
      lastActivity: doc.lastActivity,
      context: doc.context,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  /**
   * Gera ID único
   */
  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 