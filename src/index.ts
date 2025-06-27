import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { HeitorService } from './services/heitor.service';
import { database } from './config/database';
import { logger } from './utils/logger';
import { HeitorConfig } from './types';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Heitor
const heitorConfig: HeitorConfig = {
  name: process.env.HEITOR_NAME || 'Heitor',
  ownerName: process.env.OWNER_NAME || 'Andrey',
  ownerPhone: process.env.OWNER_PHONE || '5511999999999',
  ownerEmail: process.env.OWNER_EMAIL || 'andrey@exemplo.com',
  personality: {
    tone: 'friendly',
    useEmojis: true,
    useSlang: true,
    responseStyle: 'medium',
    spontaneityLevel: 8,
    creativityLevel: 9
  },
  aiSettings: {
    provider: (process.env.AI_PROVIDER as 'openai' | 'anthropic' | 'hybrid') || 'openai',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    fallbackProvider: process.env.AI_FALLBACK_PROVIDER,
    contextWindow: parseInt(process.env.MAX_CONVERSATION_HISTORY || '10')
  },
  responseSettings: {
    minDelay: parseInt(process.env.RESPONSE_DELAY_MIN || '1000'),
    maxDelay: parseInt(process.env.RESPONSE_DELAY_MAX || '3000'),
    autoGreetings: true,
    greetingHours: {
      morning: { start: 5, end: 12 },
      afternoon: { start: 12, end: 18 },
      evening: { start: 18, end: 23 }
    },
    reminderFrequency: 'daily'
  }
};

// Instância do Heitor
let heitor: HeitorService;

// Configuração do Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Muitas requisições, tente novamente mais tarde.'
});
app.use(limiter);

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Rotas de saúde
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    heitor: {
      running: heitor?.isRunningStatus() || false,
      name: heitorConfig.name,
      owner: heitorConfig.ownerName
    },
    database: {
      status: database.getConnectionStatus(),
      connected: database.isConnectedToDatabase()
    }
  });
});

// Rota de status do Heitor
app.get('/status', (req, res) => {
  res.json({
    heitor: {
      running: heitor?.isRunningStatus() || false,
      name: heitorConfig.name,
      owner: heitorConfig.ownerName,
      personality: heitorConfig.personality
    }
  });
});

// Rota para iniciar o Heitor
app.post('/start', async (req, res) => {
  try {
    if (heitor?.isRunningStatus()) {
      return res.json({ message: 'Heitor já está rodando!' });
    }

    heitor = new HeitorService(heitorConfig);
    await heitor.initialize();
    
    res.json({ 
      message: 'Heitor iniciado com sucesso!',
      status: 'running'
    });
  } catch (error) {
    logger.error('Erro ao iniciar Heitor:', error);
    res.status(500).json({ 
      error: 'Erro ao iniciar Heitor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para parar o Heitor
app.post('/stop', async (req, res) => {
  try {
    if (!heitor?.isRunningStatus()) {
      return res.json({ message: 'Heitor não está rodando!' });
    }

    await heitor.stop();
    
    res.json({ 
      message: 'Heitor parado com sucesso!',
      status: 'stopped'
    });
  } catch (error) {
    logger.error('Erro ao parar Heitor:', error);
    res.status(500).json({ 
      error: 'Erro ao parar Heitor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para reiniciar o Heitor
app.post('/restart', async (req, res) => {
  try {
    if (heitor?.isRunningStatus()) {
      await heitor.stop();
    }

    heitor = new HeitorService(heitorConfig);
    await heitor.initialize();
    
    res.json({ 
      message: 'Heitor reiniciado com sucesso!',
      status: 'running'
    });
  } catch (error) {
    logger.error('Erro ao reiniciar Heitor:', error);
    res.status(500).json({ 
      error: 'Erro ao reiniciar Heitor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para enviar mensagem de teste
app.post('/test-message', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone e message são obrigatórios' });
    }

    if (!heitor?.isRunningStatus()) {
      return res.status(400).json({ error: 'Heitor não está rodando' });
    }

    // Aqui você implementaria o envio da mensagem
    logger.info('Mensagem de teste enviada', { phone, message });
    
    res.json({ 
      message: 'Mensagem de teste enviada com sucesso!',
      phone,
      message
    });
  } catch (error) {
    logger.error('Erro ao enviar mensagem de teste:', error);
    res.status(500).json({ 
      error: 'Erro ao enviar mensagem de teste',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para configurações
app.get('/config', (req, res) => {
  res.json({
    heitor: {
      name: heitorConfig.name,
      owner: heitorConfig.ownerName,
      personality: heitorConfig.personality,
      aiSettings: {
        provider: heitorConfig.aiSettings.provider,
        model: heitorConfig.aiSettings.model,
        maxTokens: heitorConfig.aiSettings.maxTokens,
        temperature: heitorConfig.aiSettings.temperature
      }
    }
  });
});

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Função para inicializar a aplicação
async function initializeApp() {
  try {
    logger.info('🚀 Iniciando aplicação Heitor...');
    
    // Conectar ao banco de dados
    await database.connect();
    logger.info('✅ Banco de dados conectado');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`✅ Servidor rodando na porta ${PORT}`);
      logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
      logger.info(`📊 Status: http://localhost:${PORT}/status`);
    });
    
    // Inicializar Heitor automaticamente se configurado
    if (process.env.AUTO_START_HEITOR === 'true') {
      logger.info('🤖 Iniciando Heitor automaticamente...');
      heitor = new HeitorService(heitorConfig);
      await heitor.initialize();
      logger.info('✅ Heitor iniciado automaticamente');
    }
    
  } catch (error) {
    logger.error('❌ Erro ao inicializar aplicação:', error);
    process.exit(1);
  }
}

// Tratamento de sinais para graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Recebido SIGINT, encerrando aplicação...');
  await gracefulShutdown();
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Recebido SIGTERM, encerrando aplicação...');
  await gracefulShutdown();
});

async function gracefulShutdown() {
  try {
    // Parar Heitor
    if (heitor?.isRunningStatus()) {
      await heitor.stop();
    }
    
    // Desconectar banco de dados
    await database.disconnect();
    
    logger.info('✅ Aplicação encerrada com sucesso');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao encerrar aplicação:', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('❌ Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Inicializar aplicação
initializeApp(); 