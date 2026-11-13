package com.tournax.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistrationRequest(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Size(max = 64) String gamingUsername,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Pattern(regexp = "^[0-9+\\s()-]{10,20}$", message = "Enter a valid phone number") String phone,
    @NotBlank @Size(max = 120) String city,
    @NotBlank @Size(max = 120) String efootballUsername,
    @NotBlank @Size(max = 30) String teamName,
    @Size(max = 2048) String avatarUrl,
    /** Hidden field for bots; must stay empty. JSON key matches frontend when wired. */
    String website
) {
    public String honeypot() {
        return website;
    }
}
