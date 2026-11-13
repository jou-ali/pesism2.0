package com.tournax.application.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record StartMatchdayRequest(@NotNull Instant deadlineAt) {}
