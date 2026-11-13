package com.tournax.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "matches")
public class FootballMatch {

    @Id
    private UUID id;

    @Column(name = "tournament_id", nullable = false)
    private UUID tournamentId;

    @Column(name = "matchday_id", nullable = false)
    private UUID matchdayId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matchday_id", insertable = false, updatable = false)
    private Matchday matchday;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "match_stage")
    private MatchStage stage = MatchStage.league;

    @Column(name = "home_id", nullable = false)
    private UUID homeId;

    @Column(name = "away_id", nullable = false)
    private UUID awayId;

    @Column(name = "home_goals")
    private Integer homeGoals;

    @Column(name = "away_goals")
    private Integer awayGoals;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "match_status")
    private MatchStatus status = MatchStatus.scheduled;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected FootballMatch() {}

    public FootballMatch(
        UUID id,
        UUID tournamentId,
        UUID matchdayId,
        UUID homeId,
        UUID awayId,
        int homeGoals,
        int awayGoals,
        MatchStatus status
    ) {
        this.id = id;
        this.tournamentId = tournamentId;
        this.matchdayId = matchdayId;
        this.homeId = homeId;
        this.awayId = awayId;
        this.homeGoals = homeGoals;
        this.awayGoals = awayGoals;
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public static FootballMatch scheduledLeague(
        UUID id,
        UUID tournamentId,
        UUID matchdayId,
        UUID homeId,
        UUID awayId
    ) {
        return scheduled(id, tournamentId, matchdayId, MatchStage.league, homeId, awayId);
    }

    public static FootballMatch scheduled(
        UUID id,
        UUID tournamentId,
        UUID matchdayId,
        MatchStage stage,
        UUID homeId,
        UUID awayId
    ) {
        FootballMatch match = new FootballMatch();
        match.id = id;
        match.tournamentId = tournamentId;
        match.matchdayId = matchdayId;
        match.stage = stage;
        match.homeId = homeId;
        match.awayId = awayId;
        match.homeGoals = null;
        match.awayGoals = null;
        match.status = MatchStatus.scheduled;
        match.updatedAt = Instant.now();
        return match;
    }

    public MatchStage getStage() {
        return stage;
    }

    public void applyAdminResult(int homeGoals, int awayGoals, Instant now) {
        this.homeGoals = homeGoals;
        this.awayGoals = awayGoals;
        this.status = MatchStatus.resolved;
        touchUpdatedAt(now);
    }

    /** Matchday closed with this match unplayed — pushes it into the admin's disputed queue. */
    public void markDisputed(Instant now) {
        this.status = MatchStatus.disputed;
        touchUpdatedAt(now);
    }

    public UUID getId() {
        return id;
    }

    public UUID getTournamentId() {
        return tournamentId;
    }

    public UUID getMatchdayId() {
        return matchdayId;
    }

    public Matchday getMatchday() {
        return matchday;
    }

    public UUID getHomeId() {
        return homeId;
    }

    public UUID getAwayId() {
        return awayId;
    }

    public Integer getHomeGoals() {
        return homeGoals;
    }

    public Integer getAwayGoals() {
        return awayGoals;
    }

    public MatchStatus getStatus() {
        return status;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void touchUpdatedAt(Instant now) {
        this.updatedAt = now;
    }

    public void setHomeGoals(int homeGoals) {
        this.homeGoals = homeGoals;
    }

    public void setAwayGoals(int awayGoals) {
        this.awayGoals = awayGoals;
    }
}
