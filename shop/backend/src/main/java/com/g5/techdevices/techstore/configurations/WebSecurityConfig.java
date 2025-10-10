package com.g5.techdevices.techstore.configurations;


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
import org.springframework.security.web.server.SecurityWebFilterChain;

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
                .csrf(AbstractHttpConfigurer::disable)
                .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(requests -> {
                    requests.
                            requestMatchers(
                                String.format("%s/users/register", apiPrefix),
                                String.format("%s/users/login", apiPrefix)
                            )
                            .permitAll()

                            .requestMatchers(GET,
                                    String.format("%s/categories", apiPrefix))
                            .permitAll()

                            .requestMatchers(PUT,
                                    String.format("%s/categories/**", apiPrefix)).hasRole("ADMIN")
                            .requestMatchers(POST,
                                    String.format("%s/categories", apiPrefix)).hasRole("ADMIN")
                            .requestMatchers(DELETE,
                                    String.format("%s/categories/**", apiPrefix)).hasRole("ADMIN")
                            .anyRequest().authenticated();

                });
        return http.build();
    }
}
