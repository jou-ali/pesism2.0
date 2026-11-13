package com.tournax.application.dto;

import com.tournax.domain.model.MatchStage;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ScheduleFixtureRequest(
    @Min(1) int matchday,
    @NotNull UUID homePlayerId,
    @NotNull UUID awayPlayerId,
    MatchStage stage
) {
    public MatchStage stageOrLeague() {
        return stage != null ? stage : MatchStage.league;
    }
}
