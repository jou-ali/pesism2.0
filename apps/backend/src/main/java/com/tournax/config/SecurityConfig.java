package com.tournax.config;

import com.tournax.web.security.AdminApiKeyFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, AdminApiKeyFilter adminApiKeyFilter) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(
                auth ->
                    auth.requestMatchers("/api/v1/health")
                        .permitAll()
                        .requestMatchers("/api/v1/team-setup/*")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/seasons/*/registration")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/seasons/*/registration")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/seasons/*/registration/*/verify/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/seasons/*/competition")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/seasons/*/matches/*")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/seasons/*/grievances")
                        .permitAll()
                        .requestMatchers("/api/v1/admin/**")
                        .authenticated()
                        .anyRequest()
                        .denyAll()
            )
            .addFilterBefore(adminApiKeyFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
