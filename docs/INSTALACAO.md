# 📋 Guia de Instalação - Heitor Bot

## 🎯 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **MongoDB** (local ou na nuvem)
- **Git**

### Verificando as versões:

```bash
node --version  # Deve ser >= 18.0.0
npm --version   # Deve ser >= 8.0.0
git --version   # Qualquer versão recente
```

## 🚀 Instalação Local

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/heitor-bot.git
cd heitor-bot
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas configurações
nano .env
```

### 4. Configure o MongoDB

#### Opção A: MongoDB Local

```bash
# Instale o MongoDB (Ubuntu/Debian)
sudo apt update
sudo apt install mongodb

# Inicie o serviço
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verifique se está rodando
sudo systemctl status mongodb
```

#### Opção B: MongoDB Atlas (Recomendado)

1. Acesse [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie uma conta gratuita
3. Crie um novo cluster
4. Configure o acesso de rede (0.0.0.0/0 para desenvolvimento)
5. Crie um usuário e senha
6. Copie a string de conexão

### 5. Configure as APIs de IA

#### OpenAI
1. Acesse [OpenAI](https://platform.openai.com/)
2. Crie uma conta
3. Vá para "API Keys"
4. Crie uma nova chave
5. Adicione no `.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```

#### Anthropic (Opcional)
1. Acesse [Anthropic](https://console.anthropic.com/)
2. Crie uma conta
3. Gere uma chave de API
4. Adicione no `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### 6. Configure o WhatsApp

#### Opção A: WPPConnect (Recomendado)

```bash
# O WPPConnect será baixado automaticamente na primeira execução
# Você precisará escanear o QR Code que aparecerá no terminal
```

#### Opção B: Venom

```bash
npm install venom-bot
```

### 7. Execute o projeto

```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm run build
npm start
```

## 🐳 Instalação com Docker

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/heitor-bot.git
cd heitor-bot
```

### 2. Configure as variáveis de ambiente

```bash
cp env.example .env
nano .env
```

### 3. Configure as APIs

Adicione suas chaves de API no arquivo `.env`:

```env
OPENAI_API_KEY=sua-chave-openai
ANTHROPIC_API_KEY=sua-chave-anthropic
```

### 4. Execute com Docker Compose

```bash
# Construir e iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f heitor

# Parar serviços
docker-compose down
```

### 5. Acesse a aplicação

- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Status**: http://localhost:3000/status

## 🔧 Configuração Avançada

### Configuração do Heitor

Edite o arquivo `.env` para personalizar o Heitor:

```env
# Personalidade
HEITOR_NAME=Heitor
OWNER_NAME=Andrey
OWNER_PHONE=5511999999999

# Configurações de IA
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7

# Configurações de resposta
RESPONSE_DELAY_MIN=1000
RESPONSE_DELAY_MAX=3000
```

### Configuração de Grupos

Para configurar grupos específicos, crie um arquivo `groups.json`:

```json
{
  "groups": [
    {
      "id": "grupo1@c.us",
      "name": "Grupo de Clientes",
      "autoGreetings": true,
      "marketingTips": true,
      "engagementQuestions": true
    }
  ]
}
```

### Configuração de Templates

Crie templates personalizados em `templates.json`:

```json
{
  "templates": [
    {
      "name": "saudacao_manha",
      "content": "Bom dia, {nome}! 👋 Como posso ajudar hoje?",
      "category": "greeting",
      "variables": ["nome"]
    }
  ]
}
```

## 🧪 Testando a Instalação

### 1. Verifique a saúde da aplicação

```bash
curl http://localhost:3000/health
```

### 2. Teste o status do Heitor

```bash
curl http://localhost:3000/status
```

### 3. Inicie o Heitor

```bash
curl -X POST http://localhost:3000/start
```

### 4. Envie uma mensagem de teste

```bash
curl -X POST http://localhost:3000/test-message \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999", "message": "Olá, Heitor!"}'
```

## 🔍 Solução de Problemas

### Problema: MongoDB não conecta

```bash
# Verifique se o MongoDB está rodando
sudo systemctl status mongodb

# Verifique a string de conexão no .env
MONGODB_URI=mongodb://localhost:27017/heitor-bot
```

### Problema: WhatsApp não conecta

```bash
# Verifique os logs
npm run dev

# Certifique-se de que o QR Code foi escaneado
# Verifique se o número está correto no .env
OWNER_PHONE=5511999999999
```

### Problema: IA não responde

```bash
# Verifique as chaves de API
echo $OPENAI_API_KEY

# Teste a API diretamente
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### Problema: Porta já em uso

```bash
# Mude a porta no .env
PORT=3001

# Ou mate o processo que está usando a porta
lsof -ti:3000 | xargs kill -9
```

## 📊 Monitoramento

### Logs

Os logs são salvos em:
- `logs/combined.log` - Log geral
- `logs/error.log` - Apenas erros
- `logs/whatsapp.log` - Logs do WhatsApp
- `logs/ai.log` - Logs da IA

### Métricas

Acesse as métricas em:
- http://localhost:3000/health
- http://localhost:3000/status

### Backup

O backup automático é salvo em:
- `backups/` - Backups do banco de dados

## 🚀 Deploy em Produção

### 1. Prepare o servidor

```bash
# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instale Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configure o domínio

```bash
# Configure o DNS para apontar para seu servidor
# Exemplo: heitor.seudominio.com -> IP_DO_SERVIDOR
```

### 3. Configure SSL (Opcional)

```bash
# Instale Certbot
sudo apt install certbot python3-certbot-nginx

# Configure SSL
sudo certbot --nginx -d heitor.seudominio.com
```

### 4. Deploy

```bash
# Clone o projeto
git clone https://github.com/seu-usuario/heitor-bot.git
cd heitor-bot

# Configure as variáveis de ambiente
cp env.example .env
nano .env

# Execute
docker-compose up -d
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs -f heitor`
2. Consulte a documentação: `docs/`
3. Abra uma issue no GitHub
4. Entre em contato: suporte@heitor-bot.com

---

**🎉 Parabéns! O Heitor está pronto para revolucionar seu marketing!** 