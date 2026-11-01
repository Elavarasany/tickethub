package com.example.tickethub.admin;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Configuration
public class AdminSecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(adminSessionFilter(),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public OncePerRequestFilter adminSessionFilter() {
        return new OncePerRequestFilter() {

            @Override
            protected void doFilterInternal(
                    HttpServletRequest request,
                    HttpServletResponse response,
                    jakarta.servlet.FilterChain filterChain)
                    throws IOException, jakarta.servlet.ServletException {

                String path = request.getRequestURI();

                boolean protectedPath =
                        path.equals("/admin/admin.html") ||
                                path.startsWith("/api/admin/tables") ||
                                path.equals("/api/seats/generate");

                boolean loggedIn =
                        request.getSession(false) != null &&
                                Boolean.TRUE.equals(
                                        request.getSession(false)
                                                .getAttribute("ADMIN_LOGGED_IN")
                                );

                if (protectedPath && !loggedIn) {

                    if (path.startsWith("/api/")) {
                        response.setStatus(401);
                        response.setContentType("application/json");
                        response.getWriter().write(
                                "{\"message\":\"Admin login required\"}"
                        );
                    } else {
                        response.sendRedirect("/admin/login.html");
                    }

                    return;
                }

                filterChain.doFilter(request, response);
            }
        };
    }
}