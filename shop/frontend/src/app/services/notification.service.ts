import { Injectable, inject } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
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
    // Khai báo client theo kiểu mới
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

        // Nếu đã có client và đang active thì không connect lại
        if (this.client && this.client.active) {
            return;
        }

        // Khởi tạo Client với cấu hình chuẩn object
        this.client = new Client({
            // Dùng webSocketFactory để bọc SockJS
            webSocketFactory: () => new SockJS(this.backendUrl),

            // Cấu hình Header chứa Token
            connectHeaders: {
                'Authorization': `Bearer ${token}`
            },

            // Tắt log debug cho gọn console (hoặc bật lên nếu cần debug)
            debug: (str) => {
                // console.log(str);
            },

            // Tự động connect lại sau 5s nếu mất mạng
            reconnectDelay: 5000,

            // Hàm chạy khi kết nối thành công
            onConnect: (frame) => {
                console.log('Connected to WebSocket (Authenticated)');

                // Hàm xử lý tin nhắn nhận được
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

                // Subscribe kênh chung user
                this.client?.subscribe('/user/queue/notifications', callback);

                // Subscribe kênh Admin nếu có quyền
                if (this.authService.hasRole('ROLE_ADMIN') ||
                    this.authService.hasRole('ROLE_OWNER') ||
                    this.authService.hasRole('ROLE_STAFF')) {

                    this.client?.subscribe('/topic/admin-notifications', callback);
                    console.log("Admin/Staff user connected, subscribing to admin topic.");
                }
            },

            // Xử lý lỗi khi kết nối
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            }
        });

        // Kích hoạt kết nối
        this.client.activate();
    }

    public disconnect() {
        if (this.client) {
            // Deactivate thay cho disconnect
            this.client.deactivate();
            console.log('Disconnected from WebSocket');
        }
    }
}