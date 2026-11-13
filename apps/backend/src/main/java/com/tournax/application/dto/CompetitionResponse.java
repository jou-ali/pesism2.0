package com.tournax.application.dto;

import com.tournax.domain.model.TournamentStatus;
import java.util.List;

public record CompetitionResponse(
    int season,
    int knockoutQualifiers,
    int pointsWin,
    int pointsDraw,
    int pointsLoss,
    TournamentStatus status,
    Integer currentMatchday,
    int totalMatchdays,
    List<CompetitionPlayerDto> players,
    List<CompetitionMatchDto> matches
) {}
