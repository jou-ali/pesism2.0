package com.tournax.domain.repository;

import com.tournax.domain.model.FootballMatch;
import com.tournax.domain.model.MatchStage;
import com.tournax.domain.model.MatchStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface FootballMatchRepository extends JpaRepository<FootballMatch, UUID> {

    @Query("select m from FootballMatch m join fetch m.matchday where m.id = :id")
    Optional<FootballMatch> findByIdWithMatchday(UUID id);

    @Query(
        """
        select m from FootballMatch m
        join fetch m.matchday md
        where m.tournamentId = :tournamentId
        order by md.number, m.updatedAt desc
        """
    )
    List<FootballMatch> findAllByTournamentIdWithMatchday(UUID tournamentId);

    long countByTournamentIdAndStage(UUID tournamentId, MatchStage stage);

    List<FootballMatch> findByTournamentIdAndMatchdayIdAndStatusIn(
        UUID tournamentId,
        UUID matchdayId,
        List<MatchStatus> statuses
    );

    @Query(
        """
        select m from FootballMatch m
        join m.matchday md
        where m.tournamentId = :tournamentId
          and md.number = :matchday
          and m.homeId = :homeId
          and m.awayId = :awayId
          and m.stage = :stage
          and m.status = :status
        """
    )
    Optional<FootballMatch> findScheduledLeaguePairing(
        UUID tournamentId,
        int matchday,
        UUID homeId,
        UUID awayId,
        MatchStage stage,
        MatchStatus status
    );
}
