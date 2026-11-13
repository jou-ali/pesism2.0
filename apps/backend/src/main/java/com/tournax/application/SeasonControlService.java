package com.tournax.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tournax.application.dto.CloseMatchdayResponse;
import com.tournax.application.dto.StartMatchdayRequest;
import com.tournax.application.dto.StartMatchdayResponse;
import com.tournax.domain.model.AuditLogEntry;
import com.tournax.domain.model.FootballMatch;
import com.tournax.domain.model.Matchday;
import com.tournax.domain.model.MatchStatus;
import com.tournax.domain.model.Tournament;
import com.tournax.domain.model.TournamentPlayer;
import com.tournax.domain.model.TournamentStatus;
import com.tournax.domain.repository.AuditLogRepository;
import com.tournax.domain.repository.FootballMatchRepository;
import com.tournax.domain.repository.MatchdayRepository;
import com.tournax.domain.repository.TournamentPlayerRepository;
import com.tournax.domain.repository.TournamentRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SeasonControlService {

    private final TournamentRepository tournamentRepository;
    private final TournamentPlayerRepository tournamentPlayerRepository;
    private final MatchdayRepository matchdayRepository;
    private final FootballMatchRepository footballMatchRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public SeasonControlService(
        TournamentRepository tournamentRepository,
        TournamentPlayerRepository tournamentPlayerRepository,
        MatchdayRepository matchdayRepository,
        FootballMatchRepository footballMatchRepository,
        AuditLogRepository auditLogRepository,
        ObjectMapper objectMapper,
        Clock clock
    ) {
        this.tournamentRepository = tournamentRepository;
        this.tournamentPlayerRepository = tournamentPlayerRepository;
        this.matchdayRepository = matchdayRepository;
        this.footballMatchRepository = footballMatchRepository;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Transactional
    public TournamentStatus setStatus(int season, TournamentStatus status) {
        Tournament tournament = requireSeason(season);
        TournamentStatus before = tournament.getStatus();
        tournament.setStatus(status);
        tournamentRepository.save(tournament);
        writeAudit("admin_set_tournament_status", tournament.getId(), before, status);
        return tournament.getStatus();
    }

    @Transactional
    public StartMatchdayResponse startMatchday(int season, int matchday, StartMatchdayRequest body) {
        if (matchday < 1) {
            throw new IllegalArgumentException("Matchday must be at least 1");
        }
        Tournament tournament = requireSeason(season);
        List<TournamentPlayer> approved =
            tournamentPlayerRepository.findApprovedByTournamentIdWithPlayer(tournament.getId());

        if (matchday == 1) {
            List<String> missingTeamNames =
                approved.stream()
                    .filter(tp -> tp.getTeamName() == null || tp.getTeamName().isBlank())
                    .map(tp -> tp.getPlayer().getName())
                    .toList();
            if (!missingTeamNames.isEmpty()) {
                throw new IllegalArgumentException(
                    "Every approved player needs a team name before matchday 1 can start. Missing: "
                        + String.join(", ", missingTeamNames)
                );
            }
        }

        List<String> missingCrests =
            approved.stream().filter(tp -> tp.getCrestUrl() == null).map(tp -> tp.getPlayer().getName()).toList();

        Instant now = clock.instant();
        Matchday entry =
            matchdayRepository
                .findByTournamentIdAndNumber(tournament.getId(), matchday)
                .orElseGet(() -> matchdayRepository.save(new Matchday(UUID.randomUUID(), tournament.getId(), matchday)));
        entry.open(now, body.deadlineAt());
        matchdayRepository.save(entry);

        tournament.setCurrentMatchday(matchday);
        tournamentRepository.save(tournament);

        writeAudit("admin_start_matchday", entry.getId(), null, body);
        return new StartMatchdayResponse(matchday, now, body.deadlineAt(), missingCrests);
    }

    @Transactional
    public CloseMatchdayResponse closeMatchday(int season) {
        Tournament tournament = requireSeason(season);
        Integer matchday = tournament.getCurrentMatchday();
        if (matchday == null) {
            throw new IllegalArgumentException("No matchday is currently open.");
        }
        Matchday entry =
            matchdayRepository
                .findByTournamentIdAndNumber(tournament.getId(), matchday)
                .orElseThrow(() -> new IllegalStateException("Matchday not found"));

        List<FootballMatch> unplayed =
            footballMatchRepository.findByTournamentIdAndMatchdayIdAndStatusIn(
                tournament.getId(),
                entry.getId(),
                List.of(MatchStatus.scheduled, MatchStatus.pending_confirmation)
            );

        Instant now = clock.instant();
        for (FootballMatch match : unplayed) {
            match.markDisputed(now);
            footballMatchRepository.save(match);
        }

        writeAudit("admin_close_matchday", entry.getId(), null, new CloseMatchdayResponse(matchday, unplayed.size()));
        return new CloseMatchdayResponse(matchday, unplayed.size());
    }

    private void writeAudit(String action, UUID entityId, Object before, Object after) {
        try {
            String beforeJson = before == null ? null : objectMapper.writeValueAsString(before);
            String afterJson = after == null ? null : objectMapper.writeValueAsString(after);
            auditLogRepository.save(new AuditLogEntry(action, "tournament", entityId, beforeJson, afterJson));
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
