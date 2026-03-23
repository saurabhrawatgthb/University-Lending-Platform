import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = 'http://localhost:8080/ws';

export class WebSocketService {
    private client: Client;

    constructor(
        private onDirectNotification: (payload: any) => void,
        private onLocalBroadcast: (payload: any) => void,
        private userId: string,
        private locationTag: string
    ) {
        this.client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('STOMP connected');
                
                // Subscribe to direct personal notifications
                if (this.userId) {
                    this.client.subscribe(`/user/${this.userId}/queue/notifications`, (message: IMessage) => {
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
