// Script de inicialização do MongoDB para o Heitor Bot

// Conectar ao banco de dados
db = db.getSiblingDB('heitor-bot');

// Criar usuário para a aplicação
db.createUser({
  user: 'heitor_user',
  pwd: 'heitor_password_123',
  roles: [
    {
      role: 'readWrite',
      db: 'heitor-bot'
    }
  ]
});

// Criar coleções iniciais
db.createCollection('conversations');
db.createCollection('tasks');
db.createCollection('reminders');
db.createCollection('templates');
db.createCollection('marketing_tips');
db.createCollection('analytics');
db.createCollection('logs');

// Criar índices para otimização
db.conversations.createIndex({ "phoneNumber": 1 }, { unique: true });
db.conversations.createIndex({ "lastActivity": -1 });
db.conversations.createIndex({ "isGroup": 1 });

db.tasks.createIndex({ "clientPhone": 1 });
db.tasks.createIndex({ "status": 1 });
db.tasks.createIndex({ "priority": 1 });
db.tasks.createIndex({ "dueDate": 1 });
db.tasks.createIndex({ "createdAt": -1 });

db.reminders.createIndex({ "dueDate": 1 });
db.reminders.createIndex({ "isCompleted": 1 });
db.reminders.createIndex({ "priority": 1 });

db.templates.createIndex({ "category": 1 });
db.templates.createIndex({ "isActive": 1 });

db.marketing_tips.createIndex({ "category": 1 });
db.marketing_tips.createIndex({ "isActive": 1 });
db.marketing_tips.createIndex({ "createdAt": -1 });

db.analytics.createIndex({ "date": 1 });
db.analytics.createIndex({ "type": 1 });

db.logs.createIndex({ "timestamp": -1 });
db.logs.createIndex({ "level": 1 });
db.logs.createIndex({ "source": 1 });

// Inserir dados iniciais de exemplo

// Templates padrão
db.templates.insertMany([
  {
    name: "saudacao_manha",
    content: "Bom dia, {nome}! 👋 Como posso ajudar hoje?",
    category: "greeting",
    variables: ["nome"],
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "saudacao_tarde",
    content: "Boa tarde, {nome}! 😊 Alguém precisando de algo?",
    category: "greeting",
    variables: ["nome"],
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "saudacao_noite",
    content: "Boa noite, {nome}! 🌙 Como foi o dia de vocês?",
    category: "greeting",
    variables: ["nome"],
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "pedido_arte",
    content: "Opa, {nome}! 🎨 Me fala rapidinho: quer algo coloridão ou minimalista? Pra qual rede social vai ser? Posso já pensar em algumas ideias.",
    category: "art_request",
    variables: ["nome"],
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "pedido_promocao",
    content: "Show, {nome}! 🚀 Vamos criar uma campanha que vai bombar! Me conta: qual produto/serviço, público-alvo e objetivo da promoção?",
    category: "promotion_request",
    variables: ["nome"],
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "lembrete_tarefa",
    content: "📋 Lembrete: {tarefa} - Prazo: {prazo}",
    category: "reminder",
    variables: ["tarefa", "prazo"],
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Dicas de marketing padrão
db.marketing_tips.insertMany([
  {
    title: "Cores Quentes Geram Mais Engajamento",
    content: "💡 Sabiam que posts com cores quentes geram 23% mais engajamento?",
    category: "design",
    tags: ["cores", "engajamento", "design"],
    isActive: true,
    createdAt: new Date()
  },
  {
    title: "Melhor Horário para Posts",
    content: "🎯 Dica: Posts às 18h têm o melhor horário de alcance!",
    category: "strategy",
    tags: ["horario", "alcance", "timing"],
    isActive: true,
    createdAt: new Date()
  },
  {
    title: "Stories com Perguntas",
    content: "📱 Stories com perguntas aumentam a interação em 40%!",
    category: "strategy",
    tags: ["stories", "interacao", "perguntas"],
    isActive: true,
    createdAt: new Date()
  },
  {
    title: "Azul Transmite Confiança",
    content: "🎨 O azul transmite confiança - perfeito para posts de promoção!",
    category: "design",
    tags: ["cores", "confianca", "psicologia"],
    isActive: true,
    createdAt: new Date()
  },
  {
    title: "Vídeos Curtos",
    content: "📊 Vídeos curtos (15-30s) têm 2x mais retenção!",
    category: "trends",
    tags: ["video", "retencao", "conteudo"],
    isActive: true,
    createdAt: new Date()
  },
  {
    title: "Emojis Aumentam CTR",
    content: "🔥 Emojis no título aumentam o CTR em 57%!",
    category: "copywriting",
    tags: ["emojis", "ctr", "titulos"],
    isActive: true,
    createdAt: new Date()
  },
  {
    title: "Melhores Dias para Postar",
    content: "⏰ Terça e quinta são os melhores dias para postar!",
    category: "strategy",
    tags: ["dias", "timing", "estrategia"],
    isActive: true,
    createdAt: new Date()
  },
  {
    title: "Storytelling Gera Compartilhamentos",
    content: "🎪 Posts com storytelling têm 3x mais compartilhamentos!",
    category: "copywriting",
    tags: ["storytelling", "compartilhamentos", "narrativa"],
    isActive: true,
    createdAt: new Date()
  }
]);

// Configurações iniciais
db.createCollection('config');
db.config.insertOne({
  key: "heitor_settings",
  value: {
    name: "Heitor",
    ownerName: "Andrey",
    ownerPhone: "5511999999999",
    personality: {
      tone: "friendly",
      useEmojis: true,
      useSlang: true,
      responseStyle: "medium",
      spontaneityLevel: 8,
      creativityLevel: 9
    },
    aiSettings: {
      provider: "openai",
      model: "gpt-4",
      maxTokens: 1000,
      temperature: 0.7
    },
    responseSettings: {
      minDelay: 1000,
      maxDelay: 3000,
      autoGreetings: true,
      reminderFrequency: "daily"
    }
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Configurações de grupos padrão
db.createCollection('groups');
db.groups.insertMany([
  {
    id: "default_group",
    name: "Grupo Padrão",
    isActive: true,
    autoGreetings: true,
    marketingTips: true,
    engagementQuestions: true,
    allowedCommands: ["help", "status", "tip"],
    customResponses: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("✅ Banco de dados inicializado com sucesso!");
print("📊 Coleções criadas: conversations, tasks, reminders, templates, marketing_tips, analytics, logs, config, groups");
print("🔍 Índices criados para otimização de consultas");
print("📝 Dados iniciais inseridos: templates e dicas de marketing");
print("⚙️ Configurações padrão do Heitor definidas"); 