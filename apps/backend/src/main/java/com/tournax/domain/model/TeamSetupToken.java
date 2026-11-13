package com.tournax.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "team_setup_tokens")
public class TeamSetupToken {

    @Id
    private String token;

    @Column(name = "tournament_id", nullable = false)
    private UUID tournamentId;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected TeamSetupToken() {}

    public static TeamSetupToken issue(String token, UUID tournamentId, UUID playerId, Instant expiresAt) {
        TeamSetupToken entry = new TeamSetupToken();
        entry.token = token;
        entry.tournamentId = tournamentId;
        entry.playerId = playerId;
        entry.expiresAt = expiresAt;
        return entry;
    }

    public String getToken() {
        return token;
    }

    public UUID getTournamentId() {
        return tournamentId;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public boolean isUsable(Instant now) {
        return usedAt == null && now.isBefore(expiresAt);
    }

    public void markUsed(Instant now) {
        this.usedAt = now;
    }
}
