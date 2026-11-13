package com.tournax.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tournax.application.dto.CompleteTeamSetupRequest;
import com.tournax.application.dto.TeamRow;
import com.tournax.application.dto.TeamSetupStatusResponse;
import com.tournax.application.dto.UpdateTeamRequest;
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
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock
    TournamentRepository tournamentRepository;

    @Mock
    TournamentPlayerRepository tournamentPlayerRepository;

    @Mock
    TeamSetupTokenRepository teamSetupTokenRepository;

    @Mock
    AuditLogRepository auditLogRepository;

    private final Clock clock = Clock.fixed(Instant.parse("2026-11-01T12:00:00Z"), ZoneOffset.UTC);

    private TeamService teamService;
    private Tournament tournament;
    private UUID tournamentId;
    private UUID playerId;

    @BeforeEach
    void setUp() {
        teamService =
            new TeamService(
                tournamentRepository,
                tournamentPlayerRepository,
                teamSetupTokenRepository,
                auditLogRepository,
                new ObjectMapper(),
                clock
            );
        tournamentId = UUID.fromString("a0000000-0000-4000-8000-000000000003");
        playerId = UUID.randomUUID();
        tournament = new Tournament();
        setField(tournament, "id", tournamentId);
        setField(tournament, "season", 3);
        setField(tournament, "status", TournamentStatus.registration);
    }

    @Test
    void adminCanUpdateTeamNameRegardlessOfPhase() {
        setField(tournament, "status", TournamentStatus.knockout);
        when(tournamentRepository.findFirstBySeasonOrderByCreatedAtDesc(3)).thenReturn(Optional.of(tournament));
        TournamentPlayer entry = tournamentPlayer();
        when(tournamentPlayerRepository.findById(new TournamentPlayerId(tournamentId, playerId)))
            .thenReturn(Optional.of(entry));

        TeamRow row = teamService.updateTeam(3, playerId, new UpdateTeamRequest("New Name", null, null, null));

        assertEquals("New Name", row.teamName());
    }

    @Test
    void completeSetupRejectsOutsideRegistration() {
        setField(tournament, "status", TournamentStatus.league);
        TeamSetupToken token = TeamSetupToken.issue("tok", tournamentId, playerId, clock.instant().plusSeconds(60));
        when(teamSetupTokenRepository.findById("tok")).thenReturn(Optional.of(token));
        when(tournamentRepository.findById(tournamentId)).thenReturn(Optional.of(tournament));

        assertThrows(
            IllegalArgumentException.class,
            () -> teamService.completeSetup("tok", new CompleteTeamSetupRequest("Shadow FC"))
        );
    }

    @Test
    void completeSetupRejectsExpiredToken() {
        TeamSetupToken token = TeamSetupToken.issue("tok", tournamentId, playerId, clock.instant().minusSeconds(60));
        when(teamSetupTokenRepository.findById("tok")).thenReturn(Optional.of(token));

        assertThrows(
            IllegalArgumentException.class,
            () -> teamService.completeSetup("tok", new CompleteTeamSetupRequest("Shadow FC"))
        );
    }

    @Test
    void completeSetupSetsTeamNameAndMarksTokenUsed() {
        TeamSetupToken token = TeamSetupToken.issue("tok", tournamentId, playerId, clock.instant().plusSeconds(60));
        when(teamSetupTokenRepository.findById("tok")).thenReturn(Optional.of(token));
        when(tournamentRepository.findById(tournamentId)).thenReturn(Optional.of(tournament));
        TournamentPlayer entry = tournamentPlayer();
        when(tournamentPlayerRepository.findById(new TournamentPlayerId(tournamentId, playerId)))
            .thenReturn(Optional.of(entry));

        teamService.completeSetup("tok", new CompleteTeamSetupRequest("Shadow FC"));

        assertEquals("Shadow FC", entry.getTeamName());
    }

    @Test
    void setupStatusReportsInvalidForUsedToken() {
        TeamSetupToken token = TeamSetupToken.issue("tok", tournamentId, playerId, clock.instant().plusSeconds(60));
        token.markUsed(clock.instant());
        when(teamSetupTokenRepository.findById("tok")).thenReturn(Optional.of(token));

        TeamSetupStatusResponse status = teamService.setupStatus("tok");

        assertEquals(false, status.valid());
    }

    private TournamentPlayer tournamentPlayer() {
        Tournament tournamentRef = tournament;
        Player player = Player.register("Arjun", "919876543210", "a@b.com", "ArjunFC", null, "Kochi", null);
        setField(player, "id", playerId);
        TournamentPlayer entry = TournamentPlayer.pending(tournamentRef, player);
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
