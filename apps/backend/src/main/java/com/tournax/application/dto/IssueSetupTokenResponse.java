package com.tournax.application.dto;

import java.time.Instant;

public record IssueSetupTokenResponse(String token, Instant expiresAt) {}
