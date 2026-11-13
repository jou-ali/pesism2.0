package com.tournax.domain.repository;

import com.tournax.domain.model.Matchday;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchdayRepository extends JpaRepository<Matchday, UUID> {
    Optional<Matchday> findByTournamentIdAndNumber(UUID tournamentId, int number);

    long countByTournamentId(UUID tournamentId);
}
