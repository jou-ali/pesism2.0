package com.tournax.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tournax.application.dto.TeamRow;
import com.tournax.application.dto.UpdateTeamRequest;
import com.tournax.domain.model.Player;
import com.tournax.domain.model.Tournament;
import com.tournax.domain.model.TournamentPlayer;
import com.tournax.domain.model.TournamentPlayerId;
import com.tournax.domain.model.TournamentStatus;
import com.tournax.domain.repository.AuditLogRepository;
import com.tournax.domain.repository.TournamentPlayerRepository;
import com.tournax.domain.repository.TournamentRepository;
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
    AuditLogRepository auditLogRepository;

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
                auditLogRepository,
                new ObjectMapper().registerModule(new JavaTimeModule())
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

        TeamRow row = teamService.updateTeam(3, playerId, new UpdateTeamRequest("New Name", null));

        assertEquals("New Name", row.teamName());
    }

    @Test
    void updateTeamRejectsBlankName() {
        when(tournamentRepository.findFirstBySeasonOrderByCreatedAtDesc(3)).thenReturn(Optional.of(tournament));
        TournamentPlayer entry = tournamentPlayer();
        when(tournamentPlayerRepository.findById(new TournamentPlayerId(tournamentId, playerId)))
            .thenReturn(Optional.of(entry));

        assertThrows(
            IllegalArgumentException.class,
            () -> teamService.updateTeam(3, playerId, new UpdateTeamRequest("   ", null))
        );
    }

    @Test
    void updateTeamSavesCrestUrl() {
        when(tournamentRepository.findFirstBySeasonOrderByCreatedAtDesc(3)).thenReturn(Optional.of(tournament));
        TournamentPlayer entry = tournamentPlayer();
        when(tournamentPlayerRepository.findById(new TournamentPlayerId(tournamentId, playerId)))
            .thenReturn(Optional.of(entry));

        TeamRow row = teamService.updateTeam(3, playerId, new UpdateTeamRequest(null, "https://x/crest.png"));

        assertEquals("https://x/crest.png", row.crestUrl());
        assertEquals(true, row.hasCrest());
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
