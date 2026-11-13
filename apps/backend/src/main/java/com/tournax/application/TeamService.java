package com.tournax.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tournax.application.dto.CompleteTeamSetupRequest;
import com.tournax.application.dto.IssueSetupTokenResponse;
import com.tournax.application.dto.TeamRow;
import com.tournax.application.dto.TeamSetupStatusResponse;
import com.tournax.application.dto.UpdateTeamRequest;
import com.tournax.domain.model.AuditLogEntry;
import com.tournax.domain.model.Player;
import com.tournax.domain.model.TeamSetupToken;
import com.tournax.domain.model.Tournament;
import com.tournax.domain.model.TournamentPlayer;
import com.tournax.domain.model.TournamentPlayerId;
import com.tournax.domain.model.TournamentStatus;
import com.tournax.domain.repository.AuditLogRepository;
import com.tournax.domain.repository.TeamSetupTokenRepository;
import com.tournax.domain.repository.TournamentPlayerRepository;
import com.tournax.domain.repository.TournamentRepository;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TeamService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final TournamentRepository tournamentRepository;
    private final TournamentPlayerRepository tournamentPlayerRepository;
    private final TeamSetupTokenRepository teamSetupTokenRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public TeamService(
        TournamentRepository tournamentRepository,
        TournamentPlayerRepository tournamentPlayerRepository,
        TeamSetupTokenRepository teamSetupTokenRepository,
        AuditLogRepository auditLogRepository,
        ObjectMapper objectMapper,
        Clock clock
    ) {
        this.tournamentRepository = tournamentRepository;
        this.tournamentPlayerRepository = tournamentPlayerRepository;
        this.teamSetupTokenRepository = teamSetupTokenRepository;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;
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
        if (body.crestUrl() != null || body.primaryColor() != null || body.secondaryColor() != null) {
            entry.setCrest(
                body.crestUrl() != null ? body.crestUrl().trim() : entry.getCrestUrl(),
                body.primaryColor() != null ? body.primaryColor().trim() : entry.getPrimaryColor(),
                body.secondaryColor() != null ? body.secondaryColor().trim() : entry.getSecondaryColor()
            );
        }
        tournamentPlayerRepository.save(entry);

        var after = toRow(entry);
        writeAudit("admin_update_team", playerId, before, after);
        return after;
    }

    @Transactional
    public IssueSetupTokenResponse issueSetupToken(int season, UUID playerId) {
        Tournament tournament = requireSeason(season);
        requireEntry(tournament.getId(), playerId);

        String token = generateToken();
        Instant expiresAt = clock.instant().plus(7, ChronoUnit.DAYS);
        teamSetupTokenRepository.save(TeamSetupToken.issue(token, tournament.getId(), playerId, expiresAt));
        writeAudit("admin_issue_team_setup_token", playerId, null, new IssueSetupTokenResponse(null, expiresAt));
        return new IssueSetupTokenResponse(token, expiresAt);
    }

    @Transactional(readOnly = true)
    public TeamSetupStatusResponse setupStatus(String token) {
        TeamSetupToken entry = teamSetupTokenRepository.findById(token).orElse(null);
        if (entry == null || !entry.isUsable(clock.instant())) {
            return TeamSetupStatusResponse.invalid();
        }
        TournamentPlayer tp =
            tournamentPlayerRepository
                .findById(new TournamentPlayerId(entry.getTournamentId(), entry.getPlayerId()))
                .orElse(null);
        if (tp == null) {
            return TeamSetupStatusResponse.invalid();
        }
        Tournament tournament = tournamentRepository.findById(entry.getTournamentId()).orElse(null);
        boolean locked = tournament == null || tournament.getStatus() != TournamentStatus.registration;
        return new TeamSetupStatusResponse(
            true,
            tp.getPlayer().getName(),
            tp.getPlayer().getAvatarUrl(),
            tp.getTeamName(),
            tp.getCrestUrl(),
            tp.getPrimaryColor(),
            tp.getSecondaryColor(),
            locked
        );
    }

    @Transactional
    public void completeSetup(String token, CompleteTeamSetupRequest body) {
        TeamSetupToken entry =
            teamSetupTokenRepository
                .findById(token)
                .orElseThrow(() -> new IllegalArgumentException("This link is invalid."));
        if (!entry.isUsable(clock.instant())) {
            throw new IllegalArgumentException("This link has expired or was already used.");
        }
        Tournament tournament =
            tournamentRepository
                .findById(entry.getTournamentId())
                .orElseThrow(() -> new IllegalStateException("Tournament not found"));
        if (tournament.getStatus() != TournamentStatus.registration) {
            throw new IllegalArgumentException("Team names can only be set while registration is open. Contact an admin.");
        }
        TournamentPlayer tp =
            tournamentPlayerRepository
                .findById(new TournamentPlayerId(entry.getTournamentId(), entry.getPlayerId()))
                .orElseThrow(() -> new IllegalStateException("Registration not found"));

        String trimmed = body.teamName().trim();
        tp.completeTeamName(trimmed);
        tournamentPlayerRepository.save(tp);

        entry.markUsed(clock.instant());
        teamSetupTokenRepository.save(entry);

        writeAudit("player_complete_team_setup", entry.getPlayerId(), null, body);
    }

    private static String generateToken() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
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
            tp.getTeamName(),
            tp.getCrestUrl(),
            tp.getPrimaryColor(),
            tp.getSecondaryColor(),
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
