import { Injectable, inject } from '@angular/core';
import { Client, IMessage, IFrame } from '@stomp/stompjs'; // Thêm IFrame vào import
import SockJS from 'sockjs-client';
import { ToastService } from "../shared/toast/toast.service";
import { AuthService } from "./auth.service";

export interface NotificationDTO {
    message: string;
    link: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private client: Client | null = null;
    private backendUrl = 'https://api.technox.site/ws';

    private toastService = inject(ToastService);
    private authService = inject(AuthService);

    constructor() { }

    public connect() {
        const token = this.authService.token;

        if (!token) {
            console.log('Không thể kết nối WebSocket: Chưa đăng nhập.');
            return;
        }

        if (this.client && this.client.active) {
            return;
        }

        this.client = new Client({
            webSocketFactory: () => new SockJS(this.backendUrl),
            connectHeaders: {
                'Authorization': `Bearer ${token}`
            },
            // FIX LỖI 1: Thêm kiểu 'string' cho str
            debug: (str: string) => {
                // console.log(str);
            },
            reconnectDelay: 5000,

            // FIX LỖI 2: Thêm kiểu 'IFrame' cho frame
            onConnect: (frame: IFrame) => {
                console.log('Connected to WebSocket (Authenticated)');

                const callback = (message: IMessage) => {
                    if (message.body) {
                        const notification: NotificationDTO = JSON.parse(message.body);
                        this.toastService.show(
                            notification.message,
                            notification.link,
                            'info',
                            30000
                        );
                    }
                };

                this.client?.subscribe('/user/queue/notifications', callback);

                if (this.authService.hasRole('ROLE_ADMIN') ||
                    this.authService.hasRole('ROLE_OWNER') ||
                    this.authService.hasRole('ROLE_STAFF')) {

                    this.client?.subscribe('/topic/admin-notifications', callback);
                    console.log("Admin/Staff user connected, subscribing to admin topic.");
                }
            },

            // FIX LỖI 3: Thêm kiểu 'IFrame' cho frame
            onStompError: (frame: IFrame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            }
        });

        this.client.activate();
    }

    public disconnect() {
        if (this.client) {
            this.client.deactivate();
            console.log('Disconnected from WebSocket');
        }
    }
}