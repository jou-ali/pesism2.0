package com.tournax.application.dto;

import com.tournax.domain.model.TournamentStatus;
import jakarta.validation.constraints.NotNull;

public record SetTournamentStatusRequest(@NotNull TournamentStatus status) {}
