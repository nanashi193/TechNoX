package com.g5.techdevices.techstore.configurations;


import com.g5.techdevices.techstore.entity.users.Role;
import com.g5.techdevices.techstore.filters.JwtTokenFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import static org.springframework.http.HttpMethod.*;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class WebSecurityConfig {
    private final JwtTokenFilter  jwtTokenFilter;
    @Value("${api.prefix}")
    private String apiPrefix;
    @Bean
    public SecurityFilterChain SecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class)
<<<<<<< HEAD
                .authorizeHttpRequests(requests -> {
                    requests.
                            requestMatchers(
                                    String.format("%s/users/register", apiPrefix),
                                    String.format("%s/users/login", apiPrefix)
                            ).permitAll()
                            .requestMatchers(GET,
                                    String.format("%s/categories", apiPrefix))
                            .permitAll()
                            // ✅ Cho preflight
                            .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()

                            .requestMatchers(POST, apiPrefix + "/users/resend-verification").permitAll()
                            .requestMatchers(POST, apiPrefix + "/users/verify-email").permitAll()

                            .requestMatchers(GET,
                                    String.format("%s/products", apiPrefix))
                            .permitAll()
=======
                .authorizeHttpRequests(auth -> auth
                        // Public POST endpoints
                        .requestMatchers(POST, String.format("%s/users/register", apiPrefix)).permitAll()
                        .requestMatchers(POST, String.format("%s/users/login", apiPrefix)).permitAll()
                        .requestMatchers(POST, String.format("%s/users/resetPassword", apiPrefix)).permitAll()
>>>>>>> origin/develop

                        // Public GET endpoints
                        .requestMatchers(GET, String.format("%s/categories", apiPrefix)).permitAll()
                        .requestMatchers(GET, String.format("%s/products", apiPrefix)).permitAll()

                        // Protected endpoints
                        .requestMatchers(PUT, String.format("%s/users/**", apiPrefix)).authenticated()
                        .requestMatchers(GET, String.format("%s/users", apiPrefix)).hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(DELETE, String.format("%s/users/**", apiPrefix)).hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(PUT, String.format("%s/users/restore/**", apiPrefix)).hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(PUT, String.format("%s/categories/**", apiPrefix)).hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(POST, String.format("%s/categories", apiPrefix)).hasAnyRole(Role.ADMIN, Role.OWNER)
                        .requestMatchers(DELETE, String.format("%s/categories/**", apiPrefix)).hasAnyRole(Role.ADMIN, Role.OWNER)

                        // Default fallback
                        .anyRequest().authenticated()
                );

        return http.build();
    }
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOrigin("http://localhost:4200");
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}
