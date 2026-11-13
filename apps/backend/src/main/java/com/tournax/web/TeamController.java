package com.tournax.web;

import com.tournax.application.TeamService;
import com.tournax.application.dto.IssueSetupTokenResponse;
import com.tournax.application.dto.TeamRow;
import com.tournax.application.dto.UpdateTeamRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/seasons/{season}/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public List<TeamRow> list(@PathVariable int season) {
        return teamService.listTeams(season);
    }

    @PatchMapping("/{playerId}")
    public TeamRow update(
        @PathVariable int season,
        @PathVariable UUID playerId,
        @Valid @RequestBody UpdateTeamRequest body
    ) {
        return teamService.updateTeam(season, playerId, body);
    }

    @PostMapping("/{playerId}/setup-link")
    public IssueSetupTokenResponse issueSetupLink(@PathVariable int season, @PathVariable UUID playerId) {
        return teamService.issueSetupToken(season, playerId);
    }
}
