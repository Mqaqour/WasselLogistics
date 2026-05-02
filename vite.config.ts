import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/wassel': {
            target: 'https://wassel.ps',
            changeOrigin: true,
            secure: false,
            rewrite: (requestPath) => requestPath.replace(/^\/api\/wassel/, ''),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                proxyReq.removeHeader('origin');
              });
            },
          },
          '/api/jordan-passport': {
            target: 'https://www.cspd.gov.jo',
            changeOrigin: true,
            secure: false,
            rewrite: (requestPath) => requestPath.replace(/^\/api\/jordan-passport/, ''),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                proxyReq.removeHeader('origin');
              });
            },
          },
          '/api/respond': {
            target: 'https://api.respond.io',
            changeOrigin: true,
            secure: true,
            rewrite: (requestPath) => requestPath.replace(/^\/api\/respond/, ''),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                proxyReq.removeHeader('origin');
                proxyReq.removeHeader('referer');
                proxyReq.setHeader('host', 'api.respond.io');
                proxyReq.setHeader('user-agent', 'curl/7.68.0');
              });
            },
          },
          // Separate route for phone-keyed endpoints — phone digits come in without +
          // proxy rebuilds the correct path with + to avoid %2B encoding by the browser
          '/api/respond-phone': {
            target: 'https://api.respond.io',
            changeOrigin: true,
            secure: true,
            rewrite: (requestPath) => {
              // /api/respond-phone/972599987812/... → /v2/contact/phone:+972599987812/...
              return requestPath.replace(
                /^\/api\/respond-phone\/([0-9]+)(.*)/,
                '/v2/contact/phone:+$1$2'
              );
            },
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                proxyReq.removeHeader('origin');
                proxyReq.removeHeader('referer');
                proxyReq.setHeader('host', 'api.respond.io');
                proxyReq.setHeader('user-agent', 'curl/7.68.0');
              });
            },
          },
          '/api/quickrate': {
            target: 'https://quickrate.wassel.ps',
            changeOrigin: true,
            secure: true,
            rewrite: (requestPath) => requestPath.replace(/^\/api\/quickrate/, ''),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                proxyReq.setHeader('x-api-key', env.QUICKRATE_API_KEY || '');
              });
            },
          },
          '/api/chat': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          },
          '/api/contact': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          },
          '/socket.io': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
            ws: true,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              react: ['react', 'react-dom'],
              ai: ['@google/genai'],
            },
          },
        },
      }
    };
});
