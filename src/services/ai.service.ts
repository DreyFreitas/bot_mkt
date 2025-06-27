import OpenAI from 'openai';
import { AIResponse, Conversation, HeitorConfig, PersonalityConfig } from '@/types';
import { aiLogger, performanceLogger } from '../utils/logger';
import { ConversationService } from './conversation.service';

export class AIService {
  private openai: OpenAI;
  private config: HeitorConfig;
  private personality: PersonalityConfig;
  private conversationService: ConversationService;

  constructor(config: HeitorConfig) {
    this.config = config;
    this.personality = config.personality;
    this.conversationService = new ConversationService();
    
    // Inicializar OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Gera resposta usando IA baseada no contexto da conversa
   */
  public async generateResponse(
    message: string,
    conversation: Conversation,
    isGroup: boolean = false
  ): Promise<AIResponse> {
    const perf = performanceLogger.start('ai_response_generation');
    
    try {
      aiLogger.info('Gerando resposta para mensagem', {
        message: message.substring(0, 100),
        isGroup,
        conversationId: conversation.id,
        topic: conversation.context.currentTopic,
        emotionalState: conversation.context.emotionalState
      });

      // Gerar resumo do contexto
      const contextSummary = this.conversationService.generateContextSummary(conversation);
      
      const prompt = this.buildPrompt(message, conversation, contextSummary, isGroup);
      const response = await this.callAI(prompt);
      
      const aiResponse: AIResponse = {
        text: response.text,
        confidence: response.confidence || 0.8,
        intent: this.detectIntent(message),
        entities: this.extractEntities(message),
        suggestedActions: response.suggestedActions || [],
        shouldSendAudio: this.shouldSendAudio(),
        audioUrl: undefined
      };

      perf.end({ 
        messageLength: message.length,
        responseLength: response.text.length,
        intent: aiResponse.intent,
        topic: conversation.context.currentTopic
      });

      return aiResponse;

    } catch (error) {
      aiLogger.error('Erro ao gerar resposta de IA', { error, message });
      return this.getFallbackResponse(message, isGroup);
    }
  }

  /**
   * Constrói o prompt para a IA baseado na personalidade do Heitor e contexto
   */
  private buildPrompt(
    message: string,
    conversation: Conversation,
    contextSummary: string,
    isGroup: boolean
  ): string {
    const personality = this.buildPersonalityPrompt();
    const context = this.buildContextPrompt(conversation, contextSummary);
    const conversationHistory = this.buildConversationHistory(conversation);
    
    return `
${personality}

CONTEXTO DA CONVERSA:
${context}

HISTÓRICO RECENTE DA CONVERSA:
${conversationHistory}

MENSAGEM RECEBIDA: "${message}"
TIPO DE CONVERSA: ${isGroup ? 'GRUPO' : 'PRIVADA'}

INSTRUÇÕES IMPORTANTES:
1. Responda como Heitor, um assistente de marketing carismático e humano
2. Use linguagem natural, gírias moderadas e emojis quando apropriado
3. Seja espontâneo e criativo
4. Mantenha o tom ${this.personality.tone}
5. Forneça insights de marketing quando relevante
6. Se for pedido de arte/campanha, peça detalhes específicos
7. Se for grupo, mantenha engajamento com perguntas
8. Se for privado com Andrey, foque em tarefas e lembretes
9. MANTENHA CONTINUIDADE na conversa - não trate como nova conversa
10. REFIRA-SE ao que foi dito anteriormente quando apropriado
11. Use informações do contexto para personalizar a resposta
12. Se o cliente mencionou algo antes, lembre-se e use isso

RESPOSTA DO HEITOR:
`;
  }

  /**
   * Constrói o prompt do contexto da conversa
   */
  private buildContextPrompt(conversation: Conversation, contextSummary: string): string {
    const context = conversation.context;
    let contextStr = contextSummary;

    // Adicionar informações específicas do contexto
    if (context.currentTopic) {
      contextStr += `\nTÓPICO ATUAL: ${context.currentTopic}`;
      contextStr += `\nMensagens neste tópico: ${context.topicMessages.length}`;
    }

    if (context.emotionalState !== 'neutral') {
      contextStr += `\nESTADO EMOCIONAL DO CLIENTE: ${context.emotionalState}`;
    }

    if (context.urgency !== 'normal') {
      contextStr += `\nNÍVEL DE URGÊNCIA: ${context.urgency}`;
    }

    if (context.lastIntent) {
      contextStr += `\nÚLTIMA INTENÇÃO DETECTADA: ${context.lastIntent}`;
    }

    // Adicionar preferências do cliente
    if (context.preferences) {
      const prefs = context.preferences;
      if (prefs.preferredColors && prefs.preferredColors.length > 0) {
        contextStr += `\nCORES PREFERIDAS: ${prefs.preferredColors.join(', ')}`;
      }
      if (prefs.preferredStyle) {
        contextStr += `\nESTILO PREFERIDO: ${prefs.preferredStyle}`;
      }
      if (prefs.targetAudience) {
        contextStr += `\nPÚBLICO-ALVO: ${prefs.targetAudience}`;
      }
    }

    // Adicionar tarefas pendentes
    if (context.pendingTasks && context.pendingTasks.length > 0) {
      contextStr += `\nTAREFAS PENDENTES: ${context.pendingTasks.length}`;
      context.pendingTasks.forEach(task => {
        contextStr += `\n- ${task.title} (${task.priority})`;
      });
    }

    return contextStr;
  }

  /**
   * Constrói o histórico da conversa para contexto
   */
  private buildConversationHistory(conversation: Conversation): string {
    const context = conversation.context;
    let history = '';

    // Usar mensagens importantes da janela de contexto
    if (context.contextWindow && context.contextWindow.length > 0) {
      const importantMessages = context.contextWindow
        .filter((item: any) => item.importance >= 6)
        .slice(-8); // Últimas 8 mensagens importantes

      if (importantMessages.length > 0) {
        history += 'MENSAGENS IMPORTANTES:\n';
        importantMessages.forEach((item: any) => {
          history += `- ${item.message}\n`;
        });
      }
    }

    // Usar fluxo da conversa
    if (context.conversationFlow && context.conversationFlow.length > 0) {
      const recentFlow = context.conversationFlow.slice(-5); // Últimos 5 fluxos
      history += '\nFLUXO RECENTE:\n';
      recentFlow.forEach((flow: any) => {
        history += `${flow.intent} -> ${flow.response.substring(0, 80)}...\n`;
      });
    }

    // Se não há histórico estruturado, usar histórico simples
    if (!history && context.conversationHistory && context.conversationHistory.length > 0) {
      const recentHistory = context.conversationHistory.slice(-10); // Últimas 10 mensagens
      history = 'HISTÓRICO RECENTE:\n' + recentHistory.join('\n');
    }

    return history || 'Nenhum histórico disponível.';
  }

  /**
   * Constrói o prompt da personalidade do Heitor
   */
  private buildPersonalityPrompt(): string {
    const { tone, useEmojis, useSlang, responseStyle, spontaneityLevel, creativityLevel } = this.personality;

    return `
PERSONALIDADE DO HEITOR:
- Formado em Marketing e Propaganda
- Trabalha exclusivamente com Andrey
- Tom: ${tone}
- Usa emojis: ${useEmojis ? 'Sim' : 'Não'}
- Usa gírias: ${useSlang ? 'Sim' : 'Não'}
- Estilo de resposta: ${responseStyle}
- Nível de espontaneidade: ${spontaneityLevel}/10
- Nível de criatividade: ${creativityLevel}/10

CARACTERÍSTICAS:
- Extremamente humano e natural
- Conhecimento profundo em marketing
- Lembra detalhes de conversas anteriores
- Carismático e engajador
- Nunca soa como robô
- Usa expressões como "Show!", "Top demais!", "Partiu?", "Bora fazer sucesso!"
- MANTÉM CONTINUIDADE nas conversas
- REFERE-SE ao que foi dito anteriormente

EXPERTISE EM MARKETING:
- Estratégias de campanha
- Design e layout
- Copywriting criativo
- Tendências de mercado
- Datas comemorativas
- Análise de público-alvo
- Métricas de engajamento

REGRAS DE CONTINUIDADE:
1. SEMPRE lembre do que foi conversado antes
2. Use informações do contexto para personalizar respostas
3. Se o cliente mencionou algo, referencie isso
4. Mantenha o tópico da conversa
5. Não repita perguntas já respondidas
6. Use o nome do cliente se souber
7. Adapte o tom baseado no estado emocional
8. Considere a urgência nas respostas
`;
  }

  /**
   * Chama a IA configurada (apenas OpenAI)
   */
  private async callAI(prompt: string): Promise<{ text: string; confidence?: number; suggestedActions?: string[] }> {
    try {
      return await this.callOpenAI(prompt);
    } catch (error) {
      aiLogger.error('Erro no OpenAI', { error });
      throw error;
    }
  }

  /**
   * Chama OpenAI
   */
  private async callOpenAI(prompt: string): Promise<{ text: string; confidence?: number; suggestedActions?: string[] }> {
    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Você é Heitor, um assistente de marketing especializado e carismático que mantém continuidade nas conversas.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    });

