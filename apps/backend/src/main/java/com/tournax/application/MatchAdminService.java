package com.tournax.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tournax.application.dto.AdminMatchDetailDto;
import com.tournax.application.dto.AdminMatchRow;
import com.tournax.application.dto.MatchStatsInput;
import com.tournax.application.dto.RecordMatchRequest;
import com.tournax.application.dto.UpdateMatchRequest;
import com.tournax.domain.model.AuditLogEntry;
import com.tournax.domain.model.FootballMatch;
import com.tournax.domain.model.MatchStage;
import com.tournax.domain.model.MatchStats;
import com.tournax.domain.model.MatchStatus;
import com.tournax.domain.model.Matchday;
import com.tournax.domain.model.Player;
import com.tournax.domain.model.Tournament;
import com.tournax.domain.repository.AuditLogRepository;
import com.tournax.domain.repository.FootballMatchRepository;
import com.tournax.domain.repository.MatchStatsRepository;
import com.tournax.domain.repository.MatchdayRepository;
import com.tournax.domain.repository.PlayerRepository;
import com.tournax.domain.repository.TournamentPlayerRepository;
import com.tournax.domain.repository.TournamentRepository;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MatchAdminService {

    private final TournamentRepository tournamentRepository;
    private final TournamentPlayerRepository tournamentPlayerRepository;
    private final MatchdayRepository matchdayRepository;
    private final FootballMatchRepository footballMatchRepository;
    private final MatchStatsRepository matchStatsRepository;
    private final PlayerRepository playerRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public MatchAdminService(
        TournamentRepository tournamentRepository,
        TournamentPlayerRepository tournamentPlayerRepository,
        MatchdayRepository matchdayRepository,
        FootballMatchRepository footballMatchRepository,
        MatchStatsRepository matchStatsRepository,
        PlayerRepository playerRepository,
        AuditLogRepository auditLogRepository,
        ObjectMapper objectMapper,
        Clock clock
    ) {
        this.tournamentRepository = tournamentRepository;
        this.tournamentPlayerRepository = tournamentPlayerRepository;
        this.matchdayRepository = matchdayRepository;
        this.footballMatchRepository = footballMatchRepository;
        this.matchStatsRepository = matchStatsRepository;
        this.playerRepository = playerRepository;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AdminMatchRow> listMatches(int season) {
        Tournament tournament = requireSeason(season);
        List<FootballMatch> matches =
            footballMatchRepository.findAllByTournamentIdWithMatchday(tournament.getId());
        Map<UUID, Player> playersById =
            playerRepository.findAllById(collectPlayerIds(matches)).stream()
                .collect(Collectors.toMap(Player::getId, Function.identity()));

        return matches.stream()
            .map(m -> toAdminRow(m, playersById, matchStatsRepository.existsById(m.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public AdminMatchDetailDto getMatch(int season, UUID matchId) {
        Tournament tournament = requireSeason(season);
        FootballMatch match =
            footballMatchRepository
                .findByIdWithMatchday(matchId)
                .filter(m -> m.getTournamentId().equals(tournament.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));
        Player home = playerRepository.findById(match.getHomeId()).orElseThrow();
        Player away = playerRepository.findById(match.getAwayId()).orElseThrow();
        MatchStats stats = matchStatsRepository.findById(matchId).orElse(null);
        int matchday = match.getMatchday() != null ? match.getMatchday().getNumber() : 0;
        return new AdminMatchDetailDto(
            match.getId(),
            matchday,
            match.getHomeId(),
            match.getAwayId(),
            home.getName(),
            away.getName(),
            match.getHomeGoals() != null ? match.getHomeGoals() : 0,
            match.getAwayGoals() != null ? match.getAwayGoals() : 0,
            match.getStatus(),
            match.getUpdatedAt(),
            MatchStatsMapper.toInput(stats)
        );
    }

    @Transactional
    public AdminMatchDetailDto updateMatch(int season, UUID matchId, UpdateMatchRequest body) {
        if (body.homeGoals() < 0 || body.awayGoals() < 0) {
            throw new IllegalArgumentException("Goals cannot be negative");
        }
        Tournament tournament = requireSeason(season);
        FootballMatch match =
            footballMatchRepository
                .findById(matchId)
                .filter(m -> m.getTournamentId().equals(tournament.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        var before =
            new UpdateMatchRequest(
                match.getHomeGoals() != null ? match.getHomeGoals() : 0,
                match.getAwayGoals() != null ? match.getAwayGoals() : 0,
                MatchStatsMapper.toInput(matchStatsRepository.findById(matchId).orElse(null))
            );

        match.setHomeGoals(body.homeGoals());
        match.setAwayGoals(body.awayGoals());
        match.touchUpdatedAt(clock.instant());
        footballMatchRepository.save(match);

        if (body.stats() != null && hasAnyStat(body.stats())) {
            MatchStats stats =
                matchStatsRepository.findById(matchId).orElseGet(() -> MatchStats.forMatch(matchId));
            MatchStatsMapper.apply(matchId, body.stats(), stats);
            matchStatsRepository.save(stats);
        } else {
            matchStatsRepository.deleteById(matchId);
        }

        writeAudit("admin_update_match", matchId, before, body);
        return getMatch(season, matchId);
    }

    /**
     * Removes a match entirely (not just its score) — for fixing a mis-scheduled pairing, e.g. the
     * wrong player was picked when the fixture was created. Reschedule the correct pairing afterwards.
     */
    @Transactional
    public void deleteMatch(int season, UUID matchId) {
        Tournament tournament = requireSeason(season);
        FootballMatch match =
            footballMatchRepository
                .findById(matchId)
                .filter(m -> m.getTournamentId().equals(tournament.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));
        boolean hadStats = matchStatsRepository.existsById(matchId);

        matchStatsRepository.deleteById(matchId);
        footballMatchRepository.delete(match);
        writeAudit("admin_delete_match", matchId, toAdminRow(match, Map.of(), hadStats), null);
    }

    @Transactional
    public AdminMatchRow recordMatch(int season, RecordMatchRequest body) {
        if (body.homePlayerId().equals(body.awayPlayerId())) {
            throw new IllegalArgumentException("Home and away must be different players");
        }
        if (body.matchday() < 1) {
            throw new IllegalArgumentException("Matchday must be at least 1");
        }
        if (body.homeGoals() < 0 || body.awayGoals() < 0) {
            throw new IllegalArgumentException("Goals cannot be negative");
        }

        Tournament tournament = requireSeason(season);
        requireApproved(tournament.getId(), body.homePlayerId());
        requireApproved(tournament.getId(), body.awayPlayerId());

        FootballMatch match = resolveScheduledFixture(tournament.getId(), body);

        match.applyAdminResult(body.homeGoals(), body.awayGoals(), clock.instant());
        footballMatchRepository.save(match);

        if (body.stats() != null && hasAnyStat(body.stats())) {
            MatchStats stats = MatchStats.forMatch(match.getId());
            MatchStatsMapper.apply(match.getId(), body.stats(), stats);
            matchStatsRepository.save(stats);
        }

        writeAudit("admin_record_match", match.getId(), null, body);

        Player home = playerRepository.findById(body.homePlayerId()).orElseThrow();
        Player away = playerRepository.findById(body.awayPlayerId()).orElseThrow();
        return new AdminMatchRow(
            match.getId(),
            body.matchday(),
            match.getHomeId(),
            match.getAwayId(),
            home.getName(),
            away.getName(),
            body.homeGoals(),
            body.awayGoals(),
            match.getStatus(),
            clock.instant(),
            body.stats() != null && hasAnyStat(body.stats())
        );
    }

    private static boolean hasAnyStat(MatchStatsInput stats) {
        return stats.homePossessionPct() != null
            || stats.awayPossessionPct() != null
            || stats.homeShots() != null
            || stats.awayShots() != null
            || stats.homeShotsOnTarget() != null
            || stats.awayShotsOnTarget() != null
            || stats.homeFouls() != null
            || stats.awayFouls() != null
            || stats.homeOffsides() != null
            || stats.awayOffsides() != null
            || stats.homeCornerKicks() != null
            || stats.awayCornerKicks() != null
            || stats.homeFreeKicks() != null
            || stats.awayFreeKicks() != null
            || stats.homePasses() != null
            || stats.awayPasses() != null
            || stats.homeSuccessfulPasses() != null
            || stats.awaySuccessfulPasses() != null
            || stats.homeCrosses() != null
            || stats.awayCrosses() != null
            || stats.homeInterceptions() != null
            || stats.awayInterceptions() != null
            || stats.homeTackles() != null
            || stats.awayTackles() != null
            || stats.homeSaves() != null
            || stats.awaySaves() != null;
    }

    private FootballMatch resolveScheduledFixture(UUID tournamentId, RecordMatchRequest body) {
        if (body.matchId() != null) {
            FootballMatch match =
                footballMatchRepository
                    .findById(body.matchId())
                    .filter(m -> m.getTournamentId().equals(tournamentId))
                    .filter(m -> m.getStage() == MatchStage.league)
                    .filter(m -> m.getStatus() == MatchStatus.scheduled)
                    .orElseThrow(() -> new IllegalArgumentException("Scheduled fixture not found or already played."));
            if (!match.getHomeId().equals(body.homePlayerId()) || !match.getAwayId().equals(body.awayPlayerId())) {
                throw new IllegalArgumentException("Selected fixture does not match the submitted players.");
            }
            return match;
        }
        return footballMatchRepository
            .findScheduledLeaguePairing(
                tournamentId,
                body.matchday(),
                body.homePlayerId(),
                body.awayPlayerId(),
                MatchStage.league,
                MatchStatus.scheduled
            )
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "No scheduled fixture for this matchday and pairing. Add it under Admin → Fixtures first."
                    )
            );
    }

    private void requireApproved(UUID tournamentId, UUID playerId) {
        tournamentPlayerRepository
            .findApprovedEntry(tournamentId, playerId)
            .orElseThrow(() -> new IllegalArgumentException("Player is not approved for this season"));
    }

    private void writeAudit(String action, UUID entityId, Object before, Object after) {
        try {
            String beforeJson = before == null ? null : objectMapper.writeValueAsString(before);
            String afterJson = after == null ? null : objectMapper.writeValueAsString(after);
            auditLogRepository.save(new AuditLogEntry(action, "match", entityId, beforeJson, afterJson));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not write audit log", e);
        }
    }

    private static List<UUID> collectPlayerIds(List<FootballMatch> matches) {
        return matches.stream()
            .flatMap(m -> java.util.stream.Stream.of(m.getHomeId(), m.getAwayId()))
            .distinct()
            .toList();
    }

    private AdminMatchRow toAdminRow(FootballMatch match, Map<UUID, Player> playersById, boolean hasStats) {
        Player home = playersById.get(match.getHomeId());
        Player away = playersById.get(match.getAwayId());
        int matchday = match.getMatchday() != null ? match.getMatchday().getNumber() : 0;
        return new AdminMatchRow(
            match.getId(),
            matchday,
            match.getHomeId(),
            match.getAwayId(),
            home != null ? home.getName() : match.getHomeId().toString(),
            away != null ? away.getName() : match.getAwayId().toString(),
            match.getHomeGoals(),
            match.getAwayGoals(),
            match.getStatus(),
            match.getUpdatedAt(),
            hasStats
        );
    }

    private Tournament requireSeason(int season) {
        return tournamentRepository
            .findFirstBySeasonOrderByCreatedAtDesc(season)
            .orElseThrow(() -> new IllegalStateException("No tournament for season " + season));
    }
}
