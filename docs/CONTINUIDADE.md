# Sistema de Continuidade de Conversa - Heitor

## Visão Geral

O Heitor possui um sistema avançado de **continuidade de conversa** que resolve o problema comum de bots que tratam cada mensagem como isolada. O sistema mantém contexto, memória e continuidade em todas as interações.

## Como Funciona

### 1. Contexto Persistente

Cada conversa é armazenada no MongoDB com:
- **Histórico completo** de mensagens
- **Contexto inteligente** com informações extraídas
- **Janela de contexto** com mensagens importantes
- **Fluxo da conversa** com intenções e respostas
- **Estado emocional** do cliente
- **Tópico atual** e mensagens relacionadas

### 2. Detecção de Tópicos

O sistema detecta automaticamente:
- **Novos tópicos** baseado em tempo e mudança de intenção
- **Continuação de tópicos** existentes
- **Transições** entre assuntos
- **Palavras-chave** que indicam mudança de assunto

### 3. Análise de Importância

Cada mensagem recebe uma pontuação de importância (1-10) baseada em:
- **Intenção** (pedidos de arte = alta importância)
- **Palavras-chave** (urgente, hoje, agora)
- **Perguntas** (aumentam importância)
- **Emojis** (indicam expressividade)
- **Tamanho** (mensagens longas = mais contexto)

### 4. Janela de Contexto Inteligente

O sistema mantém apenas as mensagens mais relevantes:
- **Máximo 20 mensagens** na janela
- **Ordenadas por importância**
- **Filtradas automaticamente**
- **Atualizadas em tempo real**

## Exemplo Prático

### Conversa Sem Continuidade (Bot Tradicional)

```
Cliente: "Oi, preciso de um banner"
Bot: "Olá! Que tipo de banner você precisa?"
Cliente: "Para minha loja"
Bot: "Que tipo de loja você tem?"
Cliente: "Restaurante"
Bot: "Que tamanho você precisa?"
Cliente: "1080x1080"
Bot: "Que cores você prefere?"
Cliente: "Azul e branco"
Bot: "Qual o prazo?"
Cliente: "Para hoje"
Bot: "Vou criar para você"
```

### Conversa Com Continuidade (Heitor)

```
Cliente: "Oi, preciso de um banner"
Heitor: "Oi! Show, bora criar um banner top! 🎨 Que tipo de banner você precisa?"

Cliente: "Para minha loja"
Heitor: "Legal! Que tipo de loja você tem? Assim posso pensar na melhor abordagem!"

Cliente: "Restaurante"
Heitor: "Perfeito! Restaurante é sempre uma vibe boa! 🍕 Que tamanho você precisa pro banner?"

Cliente: "1080x1080"
Heitor: "1080x1080, ideal pra Instagram! Que cores você prefere? Pensei em algo que combine com a identidade do seu restaurante..."

Cliente: "Azul e branco"
Heitor: "Azul e branco, muito clean! 💙🤍 E qual o prazo? Assim posso priorizar direitinho!"

Cliente: "Para hoje"
Heitor: "Para hoje? Entendi, é urgente! 🚀 Vou criar agora mesmo um banner azul e branco 1080x1080 pro seu restaurante. Deve ficar show! Qual o nome do restaurante pra eu incluir?"
```

## Vantagens do Sistema

### 1. Memória Persistente
- **Lembra** do que foi conversado
- **Referencia** informações anteriores
- **Não repete** perguntas já respondidas
- **Mantém** contexto entre sessões

### 2. Personalização
- **Aprende** preferências do cliente
- **Adapta** o tom baseado no estado emocional
- **Usa** informações extraídas (cores, negócio, etc.)
- **Personaliza** respostas com nome do cliente

### 3. Inteligência Contextual
- **Detecta** urgência automaticamente
- **Analisa** estado emocional
- **Identifica** intenções
- **Extrai** entidades (cores, datas, tamanhos)

### 4. Continuidade Natural
- **Flui** naturalmente na conversa
- **Não soa** como robô
- **Mantém** engajamento
- **Referencia** tópicos anteriores

