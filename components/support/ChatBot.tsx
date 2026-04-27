import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../../types';

type RespondAction = 'chat:open' | 'chat:close';
type RespondEvent = 'chat:opened' | 'chat:closed';

declare global {
    interface Window {
        $respond?: {
            do: (action: RespondAction) => void;
            on: (event: RespondEvent, callback: () => void) => void;
            is?: (state: 'chat:open' | 'chat:closed') => boolean;
        };
    }
}

const RESPOND_WIDGET_SCRIPT_ID = 'respondio__widget';
const RESPOND_WIDGET_BASE_URL = 'https://cdn.respond.io/webchat/widget/widget.js';
const WIDGET_BOOT_TIMEOUT_MS = 10000;
const WIDGET_BOOT_RETRY_MS = 250;

interface ChatBotProps {
    lang: Language;
    isOpen: boolean;
    onClose: () => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
    const channelId = import.meta.env.VITE_RESPONDIO_CHANNEL_ID?.trim();
    const [isWidgetReady, setIsWidgetReady] = useState(Boolean(window.$respond));
    const hasBoundCloseListener = useRef(false);

    useEffect(() => {
        if (!channelId) {
            console.warn('respond.io widget is disabled because VITE_RESPONDIO_CHANNEL_ID is not configured.');
            return;
        }

        if (window.$respond) {
            setIsWidgetReady(true);
            return;
        }

        const existingScript = document.getElementById(RESPOND_WIDGET_SCRIPT_ID) as HTMLScriptElement | null;
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = RESPOND_WIDGET_SCRIPT_ID;
            script.src = `${RESPOND_WIDGET_BASE_URL}?cId=${encodeURIComponent(channelId)}`;
            script.async = true;
            script.onload = () => setIsWidgetReady(Boolean(window.$respond));
            document.body.appendChild(script);
        }

        const startedAt = Date.now();
        const timer = window.setInterval(() => {
            if (window.$respond) {
                setIsWidgetReady(true);
                window.clearInterval(timer);
                return;
            }

            if (Date.now() - startedAt >= WIDGET_BOOT_TIMEOUT_MS) {
                window.clearInterval(timer);
                console.warn('respond.io widget script loaded but the widget API was not detected.');
            }
        }, WIDGET_BOOT_RETRY_MS);

        return () => window.clearInterval(timer);
    }, [channelId]);

    useEffect(() => {
        if (!isWidgetReady || !window.$respond) {
            return;
        }

        window.$respond.do(isOpen ? 'chat:open' : 'chat:close');
    }, [isOpen, isWidgetReady]);

    useEffect(() => {
        if (!isWidgetReady || !window.$respond || hasBoundCloseListener.current) {
            return;
        }

        hasBoundCloseListener.current = true;
        window.$respond.on('chat:closed', onClose);
    }, [isWidgetReady, onClose]);

    return null;
};
