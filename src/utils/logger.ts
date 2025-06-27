import winston from 'winston';
import path from 'path';

// Configuração dos formatos de log
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Configuração das cores para console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Criar diretório de logs se não existir
const logDir = path.join(process.cwd(), 'logs');

// Configuração do logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'heitor-bot' },
  transports: [
    // Log de erros
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Log geral
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Log de WhatsApp
    new winston.transports.File({
      filename: path.join(logDir, 'whatsapp.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
    
    // Log de IA
    new winston.transports.File({
      filename: path.join(logDir, 'ai.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
  ],
});

// Adicionar console transport apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Funções auxiliares para logging específico
export const whatsappLogger = {
  info: (message: string, meta?: any) => {
    logger.info(`[WHATSAPP] ${message}`, meta);
  },
  error: (message: string, meta?: any) => {
    logger.error(`[WHATSAPP] ${message}`, meta);
  },
  warn: (message: string, meta?: any) => {
    logger.warn(`[WHATSAPP] ${message}`, meta);
  },
  debug: (message: string, meta?: any) => {
    logger.debug(`[WHATSAPP] ${message}`, meta);
  }
};

export const aiLogger = {
  info: (message: string, meta?: any) => {
    logger.info(`[AI] ${message}`, meta);
  },
  error: (message: string, meta?: any) => {
    logger.error(`[AI] ${message}`, meta);
  },
  warn: (message: string, meta?: any) => {
    logger.warn(`[AI] ${message}`, meta);
  },
  debug: (message: string, meta?: any) => {
    logger.debug(`[AI] ${message}`, meta);
  }
};

export const taskLogger = {
  info: (message: string, meta?: any) => {
    logger.info(`[TASK] ${message}`, meta);
  },
  error: (message: string, meta?: any) => {
    logger.error(`[TASK] ${message}`, meta);
  },
  warn: (message: string, meta?: any) => {
    logger.warn(`[TASK] ${message}`, meta);
  },
  debug: (message: string, meta?: any) => {
    logger.debug(`[TASK] ${message}`, meta);
  }
};

// Função para log de performance
export const performanceLogger = {
  start: (operation: string) => {
    const startTime = Date.now();
    return {
      end: (meta?: any) => {
        const duration = Date.now() - startTime;
        logger.info(`[PERFORMANCE] ${operation} completed in ${duration}ms`, {
          operation,
          duration,
          ...meta
        });
      }
    };
  }
};

// Função para log de auditoria
export const auditLogger = {
  userAction: (userId: string, action: string, details?: any) => {
    logger.info(`[AUDIT] User ${userId} performed ${action}`, {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  systemAction: (action: string, details?: any) => {
    logger.info(`[AUDIT] System performed ${action}`, {
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

// Função para log de métricas
export const metricsLogger = {
  counter: (metric: string, value: number = 1, tags?: Record<string, string>) => {
    logger.info(`[METRIC] Counter: ${metric} = ${value}`, {
      type: 'counter',
      metric,
      value,
      tags,
      timestamp: new Date().toISOString()
    });
  },
  
  gauge: (metric: string, value: number, tags?: Record<string, string>) => {
    logger.info(`[METRIC] Gauge: ${metric} = ${value}`, {
      type: 'gauge',
      metric,
      value,
      tags,
      timestamp: new Date().toISOString()
    });
  },
  
  timing: (metric: string, duration: number, tags?: Record<string, string>) => {
    logger.info(`[METRIC] Timing: ${metric} = ${duration}ms`, {
      type: 'timing',
      metric,
      duration,
      tags,
      timestamp: new Date().toISOString()
    });
  }
}; 