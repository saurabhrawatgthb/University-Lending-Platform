import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// WebSocket URL (Reads VITE_WS_URL, dynamically infers from API base, or falls back to relative/localhost)
const getWsUrl = () => {
    if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    if (apiBase && apiBase.startsWith('http')) {
        // Strip trailing slash and api path, then append /ws
        return apiBase.replace(/\/api\/v1\/?$/, '/ws').replace(/\/api\/?$/, '/ws');
    }
    return import.meta.env.PROD ? '/ws' : 'http://localhost:8080/ws';
};

const WS_URL = getWsUrl();

export class WebSocketService {
    private client: Client;
    private onDirectNotification: (payload: any) => void;
    private onLocalBroadcast: (payload: any) => void;
    private userId: string;
    private locationTag: string;

    constructor(
        onDirectNotification: (payload: any) => void,
        onLocalBroadcast: (payload: any) => void,
        userId: string,
        locationTag: string
    ) {
        this.onDirectNotification = onDirectNotification;
        this.onLocalBroadcast = onLocalBroadcast;
        this.userId = userId;
        this.locationTag = locationTag;

        this.client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('STOMP connected');
                
                // Subscribe to direct personal notifications using the explicit user topic path
                if (this.userId) {
                    this.client.subscribe(`/topic/user/${this.userId}/notifications`, (message: IMessage) => {
                        this.onDirectNotification(JSON.parse(message.body));
                    });
                }

                // Subscribe to local block broadcasts
                if (this.locationTag) {
                    const saneTag = this.locationTag.replace(/\s+/g, '');
                    this.client.subscribe(`/topic/requests/${saneTag}`, (message: IMessage) => {
                        this.onLocalBroadcast(JSON.parse(message.body));
                    });
                }

                // Subscribe to campus-wide broadcasts
                this.client.subscribe('/topic/requests/all', (message: IMessage) => {
                    this.onLocalBroadcast(JSON.parse(message.body));
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });
    }

    public connect() {
        this.client.activate();
    }

    public disconnect() {
        this.client.deactivate();
    }
}
