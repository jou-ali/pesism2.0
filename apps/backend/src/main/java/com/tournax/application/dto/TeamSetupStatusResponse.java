package com.tournax.application.dto;

public record TeamSetupStatusResponse(
    boolean valid,
    String playerName,
    String avatarUrl,
    String teamName,
    String crestUrl,
    String primaryColor,
    String secondaryColor,
    boolean locked
) {

    public static TeamSetupStatusResponse invalid() {
        return new TeamSetupStatusResponse(false, null, null, null, null, null, null, false);
    }
}
