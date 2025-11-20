import { Injectable, inject } from '@angular/core';
import * as Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import {ToastService} from "../shared/toast/toast.service";
import {AuthService} from "./auth.service";
// import { Subject } from 'rxjs';
export interface NotificationDTO {
    message: string;
    link: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private stompClient: Stomp.Client | null = null;
    private backendUrl = 'https://api.technox.space/ws';

    private toastService = inject(ToastService);
    private authService = inject(AuthService);
    constructor() { }

    public connect() {
        if (this.stompClient && this.stompClient.connected) {
            return;
        }
        const token = this.authService.token;
        if (!token) {
            console.log('Không thể kết nối WebSocket: Chưa đăng nhập.');
            return;
        }
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        const socket = new SockJS(this.backendUrl);
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = () => {};

        this.stompClient.connect(headers, (frame) => {
            console.log('Connected to WebSocket (Authenticated): ' + frame);
            const callback = (message: Stomp.Message) => {
                const notification: NotificationDTO = JSON.parse(message.body);
                this.toastService.show(
                    notification.message,
                    notification.link,
                    'info',
                    30000
                );
            };
            this.stompClient?.subscribe('/user/queue/notifications', callback);

            if (this.authService.hasRole('ROLE_ADMIN') ||
                this.authService.hasRole('ROLE_OWNER') ||
                this.authService.hasRole('ROLE_STAFF')) {

                this.stompClient?.subscribe('/topic/admin-notifications', callback);
                console.log("Admin/Staff user connected, subscribing to admin topic.");
            }
        });
    }

    public disconnect() {
        if (this.stompClient) {
            this.stompClient.disconnect(() => {
                console.log('Disconnected from WebSocket');
            });
            this.stompClient = null;
        }
    }
}