package com.g5.techdevices.techstore.configurations;

import com.g5.techdevices.techstore.entity.users.Role;
import com.g5.techdevices.techstore.filters.JwtTokenFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.springframework.http.HttpMethod.*;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class WebSecurityConfig {

    private final JwtTokenFilter jwtTokenFilter;

    @Value("${api.prefix}")
    private String apiPrefix; // ví dụ: /api/v1
    @Value("${app.frontend.url}")
    private String publicFrontendUrl;

    @Bean
    public SecurityFilterChain SecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)

                // Stateless cho JWT
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Ủy quyền
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(POST, apiPrefix + "/auth/me").authenticated()
                        // Health/Probe (để kiểm tra nhanh)
                        .requestMatchers(GET, apiPrefix + "/_health/**").permitAll()
                        .requestMatchers(GET, apiPrefix + "/_probe/**").permitAll()
                        .requestMatchers(GET, "/actuator/**").permitAll()

                        // Cho preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(GET, "/ws/**").permitAll()
                        .requestMatchers(POST, "/ws/**").permitAll()

                        // Auth public
                        .requestMatchers(POST, apiPrefix + "/users/register").permitAll()
                        .requestMatchers(POST, apiPrefix + "/users/login").permitAll()
                        .requestMatchers(POST, apiPrefix + "/users/forgot-password").permitAll()
                        .requestMatchers(POST, apiPrefix + "/users/reset-password").permitAll()
                        .requestMatchers(POST, apiPrefix + "/users/resend-verification").permitAll()
                        .requestMatchers(GET, apiPrefix + "/users/verify-email").permitAll()

                        // Sản phẩm/public GET
                        .requestMatchers(GET, apiPrefix + "/categories").permitAll()
                        .requestMatchers(GET, apiPrefix + "/products/**").permitAll()
                        .requestMatchers(GET, apiPrefix + "/customer/products/**").permitAll()

                        // PayOS endpoints
                        .requestMatchers(POST, apiPrefix + "/bills/{billId}/pay").authenticated() // tạo link thanh toán
                        .requestMatchers(POST, apiPrefix + "/bills/pay/webhook").permitAll() // PayOS gọi vào
                        .requestMatchers(GET, apiPrefix + "/bills/pay/webhook").permitAll()
                        .requestMatchers(GET, apiPrefix + "/bills/status/**").permitAll() // FE tra cứu

                        // Quản trị sản phẩm
                        .requestMatchers(POST, apiPrefix + "/products").hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(POST, apiPrefix + "/products/uploads/**").hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(POST, apiPrefix + "/products/*/variants").hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(POST, apiPrefix + "/products/*/variants/**").hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(DELETE, apiPrefix + "/products/*").hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(DELETE, apiPrefix + "/products/*/images/**").hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(PUT, apiPrefix + "/products/*/thumbnail/from-image/*")
                        .hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(PUT, apiPrefix + "/products/**").hasAnyRole(Role.ADMIN, Role.OWNER)

                        // Bills
                        .requestMatchers(POST, apiPrefix + "/bills").authenticated()
                        .requestMatchers(POST, apiPrefix + "/bills/*/confirm-cod").authenticated()
                        .requestMatchers(POST, apiPrefix + "/bills/*/confirm-payos").authenticated()
                        // Quản trị Users/Categories
                        .requestMatchers(GET, apiPrefix + "/bills/my-orders").authenticated()
                        .requestMatchers(PUT, apiPrefix + "/bills/my-orders/*/cancel").authenticated()
                        .requestMatchers(PUT, apiPrefix + "/bills/my-orders/*/confirm-received").authenticated()
                        .requestMatchers(GET, apiPrefix + "/bills/admin").hasAnyRole(Role.ADMIN, Role.OWNER, Role.STAFF)
                        .requestMatchers(PATCH, apiPrefix + "/bills/*/assign-staff").hasAnyRole(Role.ADMIN, Role.OWNER, Role.STAFF)
                        .requestMatchers(GET, apiPrefix + "/bills/staff/my-orders").hasAnyRole(Role.SHIPPING_STAFF)
                        .requestMatchers(PUT, apiPrefix + "/bills/staff/complete/*").hasAnyRole(Role.SHIPPING_STAFF)
                        .requestMatchers(PUT, apiPrefix + "/users/**").authenticated()
                        .requestMatchers(GET, apiPrefix + "/users").hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(GET, apiPrefix + "/users/staff").hasAnyRole(Role.ADMIN, Role.OWNER, Role.STAFF)
                        .requestMatchers(DELETE, apiPrefix + "/users/**").hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(PATCH, apiPrefix + "/users/**").hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(PUT, apiPrefix + "/users/restore/**").hasAnyRole(Role.ADMIN, Role.OWNER)

                        .requestMatchers(PUT, apiPrefix + "/categories/**").hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(POST, apiPrefix + "/categories").hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(DELETE, apiPrefix + "/categories/**").hasAnyRole(Role.ADMIN, Role.OWNER)

                        // Mặc định: cần auth
                        .anyRequest().authenticated())

                // Gắn JWT filter
                .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOrigin("http://localhost:4200");
        configuration.addAllowedOrigin(publicFrontendUrl);
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}