package com.tournax.application;

import com.tournax.application.dto.CompetitionMatchDto;
import com.tournax.application.dto.CompetitionPlayerDto;
import com.tournax.application.dto.CompetitionResponse;
import com.tournax.application.dto.MatchDetailResponse;
import com.tournax.application.dto.MatchSideDto;
import com.tournax.domain.model.FootballMatch;
import com.tournax.domain.model.Matchday;
import com.tournax.domain.model.MatchStats;
import com.tournax.domain.model.Player;
import com.tournax.domain.model.Tournament;
import com.tournax.domain.model.TournamentPlayer;
import com.tournax.domain.model.TournamentPlayerId;
import com.tournax.domain.repository.FootballMatchRepository;
import com.tournax.domain.repository.MatchStatsRepository;
import com.tournax.domain.repository.MatchdayRepository;
import com.tournax.domain.repository.PlayerRepository;
import com.tournax.domain.repository.TournamentPlayerRepository;
import com.tournax.domain.repository.TournamentRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompetitionService {

    private final TournamentRepository tournamentRepository;
    private final TournamentPlayerRepository tournamentPlayerRepository;
    private final FootballMatchRepository footballMatchRepository;
    private final MatchdayRepository matchdayRepository;
    private final MatchStatsRepository matchStatsRepository;
    private final PlayerRepository playerRepository;

    public CompetitionService(
        TournamentRepository tournamentRepository,
        TournamentPlayerRepository tournamentPlayerRepository,
        FootballMatchRepository footballMatchRepository,
        MatchdayRepository matchdayRepository,
        MatchStatsRepository matchStatsRepository,
        PlayerRepository playerRepository
    ) {
        this.tournamentRepository = tournamentRepository;
        this.tournamentPlayerRepository = tournamentPlayerRepository;
        this.footballMatchRepository = footballMatchRepository;
        this.matchdayRepository = matchdayRepository;
        this.matchStatsRepository = matchStatsRepository;
        this.playerRepository = playerRepository;
    }

    @Transactional(readOnly = true)
    public CompetitionResponse getCompetition(int season) {
        Tournament tournament = requireSeason(season);
        List<CompetitionPlayerDto> players =
            tournamentPlayerRepository.findApprovedByTournamentIdWithPlayer(tournament.getId()).stream()
                .map(tp -> new CompetitionPlayerDto(
                    tp.getPlayer().getId(),
                    tp.getPlayer().getName(),
                    tp.getPlayer().getGamingUsername(),
                    tp.getPlayer().getCity(),
                    tp.getPlayer().getAvatarUrl(),
                    tp.getTeamName(),
                    tp.getCrestUrl()
                ))
                .toList();

        List<CompetitionMatchDto> matches =
            footballMatchRepository.findAllByTournamentIdWithMatchday(tournament.getId()).stream()
                .map(this::toMatchDto)
                .toList();

        int totalMatchdays = (int) matchdayRepository.countByTournamentId(tournament.getId());
        Instant currentMatchdayDeadlineAt =
            tournament.getCurrentMatchday() != null
                ? matchdayRepository
                    .findByTournamentIdAndNumber(tournament.getId(), tournament.getCurrentMatchday())
                    .map(Matchday::getDeadlineAt)
                    .orElse(null)
                : null;

        return new CompetitionResponse(
            season,
            tournament.getKnockoutQualifiers(),
            tournament.getPointsWin(),
            tournament.getPointsDraw(),
            tournament.getPointsLoss(),
            tournament.getStatus(),
            tournament.getCurrentMatchday(),
            currentMatchdayDeadlineAt,
            totalMatchdays,
            players,
            matches
        );
    }

    private CompetitionMatchDto toMatchDto(FootballMatch match) {
        int matchday = match.getMatchday() != null ? match.getMatchday().getNumber() : 0;
        return new CompetitionMatchDto(
            match.getId(),
            matchday,
            match.getStage(),
            match.getHomeId(),
            match.getAwayId(),
            match.getHomeGoals(),
            match.getAwayGoals(),
            match.getStatus()
        );
    }

    @Transactional(readOnly = true)
    public MatchDetailResponse getMatchDetail(int season, UUID matchId) {
        Tournament tournament = requireSeason(season);
        FootballMatch match =
            footballMatchRepository
                .findByIdWithMatchday(matchId)
                .filter(m -> m.getTournamentId().equals(tournament.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        int matchday = match.getMatchday() != null ? match.getMatchday().getNumber() : 0;
        MatchStats stats = matchStatsRepository.findById(matchId).orElse(null);

        return new MatchDetailResponse(
            match.getId(),
            matchday,
            match.getStage(),
            match.getStatus(),
            toSide(tournament.getId(), match.getHomeId()),
            toSide(tournament.getId(), match.getAwayId()),
            match.getHomeGoals(),
            match.getAwayGoals(),
            MatchStatsMapper.toInput(stats)
        );
    }

    private MatchSideDto toSide(UUID tournamentId, UUID playerId) {
        TournamentPlayer tp =
            tournamentPlayerRepository.findById(new TournamentPlayerId(tournamentId, playerId)).orElse(null);
        Player player = tp != null ? tp.getPlayer() : playerRepository.findById(playerId).orElse(null);
        String name = player != null ? player.getName() : playerId.toString();
        String avatarUrl = player != null ? player.getAvatarUrl() : null;
        return new MatchSideDto(
            playerId,
            name,
            avatarUrl,
            tp != null ? tp.getTeamName() : null,
            tp != null ? tp.getCrestUrl() : null
        );
    }

    private Tournament requireSeason(int season) {
        return tournamentRepository
            .findFirstBySeasonOrderByCreatedAtDesc(season)
            .orElseThrow(() -> new IllegalStateException("No tournament for season " + season));
    }
}
