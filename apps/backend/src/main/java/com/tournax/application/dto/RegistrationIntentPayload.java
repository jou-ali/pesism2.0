package com.tournax.application.dto;

public record RegistrationIntentPayload(
    String name,
    String gamingUsername,
    String efootballUsername,
    String city,
    String teamName,
    String avatarUrl
) {
    public static RegistrationIntentPayload from(RegistrationRequest request) {
        return new RegistrationIntentPayload(
            request.name().trim(),
            request.gamingUsername().trim(),
            request.efootballUsername() != null ? request.efootballUsername().trim() : null,
            request.city() != null ? request.city().trim() : null,
            request.teamName().trim(),
            request.avatarUrl()
        );
    }

    public RegistrationRequest toRequest(String email, String phone, String honeypot) {
        String efb = efootballUsername != null && !efootballUsername.isBlank() ? efootballUsername : gamingUsername;
        return new RegistrationRequest(
            name,
            gamingUsername,
            email,
            phone,
            city,
            efb,
            teamName,
            avatarUrl,
            honeypot
        );
    }
}
