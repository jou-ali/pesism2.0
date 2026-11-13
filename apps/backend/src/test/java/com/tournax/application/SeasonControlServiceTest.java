package com.tournax.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tournax.application.dto.StartMatchdayRequest;
import com.tournax.domain.model.FootballMatch;
import com.tournax.domain.model.MatchStage;
import com.tournax.domain.model.MatchStatus;
import com.tournax.domain.model.Matchday;
import com.tournax.domain.model.Player;
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
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SeasonControlServiceTest {

    @Mock
    TournamentRepository tournamentRepository;

    @Mock
    TournamentPlayerRepository tournamentPlayerRepository;

    @Mock
    MatchdayRepository matchdayRepository;

    @Mock
    FootballMatchRepository footballMatchRepository;

    @Mock
    AuditLogRepository auditLogRepository;

    private final Clock clock = Clock.fixed(Instant.parse("2026-11-01T12:00:00Z"), ZoneOffset.UTC);

    private SeasonControlService service;
    private Tournament tournament;
    private UUID tournamentId;

    @BeforeEach
    void setUp() {
        service =
            new SeasonControlService(
                tournamentRepository,
                tournamentPlayerRepository,
                matchdayRepository,
                footballMatchRepository,
                auditLogRepository,
                new ObjectMapper().registerModule(new JavaTimeModule()),
                clock
            );
        tournamentId = UUID.fromString("a0000000-0000-4000-8000-000000000003");
        tournament = new Tournament();
        setField(tournament, "id", tournamentId);
        setField(tournament, "season", 3);
        setField(tournament, "status", TournamentStatus.registration);
        when(tournamentRepository.findFirstBySeasonOrderByCreatedAtDesc(3)).thenReturn(Optional.of(tournament));
    }

    @Test
    void blocksMatchdayOneWhenATeamNameIsMissing() {
        TournamentPlayer withTeam = approvedPlayer("Arjun", "Shadow FC");
        TournamentPlayer withoutTeam = approvedPlayer("Vinay", null);
        when(tournamentPlayerRepository.findApprovedByTournamentIdWithPlayer(tournamentId))
            .thenReturn(List.of(withTeam, withoutTeam));

        var ex =
            assertThrows(
                IllegalArgumentException.class,
                () -> service.startMatchday(3, 1, new StartMatchdayRequest(clock.instant().plusSeconds(60)))
            );
        assertTrue(ex.getMessage().contains("Vinay"));
    }

    @Test
    void startsMatchdayAndWarnsOnMissingCrestsWithoutBlocking() {
        TournamentPlayer withCrest = approvedPlayer("Arjun", "Shadow FC");
        withCrest.setCrest("https://x/crest.png", "#111111", "#222222");
        TournamentPlayer noCrest = approvedPlayer("Vinay", "Night Wolves");
        when(tournamentPlayerRepository.findApprovedByTournamentIdWithPlayer(tournamentId))
            .thenReturn(List.of(withCrest, noCrest));
        when(matchdayRepository.findByTournamentIdAndNumber(tournamentId, 1)).thenReturn(Optional.empty());
        when(matchdayRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = service.startMatchday(3, 1, new StartMatchdayRequest(clock.instant().plusSeconds(60)));

        assertEquals(1, result.matchday());
        assertEquals(List.of("Vinay"), result.missingCrestPlayerNames());
        assertEquals(1, tournament.getCurrentMatchday());
    }

    @Test
    void closeMatchdayMarksOnlyUnplayedMatchesDisputed() {
        setField(tournament, "currentMatchday", 2);
        Matchday matchday = new Matchday(UUID.randomUUID(), tournamentId, 2);
        when(matchdayRepository.findByTournamentIdAndNumber(tournamentId, 2)).thenReturn(Optional.of(matchday));

        FootballMatch unplayed =
            FootballMatch.scheduled(UUID.randomUUID(), tournamentId, matchday.getId(), MatchStage.league, UUID.randomUUID(), UUID.randomUUID());
        when(footballMatchRepository.findByTournamentIdAndMatchdayIdAndStatusIn(
                tournamentId, matchday.getId(), List.of(MatchStatus.scheduled, MatchStatus.pending_confirmation)))
            .thenReturn(List.of(unplayed));

        var result = service.closeMatchday(3);

        assertEquals(2, result.matchday());
        assertEquals(1, result.disputedCount());
        assertEquals(MatchStatus.disputed, unplayed.getStatus());
    }

    private TournamentPlayer approvedPlayer(String name, String teamName) {
        Player player = Player.register(name, "9190000000" + name.length(), name.toLowerCase() + "@b.com", name + "FC", null, "Kochi", null);
        setField(player, "id", UUID.randomUUID());
        TournamentPlayer entry = TournamentPlayer.pending(tournament, player);
        if (teamName != null) {
            entry.setTeamName(teamName);
        }
        return entry;
    }

    private static void setField(Object target, String field, Object value) {
        try {
            var f = target.getClass().getDeclaredField(field);
            f.setAccessible(true);
            f.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }
}
