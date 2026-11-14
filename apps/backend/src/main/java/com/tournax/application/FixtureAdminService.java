package com.tournax.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tournax.application.dto.AdminMatchRow;
import com.tournax.application.dto.GenerateFixturesResponse;
import com.tournax.application.dto.ScheduleFixtureRequest;
import com.tournax.domain.model.AuditLogEntry;
import com.tournax.domain.model.FootballMatch;
import com.tournax.domain.model.MatchStage;
import com.tournax.domain.model.MatchStatus;
import com.tournax.domain.model.Matchday;
import com.tournax.domain.model.Player;
import com.tournax.domain.model.Tournament;
import com.tournax.domain.model.TournamentPlayer;
import com.tournax.domain.repository.AuditLogRepository;
import com.tournax.domain.repository.FootballMatchRepository;
import com.tournax.domain.repository.MatchdayRepository;
import com.tournax.domain.repository.PlayerRepository;
import com.tournax.domain.repository.TournamentPlayerRepository;
import com.tournax.domain.repository.TournamentRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FixtureAdminService {

    private final TournamentRepository tournamentRepository;
    private final TournamentPlayerRepository tournamentPlayerRepository;
    private final MatchdayRepository matchdayRepository;
    private final FootballMatchRepository footballMatchRepository;
    private final PlayerRepository playerRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public FixtureAdminService(
        TournamentRepository tournamentRepository,
        TournamentPlayerRepository tournamentPlayerRepository,
        MatchdayRepository matchdayRepository,
        FootballMatchRepository footballMatchRepository,
        PlayerRepository playerRepository,
        AuditLogRepository auditLogRepository,
        ObjectMapper objectMapper
    ) {
        this.tournamentRepository = tournamentRepository;
        this.tournamentPlayerRepository = tournamentPlayerRepository;
        this.matchdayRepository = matchdayRepository;
        this.footballMatchRepository = footballMatchRepository;
        this.playerRepository = playerRepository;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public GenerateFixturesResponse generateLeagueFixtures(int season) {
        Tournament tournament = requireSeason(season);
        if (footballMatchRepository.countByTournamentIdAndStage(tournament.getId(), MatchStage.league) > 0) {
            throw new IllegalStateException(
                "League fixtures already exist. Remove them first or enter results on the scheduled rows."
            );
        }

        List<UUID> playerIds =
            tournamentPlayerRepository.findApprovedByTournamentIdWithPlayer(tournament.getId()).stream()
                .sorted(Comparator.comparing((TournamentPlayer tp) -> tp.getPlayer().getName(), String.CASE_INSENSITIVE_ORDER))
                .map(tp -> tp.getPlayer().getId())
                .toList();

        if (playerIds.size() < 2) {
            throw new IllegalArgumentException("Approve at least two players before generating fixtures.");
        }

        List<List<RoundRobin.Pairing>> rounds = RoundRobin.schedule(playerIds);
        int created = 0;
        for (int i = 0; i < rounds.size(); i++) {
            int matchdayNumber = i + 1;
            Matchday matchday = ensureMatchday(tournament.getId(), matchdayNumber);
            for (RoundRobin.Pairing pairing : rounds.get(i)) {
                FootballMatch match =
                    FootballMatch.scheduledLeague(
                        UUID.randomUUID(),
                        tournament.getId(),
                        matchday.getId(),
                        pairing.homeId(),
                        pairing.awayId()
                    );
                footballMatchRepository.save(match);
                created++;
            }
        }

        writeAudit("admin_generate_league_fixtures", tournament.getId(), null, new GenerateFixturesResponse(rounds.size(), created));
        return new GenerateFixturesResponse(rounds.size(), created);
    }

    @Transactional
    public AdminMatchRow scheduleLeagueMatch(int season, ScheduleFixtureRequest body) {
        if (body.homePlayerId().equals(body.awayPlayerId())) {
            throw new IllegalArgumentException("Home and away must be different players");
        }
        Tournament tournament = requireSeason(season);
        requireApproved(tournament.getId(), body.homePlayerId());
        requireApproved(tournament.getId(), body.awayPlayerId());

        Matchday matchday = ensureMatchday(tournament.getId(), body.matchday());
        MatchStage stage = body.stageOrLeague();

        if (footballMatchRepository
            .findScheduledLeaguePairing(
                tournament.getId(),
                body.matchday(),
                body.homePlayerId(),
                body.awayPlayerId(),
                stage,
                MatchStatus.scheduled
            )
            .isPresent()) {
            throw new IllegalArgumentException("This fixture is already on the schedule.");
        }

        requireNoMatchdayConflict(tournament.getId(), stage, body.matchday(), body.homePlayerId(), body.awayPlayerId());

        FootballMatch match =
            FootballMatch.scheduled(
                UUID.randomUUID(),
                tournament.getId(),
                matchday.getId(),
                stage,
                body.homePlayerId(),
                body.awayPlayerId()
            );
        footballMatchRepository.save(match);
        writeAudit("admin_schedule_fixture", match.getId(), null, body);

        Player home = playerRepository.findById(body.homePlayerId()).orElseThrow();
        Player away = playerRepository.findById(body.awayPlayerId()).orElseThrow();
        return new AdminMatchRow(
            match.getId(),
            body.matchday(),
            match.getHomeId(),
            match.getAwayId(),
            home.getName(),
            away.getName(),
            null,
            null,
            match.getStatus(),
            match.getUpdatedAt(),
            false
        );
    }

    @Transactional(readOnly = true)
    public List<AdminMatchRow> listLeagueFixtures(int season) {
        Tournament tournament = requireSeason(season);
        List<FootballMatch> matches =
            footballMatchRepository.findAllByTournamentIdWithMatchday(tournament.getId()).stream()
                .filter(m -> m.getStage() == MatchStage.league)
                .toList();
        Map<UUID, Player> playersById =
            playerRepository.findAllById(collectPlayerIds(matches)).stream()
                .collect(Collectors.toMap(Player::getId, Function.identity()));

        return matches.stream().map(m -> toAdminRow(m, playersById)).toList();
    }

    /** A matchday may not contain the same player twice (mirrors @tournax/core's findMatchdayConflict). */
    private void requireNoMatchdayConflict(
        UUID tournamentId,
        MatchStage stage,
        int matchdayNumber,
        UUID homePlayerId,
        UUID awayPlayerId
    ) {
        List<FootballMatch> sameMatchday =
            footballMatchRepository.findAllByTournamentIdWithMatchday(tournamentId).stream()
                .filter(m -> m.getStage() == stage)
                .filter(m -> m.getMatchday() != null && m.getMatchday().getNumber() == matchdayNumber)
                .toList();

        UUID conflict = sameMatchday.stream()
            .flatMap(m -> java.util.stream.Stream.of(m.getHomeId(), m.getAwayId()))
            .filter(id -> id.equals(homePlayerId) || id.equals(awayPlayerId))
            .findFirst()
            .orElse(null);

        if (conflict != null) {
            String name = playerRepository.findById(conflict).map(Player::getName).orElse("That player");
            throw new IllegalArgumentException(name + " is already scheduled to play on matchday " + matchdayNumber + ".");
        }
    }

    private Matchday ensureMatchday(UUID tournamentId, int number) {
        return matchdayRepository
            .findByTournamentIdAndNumber(tournamentId, number)
            .orElseGet(() -> matchdayRepository.save(new Matchday(UUID.randomUUID(), tournamentId, number)));
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
            auditLogRepository.save(new AuditLogEntry(action, "fixture", entityId, beforeJson, afterJson));
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

    private static AdminMatchRow toAdminRow(FootballMatch match, Map<UUID, Player> playersById) {
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
            false
        );
    }

    private Tournament requireSeason(int season) {
        return tournamentRepository
            .findFirstBySeasonOrderByCreatedAtDesc(season)
            .orElseThrow(() -> new IllegalStateException("No tournament for season " + season));
    }
}
