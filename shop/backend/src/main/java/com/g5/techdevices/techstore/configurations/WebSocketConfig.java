package com.g5.techdevices.techstore.configurations;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Đây là "kênh" mà server sẽ GỬI tin nhắn (frontend sẽ lắng nghe)
        registry.enableSimpleBroker("/topic");
        // Đây là tiền tố cho các endpoint MÀ frontend gửi lên (ko cần cho TH này)
        // registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Đây là endpoint mà frontend sẽ KẾT NỐI tới
        // Dùng .withSockJS() để hỗ trợ các trình duyệt cũ
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }
}
