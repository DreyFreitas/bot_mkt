# 🤖 Heitor - Assistente de Marketing Inteligente

## 📋 Sobre o Projeto

O Heitor é um assistente virtual especializado em marketing que atua de forma independente em grupos de WhatsApp e conversas privadas. Desenvolvido para o profissional de marketing Andrey, o Heitor combina inteligência artificial com personalidade humana para gerenciar tarefas, criar conteúdo e manter engajamento.

## 🎯 Funcionalidades Principais

### 🤖 Personalidade Humana
- Comunicação natural com gírias e emojis
- Variação de tom e estilo de mensagens
- Comentários espontâneos e insights de marketing
- Memória de conversas e preferências

### 📱 Interação em Grupos
- Cumprimentos automáticos (bom dia, boa tarde, boa noite)
- Perguntas para engajamento
- Dicas espontâneas de marketing
- Respostas inteligentes a solicitações de arte/campanhas

### 👤 Chat Privado
- Lembretes automáticos de tarefas
- Recebimento de comandos
- Relatórios de atividade
- Sugestões criativas

### ⏰ Sistema de Lembretes
- Lista de tarefas pendentes
- Alertas de prazos
- Sugestões de datas comemorativas
- Acompanhamento de status

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + TypeScript
- **IA**: OpenAI GPT-4 + Claude
- **WhatsApp**: WPPConnect
- **Banco de Dados**: MongoDB
- **API**: Express.js
- **Deploy**: Docker + AWS

## 🚀 Instalação e Configuração

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/heitor-bot.git
cd heitor-bot

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Execute o projeto
npm run dev
```

## 📁 Estrutura do Projeto

```
heitor-bot/
├── src/
│   ├── controllers/     # Controladores da aplicação
│   ├── services/        # Lógica de negócio
│   ├── models/          # Modelos de dados
│   ├── utils/           # Utilitários
│   ├── config/          # Configurações
│   └── types/           # Tipos TypeScript
├── docs/                # Documentação
├── tests/               # Testes
└── docker/              # Configurações Docker
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# WhatsApp
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_QR_CODE_PATH=./qr-code.png

# OpenAI
OPENAI_API_KEY=sua-chave-api

# MongoDB
MONGODB_URI=sua-uri-mongodb

# Configurações do Heitor
HEITOR_NAME=Heitor
OWNER_NAME=Andrey
OWNER_PHONE=5511999999999
```

## 📊 Funcionalidades Detalhadas

### Sistema de IA
- **Contexto de conversa**: Mantém histórico para respostas mais naturais
- **Análise de intenção**: Identifica pedidos de arte, campanhas, etc.
- **Geração de conteúdo**: Cria textos publicitários e slogans
- **Personalização**: Adapta respostas baseado no histórico do cliente

### Sistema de Lembretes
- **Tarefas pendentes**: Lista organizada por prioridade
- **Alertas inteligentes**: Notifica sobre prazos próximos
- **Sugestões automáticas**: Propõe ações baseadas no contexto

### Integração WhatsApp
- **Múltiplos grupos**: Gerencia vários grupos simultaneamente
- **Chat privado**: Comunicação exclusiva com Andrey
- **Mídia**: Suporte a imagens, áudios e documentos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato:
- Email: suporte@heitor-bot.com
- WhatsApp: (11) 99999-9999

---

**Desenvolvido com ❤️ para revolucionar o marketing digital** 