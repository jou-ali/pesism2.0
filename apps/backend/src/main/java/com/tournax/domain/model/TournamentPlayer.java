package com.tournax.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "tournament_players")
public class TournamentPlayer {

    @EmbeddedId
    private TournamentPlayerId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("tournamentId")
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("playerId")
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(nullable = false)
    private boolean approved;

    @Column(name = "joined_at", nullable = false, insertable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "team_name")
    private String teamName;

    @Column(name = "crest_url")
    private String crestUrl;

    @Column(name = "primary_color")
    private String primaryColor;

    @Column(name = "secondary_color")
    private String secondaryColor;

    protected TournamentPlayer() {}

    public static TournamentPlayer pending(Tournament tournament, Player player) {
        TournamentPlayer entry = new TournamentPlayer();
        entry.id = new TournamentPlayerId(tournament.getId(), player.getId());
        entry.tournament = tournament;
        entry.player = player;
        entry.approved = false;
        return entry;
    }

    public TournamentPlayerId getId() {
        return id;
    }

    public Tournament getTournament() {
        return tournament;
    }

    public Player getPlayer() {
        return player;
    }

    public boolean isApproved() {
        return approved;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void approve() {
        this.approved = true;
    }

    public String getTeamName() {
        return teamName;
    }

    public String getCrestUrl() {
        return crestUrl;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public String getSecondaryColor() {
        return secondaryColor;
    }

    /** Admin path — always allowed, no phase lock. */
    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    /** Player-facing path — only while registration is still open; see TeamService. */
    public void completeTeamName(String teamName) {
        this.teamName = teamName;
    }

    public void setCrest(String crestUrl, String primaryColor, String secondaryColor) {
        this.crestUrl = crestUrl;
        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;
    }
}
