<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Wassel Logistics

This repo contains the Vite frontend for the Wassel Logistics site plus a lightweight `respond.io` webhook bridge for Custom Channel integrations.

## Run Locally

Prerequisite: Node.js 18+

1. Install dependencies with `npm install`
2. Create `.env` from `.env.example`
3. Start the frontend with `npm run dev`

## respond.io Setup

### Website Chat Widget

Set `VITE_RESPONDIO_CHANNEL_ID` in `.env` using the Website Chat channel ID from `respond.io`.

The app now loads the widget script dynamically and opens or closes it from the custom site chat button in [`components/support/ChatBot.tsx`](./components/support/ChatBot.tsx).

### Custom Channel Webhook Bridge

Run `npm run respondio:bridge` to start the local webhook bridge server.

Use these routes in your custom channel setup:

- Outgoing webhook URL: `https://your-domain/message`
- Incoming webhook endpoint exposed by this bridge: `https://your-domain/webhooks/respondio/incoming`

Required bridge environment variables:

- `RESPONDIO_API_TOKEN`
- `RESPONDIO_CHANNEL_ID`
- `RESPONDIO_INCOMING_WEBHOOK_URL`

Optional bridge environment variables:

- `RESPONDIO_BRIDGE_PORT`
- `CUSTOM_CHAT_OUTGOING_WEBHOOK_URL`

If `CUSTOM_CHAT_OUTGOING_WEBHOOK_URL` is set, outgoing messages from `respond.io` are forwarded there. If it is not set, the bridge still accepts the webhook and returns a generated message ID so you can finish the downstream delivery later.
