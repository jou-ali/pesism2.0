package com.tournax.web;

import com.tournax.application.SeasonControlService;
import com.tournax.application.dto.CloseMatchdayResponse;
import com.tournax.application.dto.SetTournamentStatusRequest;
import com.tournax.application.dto.StartMatchdayRequest;
import com.tournax.application.dto.StartMatchdayResponse;
import com.tournax.domain.model.TournamentStatus;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/seasons/{season}/season-control")
public class SeasonControlController {

    private final SeasonControlService seasonControlService;

    public SeasonControlController(SeasonControlService seasonControlService) {
        this.seasonControlService = seasonControlService;
    }

    @PatchMapping("/status")
    public TournamentStatus setStatus(@PathVariable int season, @Valid @RequestBody SetTournamentStatusRequest body) {
        return seasonControlService.setStatus(season, body.status());
    }

    @PostMapping("/matchdays/{matchday}/start")
    public StartMatchdayResponse startMatchday(
        @PathVariable int season,
        @PathVariable int matchday,
        @Valid @RequestBody StartMatchdayRequest body
    ) {
        return seasonControlService.startMatchday(season, matchday, body);
    }

    @PostMapping("/matchdays/current/close")
    public CloseMatchdayResponse closeMatchday(@PathVariable int season) {
        return seasonControlService.closeMatchday(season);
    }
}
