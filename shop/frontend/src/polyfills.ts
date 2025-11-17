// src/polyfills.ts

// Fix lỗi "global is not defined" cho stompjs
(window as any).global = window;

// Fix lỗi "Buffer is not defined" (bạn nên thêm luôn)
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;