## Estrutura Técnica

### ConversationService
```typescript
class ConversationService {
  // Gerencia conversas e contexto
  async getConversation(phoneNumber: string): Promise<Conversation>
  async createConversation(phoneNumber: string): Promise<Conversation>
  async updateConversation(conversationId: string, message: WhatsAppMessage): Promise<Conversation>
  generateContextSummary(conversation: Conversation): string
}
```

### Contexto da Conversa
```typescript
interface ConversationContext {
  clientName?: string;
  businessType?: string;
  preferences?: ClientPreferences;
  currentTopic: string;
  topicStartTime: Date;
  topicMessages: string[];
  emotionalState: 'positive' | 'negative' | 'neutral' | 'urgent';
  urgency: 'low' | 'normal' | 'high';
  lastIntent: string;
  conversationFlow: ConversationFlow[];
  contextWindow: ContextMessage[];
}
```

### Janela de Contexto
```typescript
interface ContextMessage {
  message: string;
  timestamp: Date;
  importance: number; // 1-10
}
```

## Configuração

### Variáveis de Ambiente
```env
# Configurações de contexto
MAX_CONTEXT_WINDOW=20
MAX_HISTORY_LENGTH=50
TOPIC_TIMEOUT_MINUTES=30

# Configurações de IA
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

### Configuração do Heitor
```typescript
const config: HeitorConfig = {
  personality: {
    tone: 'friendly',
    useEmojis: true,
    useSlang: true,
    responseStyle: 'conversational',
    spontaneityLevel: 8,
    creativityLevel: 9
  }
}
```

## Monitoramento

### Logs de Continuidade
```typescript
logger.info('Conversa processada com continuidade', {
  phone: message.from,
  topic: conversation.context.currentTopic,
  messageCount: conversation.context.topicMessages.length,
  emotionalState: conversation.context.emotionalState
});
```

### Métricas
- **Tempo médio de resposta**
- **Taxa de continuidade** (referências a tópicos anteriores)
- **Satisfação do cliente**
- **Engajamento** (mensagens por conversa)

## Benefícios para o Negócio

### 1. Experiência do Cliente
- **Conversas mais naturais**
- **Menos repetição**
- **Respostas personalizadas**
- **Maior satisfação**

### 2. Eficiência
- **Menos perguntas desnecessárias**
- **Respostas mais precisas**
- **Contexto mantido automaticamente**
- **Tempo economizado**

### 3. Qualidade
- **Respostas mais relevantes**
- **Personalização automática**
- **Memória persistente**
- **Engajamento maior**

## Exemplos de Uso

### Cenário 1: Pedido de Arte
```
Cliente: "Preciso de um banner"
Heitor: "Show! Que tipo de banner? 🎨"

Cliente: "Para Instagram"
Heitor: "Perfeito! Instagram é 1080x1080. Que cores você gosta?"

Cliente: "Azul e rosa"
Heitor: "Azul e rosa, muito bonito! 💙💖 Para que serve o banner?"

Cliente: "Promoção de pizza"
Heitor: "Pizza com azul e rosa, que combinação única! 🍕 Vou criar algo que chame atenção. Qual o nome da pizzaria?"
```

### Cenário 2: Acompanhamento
```
Cliente: "Como está o banner?"
Heitor: "Oi! O banner azul e rosa da promoção de pizza está quase pronto! 🎨 Só faltam alguns ajustes finais. Deve ficar show no Instagram! 😊"
```

### Cenário 3: Mudança de Tópico
```
Cliente: "Outra coisa, preciso de um post também"
Heitor: "Claro! Mudando de assunto então! 📱 Que tipo de post você precisa? Pode ser sobre a mesma promoção de pizza ou algo diferente?"
```

## Conclusão

O sistema de continuidade do Heitor transforma a experiência de conversa com bots, tornando-a mais humana, eficiente e personalizada. O cliente sente que está falando com alguém que realmente entende e lembra do contexto, não com uma máquina que reinicia a cada mensagem. 