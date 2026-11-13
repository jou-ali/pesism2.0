package com.tournax.web;

import com.tournax.application.TeamService;
import com.tournax.application.dto.CompleteTeamSetupRequest;
import com.tournax.application.dto.TeamSetupStatusResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Public, token-gated — the one-time "complete your team" link an admin hands a player. */
@RestController
@RequestMapping("/api/v1/team-setup/{token}")
public class TeamSetupController {

    private final TeamService teamService;

    public TeamSetupController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public TeamSetupStatusResponse status(@PathVariable String token) {
        return teamService.setupStatus(token);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void complete(@PathVariable String token, @Valid @RequestBody CompleteTeamSetupRequest body) {
        teamService.completeSetup(token, body);
    }
}
