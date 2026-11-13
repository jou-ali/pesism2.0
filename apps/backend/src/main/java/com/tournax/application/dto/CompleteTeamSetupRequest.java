package com.tournax.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompleteTeamSetupRequest(@NotBlank @Size(max = 30) String teamName) {}
