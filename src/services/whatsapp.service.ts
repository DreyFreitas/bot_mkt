import { WhatsAppMessage } from '../types';

// Mock básico do serviço de WhatsApp
export class WhatsAppService {
  async connect(): Promise<void> {
    console.log('[MOCK] WhatsApp conectado!');
  }

  async disconnect(): Promise<void> {
    console.log('[MOCK] WhatsApp desconectado!');
  }

  async sendMessage(to: string, message: string): Promise<void> {
    console.log(`[MOCK] Enviando mensagem para ${to}: ${message}`);
  }

  onMessage(callback: (message: WhatsAppMessage) => void): void {
    // Mock: não faz nada
  }

  onGroupMessage(callback: (message: WhatsAppMessage) => void): void {
    // Mock: não faz nada
  }
} 