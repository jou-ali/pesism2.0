package com.tournax.application;

import com.tournax.application.dto.RegistrationRequest;
import com.tournax.application.dto.RegistrationResponse;
import com.tournax.application.dto.RegistrationWindowResponse;
import com.tournax.application.dto.VerifyEmailRequest;
import com.tournax.application.exception.AlreadyRegisteredException;
import com.tournax.application.exception.IdentityConflictException;
import com.tournax.application.exception.RegistrationClosedException;
import com.tournax.application.exception.TournamentFullException;
import com.tournax.domain.model.Player;
import com.tournax.domain.model.RegistrationIntent;
import com.tournax.domain.model.Tournament;
import com.tournax.domain.model.TournamentPlayer;
import com.tournax.domain.repository.PlayerRepository;
import com.tournax.domain.repository.TournamentPlayerRepository;
import com.tournax.domain.repository.TournamentRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationService {

    private final TournamentRepository tournamentRepository;
    private final PlayerRepository playerRepository;
    private final TournamentPlayerRepository tournamentPlayerRepository;
    private final RegistrationIntentService registrationIntentService;
    private final RegistrationAuditService auditService;
    private final Clock clock;

    public RegistrationService(
        TournamentRepository tournamentRepository,
        PlayerRepository playerRepository,
        TournamentPlayerRepository tournamentPlayerRepository,
        RegistrationIntentService registrationIntentService,
        RegistrationAuditService auditService,
        Clock clock
    ) {
        this.tournamentRepository = tournamentRepository;
        this.playerRepository = playerRepository;
        this.tournamentPlayerRepository = tournamentPlayerRepository;
        this.registrationIntentService = registrationIntentService;
        this.auditService = auditService;
        this.clock = clock;
    }

    public RegistrationWindowResponse windowForSeason(int season) {
        Tournament tournament = tournamentRepository
            .findFirstBySeasonOrderByCreatedAtDesc(season)
            .orElseThrow(() -> new IllegalStateException("No tournament found for season " + season));

        Instant now = clock.instant();
        long count = tournamentPlayerRepository.countEmailVerifiedByTournamentId(tournament.getId());
        return RegistrationWindowResponse.from(tournament, now).withCount(count);
    }

    @Transactional
    public RegistrationResponse registerForSeason(
        int season,
        RegistrationRequest request,
        ClientRequestContext client
    ) {
        if (request.honeypot() != null && !request.honeypot().isBlank()) {
            auditService.log(null, null, "honeypot", request.email(), client, request.city(), "honeypot filled");
            throw new IllegalArgumentException("Invalid submission");
        }

        Tournament tournament = tournamentRepository
            .findFirstBySeasonOrderByCreatedAtDesc(season)
            .orElseThrow(() -> new IllegalStateException("No tournament found for season " + season));

        Instant now = clock.instant();
        if (!tournament.isRegistrationOpenAt(now)) {
            auditService.log(
                tournament.getId(),
                null,
                "registration_rejected",
                request.email(),
                client,
                request.city(),
                "registration closed"
            );
            throw new RegistrationClosedException(tournament.getId(), now);
        }

        if (tournament.getMaxPlayers() != null) {
            long count = tournamentPlayerRepository.countEmailVerifiedByTournamentId(tournament.getId());
            if (count >= tournament.getMaxPlayers()) {
                throw new TournamentFullException(tournament.getId(), tournament.getMaxPlayers());
            }
        }

        String waNumber = PhoneNormalizer.normalize(request.phone());
        String email = request.email().trim().toLowerCase();

        assertIdentityAvailable(request, waNumber, email);
        assertNotAlreadyRegisteredForSeason(tournament.getId(), waNumber, email);

        var sendResult = registrationIntentService.upsertAndSend(tournament.getId(), request, waNumber, email);
        UUID intentId = sendResult.intentId();

        auditService.log(
            tournament.getId(),
            null,
            "registration_submitted",
            email,
            client,
            request.city(),
            "intent=" + intentId + (sendResult.emailDispatched() ? "" : ";otp_debounced")
        );
        if (sendResult.emailDispatched()) {
            auditService.log(tournament.getId(), null, "otp_sent", email, client, request.city(), null);
        }

        return RegistrationResponse.pendingVerification(intentId, tournament.getId());
    }

    @Transactional
    public RegistrationResponse verifyEmail(
        int season,
        UUID pendingId,
        VerifyEmailRequest body,
        ClientRequestContext client
    ) {
        Tournament tournament = tournamentRepository
            .findFirstBySeasonOrderByCreatedAtDesc(season)
            .orElseThrow(() -> new IllegalStateException("No tournament found for season " + season));

        Instant now = clock.instant();
        if (!tournament.isRegistrationOpenAt(now)) {
            throw new RegistrationClosedException(tournament.getId(), now);
        }

        if (tournament.getMaxPlayers() != null) {
            long count = tournamentPlayerRepository.countEmailVerifiedByTournamentId(tournament.getId());
            if (count >= tournament.getMaxPlayers()) {
                throw new TournamentFullException(tournament.getId(), tournament.getMaxPlayers());
            }
        }

        RegistrationIntent intent;
        try {
            intent = registrationIntentService.verifyAndRemove(pendingId, tournament.getId(), body.code());
        } catch (RuntimeException ex) {
            auditService.log(
                tournament.getId(),
                null,
                "verify_failed",
                null,
                client,
                null,
                ex.getMessage()
            );
            throw ex;
        }

        RegistrationRequest request =
            intent
                .getPayload()
                .toRequest(intent.getEmail(), denormalizePhoneForForm(intent.getWaNumber()), null);

        String email = intent.getEmail();
        String waNumber = intent.getWaNumber();

        assertIdentityAvailable(request, waNumber, email);
        assertNotAlreadyRegisteredForSeason(tournament.getId(), waNumber, email);

        Player player = resolvePlayer(request, waNumber, email);
        UUID playerId = player.getId();
        player.markEmailVerified(now);
        playerRepository.save(player);

        TournamentPlayer entry = TournamentPlayer.pending(tournament, player);
        entry.setTeamName(request.teamName().trim());
        tournamentPlayerRepository.save(entry);

        auditService.log(tournament.getId(), playerId, "email_verified", email, client, player.getCity(), null);
        auditService.log(tournament.getId(), playerId, "registration_completed", email, client, player.getCity(), null);

        return RegistrationResponse.registered(playerId, tournament.getId(), false);
    }

    @Transactional
    public void resendVerification(int season, UUID pendingId, ClientRequestContext client) {
        Tournament tournament = tournamentRepository
            .findFirstBySeasonOrderByCreatedAtDesc(season)
            .orElseThrow(() -> new IllegalStateException("No tournament found for season " + season));
        registrationIntentService.resend(pendingId, tournament.getId());
        auditService.log(tournament.getId(), null, "otp_resent", null, client, null, null);
    }

    private void assertNotAlreadyRegisteredForSeason(UUID tournamentId, String waNumber, String email) {
        var byWa = playerRepository.findByWaNumber(waNumber);
        var byEmail = playerRepository.findByEmailIgnoreCase(email);
        UUID playerId = null;
        if (byWa.isPresent()) {
            playerId = byWa.get().getId();
        } else if (byEmail.isPresent()) {
            playerId = byEmail.get().getId();
        }
        if (playerId == null) {
            return;
        }
        if (
            tournamentPlayerRepository.existsByIdTournamentIdAndIdPlayerId(tournamentId, playerId) &&
            playerRepository.findById(playerId).map(Player::isEmailVerified).orElse(false)
        ) {
            throw new AlreadyRegisteredException(tournamentId, playerId);
        }
    }

    private void assertIdentityAvailable(RegistrationRequest request, String waNumber, String email) {
        var byWa = playerRepository.findByWaNumber(waNumber);
        var byEmail = playerRepository.findByEmailIgnoreCase(email);

        if (byWa.isPresent() && byEmail.isPresent()) {
            if (!byWa.get().getId().equals(byEmail.get().getId())) {
                throw new IdentityConflictException(
                    "This WhatsApp number and email belong to different existing accounts. Contact an admin."
                );
            }
            return;
        }

        if (byWa.isPresent()) {
            Player existing = byWa.get();
            if (!existing.getEmail().equalsIgnoreCase(email)) {
                throw new IdentityConflictException(
                    "This WhatsApp number is already registered with a different email."
                );
            }
            return;
        }

        if (byEmail.isPresent()) {
            throw new IdentityConflictException(
                "This email is already registered with a different WhatsApp number."
            );
        }

        String gaming = request.gamingUsername().trim();
        if (playerRepository.findByGamingUsernameIgnoreCase(gaming).isPresent()) {
            throw new IdentityConflictException("This gaming username is already taken.");
        }
    }

    private Player resolvePlayer(RegistrationRequest request, String waNumber, String email) {
        var byWa = playerRepository.findByWaNumber(waNumber);
        var byEmail = playerRepository.findByEmailIgnoreCase(email);

        if (byWa.isPresent()) {
            return byWa.get();
        }
        if (byEmail.isPresent()) {
            return byEmail.get();
        }

        String avatarUrl = normalizeAvatarUrl(request.avatarUrl());
        Player player = Player.register(
            request.name().trim(),
            waNumber,
            email,
            request.gamingUsername().trim(),
            request.efootballUsername() != null ? request.efootballUsername().trim() : null,
            request.city() != null ? request.city().trim() : null,
            avatarUrl
        );

        try {
            return playerRepository.save(player);
        } catch (DataIntegrityViolationException ex) {
            throw new AlreadyRegisteredException(null, null);
        }
    }

    private static String denormalizePhoneForForm(String waNumber) {
        if (waNumber.startsWith("91") && waNumber.length() == 12) {
            return "+91 " + waNumber.substring(2);
        }
        return waNumber;
    }

    private static String normalizeAvatarUrl(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String url = raw.trim();
        if (url.length() > 2048) {
            throw new IllegalArgumentException("Avatar URL is too long.");
        }
        if (!url.startsWith("https://")) {
            throw new IllegalArgumentException("Avatar URL must be https.");
        }
        return url;
    }
}
