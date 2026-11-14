package com.tournax.application.dto;

import java.util.UUID;

public record TeamRow(
    UUID playerId,
    String playerName,
    String avatarUrl,
    String teamName,
    String crestUrl,
    boolean hasCrest
) {}
