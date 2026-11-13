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
@Table(name = "tournaments")
public class Tournament {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int season;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "tournament_status")
    private TournamentStatus status;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "max_players")
    private Integer maxPlayers;

    @Column(name = "registration_opens_at")
    private Instant registrationOpensAt;

    @Column(name = "registration_closes_at")
    private Instant registrationClosesAt;

    @Column(name = "knockout_qualifiers", nullable = false)
    private int knockoutQualifiers = 4;

    @Column(name = "points_win", nullable = false)
    private int pointsWin = 3;

    @Column(name = "points_draw", nullable = false)
    private int pointsDraw = 1;

    @Column(name = "points_loss", nullable = false)
    private int pointsLoss = 0;

    @Column(name = "current_matchday")
    private Integer currentMatchday;

    public Tournament() {}

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getSeason() {
        return season;
    }

    public TournamentStatus getStatus() {
        return status;
    }

    public Integer getMaxPlayers() {
        return maxPlayers;
    }

    public Instant getRegistrationOpensAt() {
        return registrationOpensAt;
    }

    public Instant getRegistrationClosesAt() {
        return registrationClosesAt;
    }

    public Integer getCurrentMatchday() {
        return currentMatchday;
    }

    public void setStatus(TournamentStatus status) {
        this.status = status;
    }

    public void setCurrentMatchday(Integer currentMatchday) {
        this.currentMatchday = currentMatchday;
    }

    public void setRegistrationOpensAt(Instant registrationOpensAt) {
        this.registrationOpensAt = registrationOpensAt;
    }

    public void setRegistrationClosesAt(Instant registrationClosesAt) {
        this.registrationClosesAt = registrationClosesAt;
    }

    public void setMaxPlayers(Integer maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    public int getKnockoutQualifiers() {
        return knockoutQualifiers;
    }

    public int getPointsWin() {
        return pointsWin;
    }

    public int getPointsDraw() {
        return pointsDraw;
    }

    public int getPointsLoss() {
        return pointsLoss;
    }

    public boolean isRegistrationOpenAt(Instant now) {
        if (status != TournamentStatus.registration) {
            return false;
        }
        if (registrationOpensAt != null && now.isBefore(registrationOpensAt)) {
            return false;
        }
        if (registrationClosesAt != null && !now.isBefore(registrationClosesAt)) {
            return false;
        }
        return true;
    }
}
