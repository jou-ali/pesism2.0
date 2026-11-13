package com.tournax.application;

import com.tournax.application.dto.CompetitionMatchDto;
import com.tournax.application.dto.CompetitionPlayerDto;
import com.tournax.application.dto.CompetitionResponse;
import com.tournax.domain.model.FootballMatch;
import com.tournax.domain.model.Tournament;
import com.tournax.domain.repository.FootballMatchRepository;
import com.tournax.domain.repository.TournamentPlayerRepository;
import com.tournax.domain.repository.TournamentRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompetitionService {

    private final TournamentRepository tournamentRepository;
    private final TournamentPlayerRepository tournamentPlayerRepository;
    private final FootballMatchRepository footballMatchRepository;

    public CompetitionService(
        TournamentRepository tournamentRepository,
        TournamentPlayerRepository tournamentPlayerRepository,
        FootballMatchRepository footballMatchRepository
    ) {
        this.tournamentRepository = tournamentRepository;
        this.tournamentPlayerRepository = tournamentPlayerRepository;
        this.footballMatchRepository = footballMatchRepository;
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
                    tp.getCrestUrl(),
                    tp.getPrimaryColor(),
                    tp.getSecondaryColor()
                ))
                .toList();

        List<CompetitionMatchDto> matches =
            footballMatchRepository.findAllByTournamentIdWithMatchday(tournament.getId()).stream()
                .map(this::toMatchDto)
                .toList();

        return new CompetitionResponse(
            season,
            tournament.getKnockoutQualifiers(),
            tournament.getPointsWin(),
            tournament.getPointsDraw(),
            tournament.getPointsLoss(),
            players,
            matches
        );
    }

    private CompetitionMatchDto toMatchDto(FootballMatch match) {
        int matchday = match.getMatchday() != null ? match.getMatchday().getNumber() : 0;
        return new CompetitionMatchDto(
            match.getId(),
            matchday,
            match.getHomeId(),
            match.getAwayId(),
            match.getHomeGoals(),
            match.getAwayGoals(),
            match.getStatus()
        );
    }

    private Tournament requireSeason(int season) {
        return tournamentRepository
            .findFirstBySeasonOrderByCreatedAtDesc(season)
            .orElseThrow(() -> new IllegalStateException("No tournament for season " + season));
    }
}
