package com.tournax.application.dto;

import jakarta.validation.constraints.Size;

public record UpdateTeamRequest(
    @Size(max = 30) String teamName,
    @Size(max = 2048) String crestUrl,
    @Size(max = 9) String primaryColor,
    @Size(max = 9) String secondaryColor
) {}
