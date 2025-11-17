# ControleIsp 2025 🚀

## Sistema Completo de Gestão de Clientes Negativos para Provedores de Internet

Cópia fiel do sistema **ControleIsp** original, mantendo todas as funcionalidades e integrações.

---

## ✨ Funcionalidades Principais

### 🏦 Gestão de Clientes
- ✅ Cadastro completo de clientes negativados
- ✅ Validação automática de CPF/CNPJ
- ✅ Consulta de CEP com preenchimento automático
- ✅ Histórico completo de inadimplência
- ✅ Níveis de risco (1 a 5)

### 🔍 Pesquisa Cruzada Entre Provedores
- ✅ Busca por nome, CPF ou endereço
- ✅ Base compartilhada entre provedores
- ✅ Proteção contra clientes problemáticos
- ✅ Histórico de débitos de outros provedores

### 📱 Automação WhatsApp
- ✅ Cobrança automática via WhatsApp
- ✅ Lembretes de pagamento agendados
- ✅ PIX integrado nas mensagens
- ✅ Mensagens personalizadas

### 🔄 Integração com ERPs
- ✅ **IXC Soft** - Sincronização automática
- ✅ **MK-Auth** - Gestão completa
- ✅ **SGP TSMX** - Integração total
- ✅ **RadiusNet** - Automação de cobranças
- ✅ Envio automático de boletos via WhatsApp
- ✅ Sincronização agendada diária

### 📊 Painel Administrativo
- ✅ Gestão de provedores
- ✅ Bloqueio/desbloqueio de contas
- ✅ Renovação de assinaturas
- ✅ Estatísticas em tempo real
- ✅ Controle de pagamentos

### 💳 Sistema de Pagamentos
- ✅ Integração com Mercado Pago
- ✅ Pagamento via PIX
- ✅ QR Code automático
- ✅ Lembretes de renovação
- ✅ Promoções (Black Friday)

### 📄 Documentação
- ✅ Geração de contratos em PDF
- ✅ Documentos profissionais
- ✅ Assinatura digital
- ✅ Armazenamento seguro

### 📧 Notificações
- ✅ Email via Zoho Mail
- ✅ Recuperação de senha
- ✅ Notificações do sistema
- ✅ Lembretes automáticos

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **FastAPI** - Framework Python moderno e rápido
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver assíncrono para MongoDB
- **JWT** - Autenticação segura
- **APScheduler** - Agendamento de tarefas
- **Cloudflare R2** - Armazenamento de arquivos
- **Mercado Pago SDK** - Integração de pagamentos
- **ReportLab** - Geração de PDFs
- **QRCode** - Geração de QR Codes PIX

### Frontend
- **React 19** - Framework JavaScript
- **React Router** - Navegação
- **Axios** - Requisições HTTP
- **Shadcn/ui** - Componentes UI modernos
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Sonner** - Notificações toast
- **React Easy Crop** - Editor de imagens

### Integrações
- **ViaCEP** - Consulta de endereços
- **ReceitaWS** - Consulta de CNPJ
- **Brazilnum** - Validação de CPF/CNPJ
- **Zoho Mail** - Envio de emails

---

## 📋 Credenciais de Acesso

### Admin Master
- **Usuário:** `master`
- **Senha:** `master123`
- **Acesso:** http://localhost:3000 → Login → Admin

### Primeiro Provedor (Criar via cadastro)
- Acesse: http://localhost:3000/login?register=true
- Preencha todos os dados obrigatórios
- Aceite o contrato de uso
- Faça upload dos documentos

---

## 🚀 Como Usar

### Iniciar os Serviços
```bash
sudo supervisorctl restart all
```

### Verificar Status
```bash
sudo supervisorctl status
```

### Logs do Backend
```bash
tail -f /var/log/supervisor/backend.*.log
```

### Logs do Frontend
```bash
tail -f /var/log/supervisor/frontend.*.log
```

