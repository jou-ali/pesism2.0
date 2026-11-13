package com.tournax.application.dto;

public record TeamSetupStatusResponse(boolean valid, String playerName, String teamName) {

    public static TeamSetupStatusResponse invalid() {
        return new TeamSetupStatusResponse(false, null, null);
    }
}
