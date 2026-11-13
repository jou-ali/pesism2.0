package com.tournax.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "matchdays")
public class Matchday {

    @Id
    private UUID id;

    @Column(name = "tournament_id", nullable = false)
    private UUID tournamentId;

    @Column(nullable = false)
    private int number;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "match_stage")
    private MatchStage stage = MatchStage.league;

    @Column(name = "opens_at")
    private Instant opensAt;

    @Column(name = "deadline_at")
    private Instant deadlineAt;

    protected Matchday() {}

    public Matchday(UUID id, UUID tournamentId, int number) {
        this.id = id;
        this.tournamentId = tournamentId;
        this.number = number;
    }

    public UUID getId() {
        return id;
    }

    public UUID getTournamentId() {
        return tournamentId;
    }

    public int getNumber() {
        return number;
    }

    public MatchStage getStage() {
        return stage;
    }

    public Instant getOpensAt() {
        return opensAt;
    }

    public Instant getDeadlineAt() {
        return deadlineAt;
    }

    public void open(Instant opensAt, Instant deadlineAt) {
        this.opensAt = opensAt;
        this.deadlineAt = deadlineAt;
    }
}