---

## 🌐 URLs de Acesso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001/api
- **Documentação API:** http://localhost:8001/docs

---

## 📁 Estrutura do Projeto

```
/app
├── backend/
│   ├── server.py          # Servidor FastAPI principal
│   ├── requirements.txt   # Dependências Python
│   └── .env              # Variáveis de ambiente
├── frontend/
│   ├── src/
│   │   ├── App.js        # Componente principal React
│   │   ├── components/   # Componentes reutilizáveis
│   │   └── lib/          # Utilitários
│   ├── package.json      # Dependências Node.js
│   └── .env             # Variáveis de ambiente
└── uploads/             # Arquivos enviados (contratos, logos)
```

---

## 🔐 Variáveis de Ambiente

### Backend (.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_db"
SECRET_KEY="control-isp-jwt-secret-key-2025-production"
CORS_ORIGINS="*"
FRONTEND_URL="http://localhost:3000"

# Email Configuration
SMTP_SERVER="smtp.zoho.com"
SMTP_PORT="587"
SMTP_USERNAME="contato@control-isp.com.br"
SMTP_PASSWORD="SuaSenhaSegura123"
EMAIL_FROM="contato@control-isp.com.br"

# Cloudflare R2 (Armazenamento)
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_ACCOUNT_ID="..."
R2_BUCKET_NAME="..."
R2_ENDPOINT_URL="..."
R2_PUBLIC_URL="..."

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN="..."
MERCADOPAGO_PUBLIC_KEY="..."
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://admin-isp.preview.emergentagent.com
```

---

## 🎯 Funcionalidades Especiais

### 📅 Lembretes Inteligentes
- Cliente prometeu pagar? Agende um lembrete!
- Sistema envia WhatsApp automaticamente no dia prometido
- PIX já incluído na mensagem
- Taxa de recuperação +85%

### 🔄 Sincronização Automática
- Configure horário de sincronização com seu ERP
- Clientes inadimplentes sincronizados automaticamente
- Sem esforço manual
- Sempre atualizado

### 📊 Dashboard Completo
- Estatísticas em tempo real
- Gráficos de inadimplência
- Clientes por risco
- Total de débitos

### 🛡️ Segurança
- Autenticação JWT
- Senhas criptografadas (SHA256)
- Proteção contra ataques
- Validação de dados

---

## 💰 Sistema de Pagamentos

### Planos
- **Mensal:** R$ 199,00/mês
- **Black Friday:** R$ 99,00/mês (3 meses)
- **Primeiro Mês:** Promocional

### Métodos de Pagamento
- PIX (Mercado Pago)
- QR Code gerado automaticamente
- Confirmação instantânea

---

## 📞 Suporte

- **WhatsApp:** (88) 9 9614-9026
- **Email:** contato@controleisp.com.br
- **Website:** www.controleisp.com.br
- **Horário:** Segunda a Sexta, 8h às 18h

---

## 📜 Licença

© 2025 ControleIsp - Todos os direitos reservados.
Sistema desenvolvido para Provedores de Internet em Todo o Brasil.
CNPJ: 47.223.088/0001-74

---

## 🎉 Promoção Black Friday Ativa!

💰 **Economize R$ 300,00**
- De R$ 199,00/mês por apenas **R$ 99,00/mês**
- Válido por 3 meses
- Todos os recursos inclusos
- Sem compromisso - cancele quando quiser

---

## 🚀 Próximos Passos

1. ✅ Sistema clonado e funcionando
2. ✅ Todas as dependências instaladas
3. ✅ Banco de dados configurado
4. ✅ Admin master criado
5. 📝 Cadastre seu primeiro provedor
6. 🔄 Configure integrações com ERPs
7. 📱 Configure automações WhatsApp
8. 💰 Ative o sistema de pagamentos

---

**Desenvolvido com ❤️ pela equipe ControleIsp**