    const text = response.choices[0]?.message?.content || '';
    
    return {
      text: text.trim(),
      confidence: 0.9,
      suggestedActions: this.extractSuggestedActions(text)
    };
  }

  /**
   * Detecta a intenção da mensagem
   */
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde') || lowerMessage.includes('boa noite')) {
      return 'greeting';
    }
    
    if (lowerMessage.includes('arte') || lowerMessage.includes('design') || lowerMessage.includes('layout')) {
      return 'art_request';
    }
    
    if (lowerMessage.includes('promoção') || lowerMessage.includes('campanha') || lowerMessage.includes('marketing')) {
      return 'promotion_request';
    }
    
    if (lowerMessage.includes('lembre') || lowerMessage.includes('lembrar') || lowerMessage.includes('tarefa')) {
      return 'reminder';
    }
    
    if (lowerMessage.includes('obrigado') || lowerMessage.includes('valeu') || lowerMessage.includes('thanks')) {
      return 'thank_you';
    }
    
    if (lowerMessage.includes('tchau') || lowerMessage.includes('até') || lowerMessage.includes('bye')) {
      return 'goodbye';
    }
    
    if (lowerMessage.includes('?') || lowerMessage.includes('como') || lowerMessage.includes('quando')) {
      return 'question';
    }
    
    return 'unknown';
  }

  /**
   * Extrai entidades da mensagem
   */
  private extractEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extrair cores
    const colors = ['azul', 'vermelho', 'verde', 'amarelo', 'rosa', 'roxo', 'laranja', 'preto', 'branco'];
    const foundColors = colors.filter(color => message.toLowerCase().includes(color));
    if (foundColors.length > 0) {
      entities.colors = foundColors;
    }
    
    // Extrair datas
    const dateRegex = /(\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|hoje|amanhã|próxima semana)/gi;
    const dates = message.match(dateRegex);
    if (dates) {
      entities.dates = dates;
    }
    
    // Extrair tamanhos
    const sizeRegex = /(\d+x\d+|\d+\s*cm|\d+\s*px)/gi;
    const sizes = message.match(sizeRegex);
    if (sizes) {
      entities.sizes = sizes;
    }
    
    return entities;
  }

  /**
   * Extrai ações sugeridas do texto da IA
   */
  private extractSuggestedActions(text: string): string[] {
    const actions: string[] = [];
    
    if (text.toLowerCase().includes('criar') || text.toLowerCase().includes('fazer')) {
      actions.push('create_content');
    }
    
    if (text.toLowerCase().includes('lembrar') || text.toLowerCase().includes('lembrete')) {
      actions.push('set_reminder');
    }
    
    if (text.toLowerCase().includes('perguntar') || text.toLowerCase().includes('questionar')) {
      actions.push('ask_question');
    }
    
    return actions;
  }

  /**
   * Decide se deve enviar áudio
   */
  private shouldSendAudio(): boolean {
    // 20% de chance de enviar áudio para parecer mais humano
    return Math.random() < 0.2;
  }

  /**
   * Resposta de fallback quando a IA falha
   */
  private getFallbackResponse(message: string, isGroup: boolean): AIResponse {
    const fallbackResponses = [
      "Ops, tive um pequeno problema técnico aqui! 😅 Pode repetir?",
      "Desculpa, não entendi bem. Pode explicar de outra forma?",
      "Hmm, deixa eu processar isso melhor... Pode reformular?",
      "Putz, travou aqui! 😂 Pode tentar de novo?"
    ];

    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    return {
      text: randomResponse,
      confidence: 0.3,
      intent: 'unknown',
      entities: {},
      suggestedActions: [],
      shouldSendAudio: false
    };
  }

  /**
   * Gera dica de marketing espontânea
   */
  public async generateMarketingTip(): Promise<string> {
    const tips = [
      "💡 Sabiam que posts com cores quentes geram 23% mais engajamento?",
      "🎯 Dica: Posts às 18h têm o melhor horário de alcance!",
      "📱 Stories com perguntas aumentam a interação em 40%!",
      "🎨 O azul transmite confiança - perfeito para posts de promoção!",
      "📊 Vídeos curtos (15-30s) têm 2x mais retenção!",
      "🔥 Emojis no título aumentam o CTR em 57%!",
      "⏰ Terça e quinta são os melhores dias para postar!",
      "🎪 Posts com storytelling têm 3x mais compartilhamentos!"
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  /**
   * Gera pergunta de engajamento para grupos
   */
  public async generateEngagementQuestion(): Promise<string> {
    const questions = [
      "E aí, galera! Como tá o movimento hoje? 🚀",
      "Alguém precisando de arte ou post novo? 🎨",
      "Qual foi a última campanha que deu certo pra vocês? 💪",
      "Quem aqui já testou vídeo nos stories? 📱",
      "Qual cor vocês mais usam nas campanhas? 🎨",
      "Alguém planejando algo pro próximo feriado? 📅",
      "Qual rede social tá dando mais resultado pra vocês? 📊",
      "Quem aqui já fez live pra vender? 🎥"
    ];

    return questions[Math.floor(Math.random() * questions.length)];
  }
} 