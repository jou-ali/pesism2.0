package com.tournax.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tournax.application.dto.TeamRow;
import com.tournax.application.dto.UpdateTeamRequest;
import com.tournax.domain.model.AuditLogEntry;
import com.tournax.domain.model.Player;
import com.tournax.domain.model.Tournament;
import com.tournax.domain.model.TournamentPlayer;
import com.tournax.domain.model.TournamentPlayerId;
import com.tournax.domain.repository.AuditLogRepository;
import com.tournax.domain.repository.TournamentPlayerRepository;
import com.tournax.domain.repository.TournamentRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TeamService {

    private final TournamentRepository tournamentRepository;
    private final TournamentPlayerRepository tournamentPlayerRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public TeamService(
        TournamentRepository tournamentRepository,
        TournamentPlayerRepository tournamentPlayerRepository,
        AuditLogRepository auditLogRepository,
        ObjectMapper objectMapper
    ) {
        this.tournamentRepository = tournamentRepository;
        this.tournamentPlayerRepository = tournamentPlayerRepository;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<TeamRow> listTeams(int season) {
        Tournament tournament = requireSeason(season);
        return tournamentPlayerRepository.findApprovedByTournamentIdWithPlayer(tournament.getId()).stream()
            .map(TeamService::toRow)
            .toList();
    }

    @Transactional
    public TeamRow updateTeam(int season, UUID playerId, UpdateTeamRequest body) {
        Tournament tournament = requireSeason(season);
        TournamentPlayer entry = requireEntry(tournament.getId(), playerId);

        var before = toRow(entry);

        if (body.teamName() != null) {
            String trimmed = body.teamName().trim();
            if (trimmed.isEmpty()) {
                throw new IllegalArgumentException("Team name cannot be blank.");
            }
            entry.setTeamName(trimmed);
        }
        if (body.crestUrl() != null) {
            entry.setCrest(body.crestUrl().isBlank() ? null : body.crestUrl().trim());
        }
        tournamentPlayerRepository.save(entry);

        var after = toRow(entry);
        writeAudit("admin_update_team", playerId, before, after);
        return after;
    }

    private TournamentPlayer requireEntry(UUID tournamentId, UUID playerId) {
        return tournamentPlayerRepository
            .findById(new TournamentPlayerId(tournamentId, playerId))
            .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
    }

    private static TeamRow toRow(TournamentPlayer tp) {
        Player player = tp.getPlayer();
        return new TeamRow(
            player.getId(),
            player.getName(),
            player.getAvatarUrl(),
            tp.getTeamName(),
            tp.getCrestUrl(),
            tp.getCrestUrl() != null
        );
    }

    private void writeAudit(String action, UUID entityId, Object before, Object after) {
        try {
            String beforeJson = before == null ? null : objectMapper.writeValueAsString(before);
            String afterJson = after == null ? null : objectMapper.writeValueAsString(after);
            auditLogRepository.save(new AuditLogEntry(action, "team", entityId, beforeJson, afterJson));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not write audit log", e);
        }
    }

    private Tournament requireSeason(int season) {
        return tournamentRepository
            .findFirstBySeasonOrderByCreatedAtDesc(season)
            .orElseThrow(() -> new IllegalStateException("No tournament for season " + season));
    }
}
