package com.g5.techdevices.techstore.filters;

import com.g5.techdevices.techstore.components.JwtTokenUtil;
import com.g5.techdevices.techstore.entity.users.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.util.Pair;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.*;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtTokenFilter extends OncePerRequestFilter {
    @Value("${api.prefix}")
    private String apiPrefix;
    private final UserDetailsService userDetailsService;
    private final JwtTokenUtil jwtTokenUtil;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            if(isBypassToken(request)) {
                filterChain.doFilter(request, response);
                return;
            }
            final String authHeader = request.getHeader("Authorization");
            if(authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                return;
            }
            final String token = authHeader.substring(7);
            final String email = jwtTokenUtil.extractEmail(token);
            if(email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                User userDetails = (User) userDetailsService.loadUserByUsername(email);
                if(jwtTokenUtil.validateToken(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(userDetails,
                                    null,
                                    userDetails.getAuthorities());
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            }
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            filterChain.doFilter(request, response);
        }
    }
    private boolean isBypassToken(@NonNull HttpServletRequest request) {
        final List<Pair<String, String>> bypassTokens = Arrays.asList(
                Pair.of(String.format("%s/product", apiPrefix), "GET"),
                Pair.of(String.format("%s/categories", apiPrefix), "GET"),
                Pair.of(String.format("%s/users/register", apiPrefix), "POST"),
                Pair.of(String.format("%s/users/login", apiPrefix), "POST"),
                Pair.of(String.format("%s/users/forgot-password", apiPrefix), "POST"),
                Pair.of(String.format("%s/users/reset-password", apiPrefix), "POST"),
                Pair.of(String.format("%s/users/verify-email", apiPrefix), "POST"),
                Pair.of(String.format("%s/users/resend-verification", apiPrefix), "POST")
        );


                Pair.of(String.format("%s/users/resetPassword", apiPrefix), "POST");
        for (Pair<String, String> bypassToken : bypassTokens) {
            if (request.getServletPath().contains(bypassToken.getFirst())
                    && request.getMethod().equalsIgnoreCase(bypassToken.getSecond())) {
                System.out.println("apiPrefix=" + apiPrefix);
                System.out.println("ServletPath=" + request.getServletPath());
                return true;
            }
        }
        return false;
    }
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        final String method = request.getMethod();
        final String uri = request.getRequestURI();

        // chuẩn hoá base: /api/v1/users
        final String pfx = apiPrefix.startsWith("/") ? apiPrefix : "/" + apiPrefix;
        final String base = pfx + "/users";

        // Bỏ qua preflight
        if ("OPTIONS".equalsIgnoreCase(method)) return true;

        // helper check path == "/... " hoặc "/.../"
        java.util.function.Predicate<String> is = path ->
                uri.equals(path) || uri.equals(path + "/") || uri.startsWith(path + "?");

        //  Bỏ qua các route public
        if ("POST".equalsIgnoreCase(method) && (
                is.test(base + "/register") ||
                        is.test(base + "/login") ||
                        is.test(base + "/forgot-password") ||
                        is.test(base + "/reset-password") ||
                        is.test(base + "/verify-email") ||
                        is.test(base + "/resend-verification")
        )) return true;


        return false;
    }

}
