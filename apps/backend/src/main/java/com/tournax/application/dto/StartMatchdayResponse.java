package com.tournax.application.dto;

import java.time.Instant;
import java.util.List;

public record StartMatchdayResponse(
    int matchday,
    Instant opensAt,
    Instant deadlineAt,
    List<String> missingCrestPlayerNames
) {}
