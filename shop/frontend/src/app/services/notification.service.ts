import { Injectable } from '@angular/core';
import * as Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
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

    // Dùng Subject để "đẩy" thông báo ra các component
    public notificationSubject = new Subject<NotificationDTO>();

    constructor() { }

    public connect() {
        // Chỉ kết nối nếu là admin/staff (bạn có thể kiểm tra role ở đây)
        // Và chỉ kết nối nếu chưa kết nối
        if (this.stompClient && this.stompClient.connected) {
            return;
        }

        const socket = new SockJS(this.backendUrl);
        this.stompClient = Stomp.over(socket);

        // Tắt log debug của STOMP
        this.stompClient.debug = () => {};

        this.stompClient.connect({}, (frame) => {
            console.log('Connected to WebSocket: ' + frame);

            // Lắng nghe kênh /topic/admin-notifications
            this.stompClient?.subscribe('/topic/admin-notifications', (message) => {
                const notification: NotificationDTO = JSON.parse(message.body);

                // Đẩy thông báo ra cho ai đang lắng nghe
                this.notificationSubject.next(notification);
            });
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