package com.tournax.web;

import com.tournax.application.CompetitionService;
import com.tournax.application.dto.CompetitionResponse;
import com.tournax.application.dto.MatchDetailResponse;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/seasons/{season}")
public class SeasonController {

    private final CompetitionService competitionService;

    public SeasonController(CompetitionService competitionService) {
        this.competitionService = competitionService;
    }

    @GetMapping("/competition")
    public CompetitionResponse competition(@PathVariable int season) {
        return competitionService.getCompetition(season);
    }

    @GetMapping("/matches/{matchId}")
    public MatchDetailResponse matchDetail(@PathVariable int season, @PathVariable UUID matchId) {
        return competitionService.getMatchDetail(season, matchId);
    }
}
