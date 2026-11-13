package com.tournax.application.dto;

import com.tournax.domain.model.MatchStage;
import com.tournax.domain.model.MatchStatus;
import java.util.UUID;

public record CompetitionMatchDto(
    UUID id,
    int matchday,
    MatchStage stage,
    UUID homeId,
    UUID awayId,
    Integer homeGoals,
    Integer awayGoals,
    MatchStatus status
) {}
