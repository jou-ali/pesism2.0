package com.tournax.application.dto;

import com.tournax.domain.model.MatchStage;
import com.tournax.domain.model.MatchStatus;
import java.util.UUID;

public record MatchDetailResponse(
    UUID id,
    int matchday,
    MatchStage stage,
    MatchStatus status,
    MatchSideDto home,
    MatchSideDto away,
    Integer homeGoals,
    Integer awayGoals,
    MatchStatsInput stats
) {}
