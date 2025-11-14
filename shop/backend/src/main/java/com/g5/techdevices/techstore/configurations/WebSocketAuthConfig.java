package com.g5.techdevices.techstore.configurations;

import com.g5.techdevices.techstore.components.JwtTokenUtil; // Import JwtTokenUtil của bạn
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService; // Import UserDetailsService
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99) // Đảm bảo nó chạy trước bảo mật mặc định
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenUtil jwtTokenUtil; // Sửa: Dùng JwtTokenUtil
    private final UserDetailsService userDetailsService;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                // Chỉ kiểm tra tin nhắn CONNECT
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Lấy token từ header "Authorization" (do frontend gửi)
                    String authHeader = accessor.getFirstNativeHeader("Authorization");

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String jwt = authHeader.substring(7);

                        try {
                            // Sửa: Dùng hàm extractEmail từ JwtTokenUtil
                            String userEmail = jwtTokenUtil.extractEmail(jwt);

                            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                                // Sửa: Dùng hàm validateToken từ JwtTokenUtil
                                if (jwtTokenUtil.validateToken(jwt, userDetails)) {

                                    // Tạo đối tượng Authentication chuẩn
                                    Authentication authentication = new UsernamePasswordAuthenticationToken(
                                            userDetails,
                                            null,
                                            userDetails.getAuthorities()
                                    );

                                    // === DÒNG QUAN TRỌNG NHẤT ===
                                    // Gán Principal (user) cho session WebSocket này
                                    accessor.setUser(authentication);
                                }
                            }
                        } catch (Exception e) {
                            log.error("WebSocket: Xác thực thất bại", e);
                        }
                    }
                }
                return message;
            }
        });
    }
}