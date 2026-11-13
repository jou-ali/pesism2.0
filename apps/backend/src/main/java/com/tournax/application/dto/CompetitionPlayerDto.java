package com.tournax.application.dto;

import java.util.UUID;

public record CompetitionPlayerDto(
    UUID id,
    String name,
    String gamingUsername,
    String city,
    String avatarUrl,
    String teamName,
    String crestUrl,
    String primaryColor,
    String secondaryColor
) {}
