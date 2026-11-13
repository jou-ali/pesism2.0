package com.tournax.application.dto;

import java.util.UUID;

public record TeamRow(
    UUID playerId,
    String playerName,
    String teamName,
    String crestUrl,
    String primaryColor,
    String secondaryColor,
    boolean hasCrest
) {}
