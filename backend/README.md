# Wassel Chat — Custom Website Chat with respond.io Custom Channel

A production-ready website chat system integrated with respond.io using a **Custom Channel**, enabling branded real-time communication between website visitors and Wassel support agents.

---

## Architecture

```
Visitor (React Widget) ──POST /api/chat/send──► Backend (Express)
                                                      │
                                        POST to respond.io Webhook
                                                      │
                                            respond.io Inbox (Agent)
                                                      │
                                        POST /api/respondio/message
                                                      │
                        Socket.IO emit ◄──────── Backend (Express)
                                │
                           Visitor browser
```

---

## Folder Structure

```
backend/                   Express + TypeScript backend
  src/
    app.ts                 Express app setup
    server.ts              HTTP server + Socket.IO bootstrap
    config/                env.ts, database.ts (SQL Server pool)
    controllers/           chat.controller.ts, respondio.controller.ts
    services/              chat.service.ts, respondio.service.ts, socket.service.ts
    repositories/          chat.repository.ts (all DB queries)
    middleware/            auth, error handler, rate limiter, validator
    validators/            Zod schemas
    utils/                 phone.ts, ids.ts, logger.ts
    types/                 chat.types.ts

database/migrations/       SQL Server migration scripts (run in order)

components/chat/           React chat widget (inside the Wassel frontend)
  ChatWidget.tsx           Root component — mounts the floating button + panel
  ChatButton.tsx           Floating action button
  PreChatForm.tsx          Pre-chat form (name, phone, service type, message)
  ChatWindow.tsx           Chat message list + input
  MessageBubble.tsx        Individual message bubble
  ChatInput.tsx            Textarea + send button
  services/
    chatApi.ts             REST API client
    socketClient.ts        Socket.IO client wrapper
  types/chat.types.ts
```

---

## Configure respond.io Custom Channel

1. Log into [respond.io](https://app.respond.io) → **Settings** → **Channels**.
2. Click **Add Channel** → choose **Custom Channel**.
3. Set **ID Type** to **Phone Number**.
4. Set the **Outgoing Webhook / API Base URL** to:
   ```
   https://YOUR_BACKEND_DOMAIN/api/respondio
   ```
5. respond.io will call:
   ```
   POST https://YOUR_BACKEND_DOMAIN/api/respondio/message
   ```
6. Copy the following values from respond.io and add them to `backend/.env`:
   | Variable | Where to find it |
   |---|---|
   | `RESPOND_CHANNEL_ID` | Custom Channel settings page |
   | `RESPOND_API_TOKEN` | Custom Channel settings page |
   | `RESPOND_WEBHOOK_URL` | Use `https://app.respond.io/custom/channel/webhook/` |

---

## Environment Variables

### Backend (`backend/.env`)
```env
RESPOND_CHANNEL_ID=
RESPOND_API_TOKEN=
RESPOND_WEBHOOK_URL=https://app.respond.io/custom/channel/webhook/

DB_SERVER=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

PORT=3000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### Frontend (`.env` in project root)
```env
VITE_CHAT_BACKEND_URL=http://localhost:3000
```

---

## Database Setup

Run the SQL migration scripts in order against your SQL Server database:

```sql
-- In SQL Server Management Studio or sqlcmd:
:r database/migrations/001_create_chat_sessions.sql
:r database/migrations/002_create_chat_messages.sql
:r database/migrations/003_create_chat_events.sql
```

---

## Run Locally

### Backend

```bash
cd backend
cp .env.example .env
# Fill in .env values
npm install
npm run dev
# Server starts on http://localhost:3000
```

### Frontend

```bash
# In the WasselLogistics root
cp .env.example .env
# Set VITE_CHAT_BACKEND_URL=http://localhost:3000
npm install
npm run dev
```

---

## Deploy to Azure App Service

### Backend

1. Create an **Azure App Service** (Node.js 20 LTS).
2. Set all environment variables under **Configuration → Application Settings**.
3. Deploy via GitHub Actions, Azure CLI, or VS Code Azure extension:
   ```bash
   cd backend
   npm run build
   # Deploy the dist/ folder to Azure
   ```
4. Set the startup command to: `node dist/server.js`
5. Ensure the App Service can reach your SQL Server (firewall rules / VNet).

### Frontend

Build and deploy as a static site or alongside the backend:
```bash
npm run build
# Deploy the dist/ folder to Azure Static Web Apps or CDN
```

---

## Testing

### 1. Visitor starts chat

```bash
curl -X POST http://localhost:3000/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Mousa","phone":"0599987812","serviceType":"Domestic Shipping","language":"ar"}'
# Expected: { "success": true, "sessionId": "...", "contactId": "+970599987812" }
```

### 2. Visitor sends a message

```bash
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<sessionId>","message":"Hello, I need help"}'
# Expected: { "success": true, "messageId": "web_..." }
# Message appears in respond.io Inbox
```

### 3. Agent replies from respond.io

respond.io calls your backend automatically. To simulate:
```bash
curl -X POST http://localhost:3000/api/respondio/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <RESPOND_API_TOKEN>" \
  -d '{"channelId":"<RESPOND_CHANNEL_ID>","contactId":"+970599987812","message":{"type":"text","text":"Hello! How can we help?"}}'
# Expected: { "mId": "agent_..." }
# The reply is pushed to the visitor browser via Socket.IO
```

### 4. Invalid token rejected

```bash
curl -X POST http://localhost:3000/api/respondio/message \
  -H "Authorization: Bearer wrong_token" \
  -d '{"channelId":"x","contactId":"+970","message":{"type":"text","text":"hi"}}'
# Expected: 401 { "error": { "code": "UNAUTHORIZED" } }
```

### 5. Invalid phone rejected

```bash
curl -X POST http://localhost:3000/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","phone":"","serviceType":"Other","language":"ar"}'
# Expected: 400 { "error": { "code": "VALIDATION_ERROR" } }
```

### 6. Message too long rejected

```bash
# message with 7001 characters → 400 VALIDATION_ERROR
```

---

## Future Enhancements (TODO markers in code)

- File attachments
- Chat rating / CSAT
- AI auto-reply
- Shipment tracking lookup integration
- Department routing
- WhatsApp fallback
- Typing indicators
- Read receipts
- Agent name display
- Conversation transfer
- Business hours auto-message
