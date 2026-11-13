package com.tournax.domain.repository;

import com.tournax.domain.model.TeamSetupToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamSetupTokenRepository extends JpaRepository<TeamSetupToken, String> {}
