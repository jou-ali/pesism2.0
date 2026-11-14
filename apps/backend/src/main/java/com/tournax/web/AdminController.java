package com.tournax.web;

import com.tournax.application.AdminService;
import com.tournax.application.RegistrationAuditService;
import com.tournax.application.dto.RegistrationAuditRow;
import com.tournax.application.FairPlayAdminService;
import com.tournax.application.GrievanceService;
import com.tournax.application.FixtureAdminService;
import com.tournax.application.MatchAdminService;
import com.tournax.application.dto.AdminMatchDetailDto;
import com.tournax.application.dto.AdminMatchRow;
import com.tournax.application.dto.AddGrievanceCommentRequest;
import com.tournax.application.dto.FairPlayRow;
import com.tournax.application.dto.GrievanceDetailDto;
import com.tournax.application.dto.GrievanceRow;
import com.tournax.application.dto.UpdateGrievanceStatusRequest;
import com.tournax.application.dto.GenerateFixturesResponse;
import com.tournax.application.dto.RecordMatchRequest;
import com.tournax.application.dto.ScheduleFixtureRequest;
import com.tournax.application.dto.UpdateAvatarRequest;
import com.tournax.application.dto.UpdateMatchRequest;
import com.tournax.application.dto.AdminDashboardResponse;
import com.tournax.application.dto.AdminRegistrationRow;
import com.tournax.application.dto.RegistrationWindowPatchRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/seasons/{season}")
public class AdminController {

    private final AdminService adminService;
    private final MatchAdminService matchAdminService;
    private final FixtureAdminService fixtureAdminService;
    private final FairPlayAdminService fairPlayAdminService;
    private final GrievanceService grievanceService;
    private final RegistrationAuditService registrationAuditService;

    public AdminController(
        AdminService adminService,
        MatchAdminService matchAdminService,
        FixtureAdminService fixtureAdminService,
        FairPlayAdminService fairPlayAdminService,
        GrievanceService grievanceService,
        RegistrationAuditService registrationAuditService
    ) {
        this.adminService = adminService;
        this.matchAdminService = matchAdminService;
        this.fixtureAdminService = fixtureAdminService;
        this.fairPlayAdminService = fairPlayAdminService;
        this.grievanceService = grievanceService;
        this.registrationAuditService = registrationAuditService;
    }

    @GetMapping("/dashboard")
    public AdminDashboardResponse dashboard(@PathVariable int season) {
        return adminService.dashboard(season);
    }

    @GetMapping("/registrations")
    public List<AdminRegistrationRow> registrations(@PathVariable int season) {
        return adminService.listRegistrations(season);
    }

    @GetMapping("/registration-audit")
    public List<RegistrationAuditRow> registrationAudit(@PathVariable int season) {
        return adminService.registrationAudit(season).stream().map(RegistrationAuditRow::from).toList();
    }

    @PatchMapping("/registrations/{playerId}/avatar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateAvatar(
        @PathVariable int season,
        @PathVariable UUID playerId,
        @RequestBody UpdateAvatarRequest body
    ) {
        adminService.updatePlayerAvatar(season, playerId, body.avatarUrl());
    }

    @PostMapping("/registrations/{playerId}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@PathVariable int season, @PathVariable UUID playerId) {
        adminService.approveRegistration(season, playerId);
    }

    @DeleteMapping("/registrations/{playerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable int season, @PathVariable UUID playerId) {
        adminService.removeRegistration(season, playerId);
    }

    @PostMapping("/registration/close")
    public AdminDashboardResponse closeRegistration(@PathVariable int season) {
        return adminService.closeRegistration(season);
    }

    @PostMapping("/registration/open")
    public AdminDashboardResponse openRegistration(@PathVariable int season) {
        return adminService.openRegistration(season);
    }

    @PostMapping("/registration/window")
    public AdminDashboardResponse patchWindow(
        @PathVariable int season,
        @RequestBody RegistrationWindowPatchRequest body
    ) {
        return adminService.updateRegistrationWindow(season, body);
    }

    @GetMapping("/fair-play")
    public List<FairPlayRow> fairPlay(@PathVariable int season) {
        return fairPlayAdminService.fairPlayTable(season);
    }

    @GetMapping("/grievances")
    public List<GrievanceRow> listGrievances(@PathVariable int season) {
        return grievanceService.listForAdmin(season);
    }

    @GetMapping("/grievances/{grievanceId}")
    public GrievanceDetailDto getGrievance(@PathVariable int season, @PathVariable UUID grievanceId) {
        return grievanceService.detailForAdmin(season, grievanceId);
    }

    @PatchMapping("/grievances/{grievanceId}/status")
    public GrievanceDetailDto updateGrievanceStatus(
        @PathVariable int season,
        @PathVariable UUID grievanceId,
        @Valid @RequestBody UpdateGrievanceStatusRequest body
    ) {
        return grievanceService.updateStatus(season, grievanceId, body);
    }

    @PostMapping("/grievances/{grievanceId}/comments")
    public GrievanceDetailDto addGrievanceComment(
        @PathVariable int season,
        @PathVariable UUID grievanceId,
        @Valid @RequestBody AddGrievanceCommentRequest body
    ) {
        return grievanceService.addComment(season, grievanceId, body);
    }

    @GetMapping("/fixtures")
    public List<AdminMatchRow> listFixtures(@PathVariable int season) {
        return fixtureAdminService.listLeagueFixtures(season);
    }

    @PostMapping("/fixtures/generate")
    public GenerateFixturesResponse generateLeagueFixtures(@PathVariable int season) {
        return fixtureAdminService.generateLeagueFixtures(season);
    }

    @PostMapping("/fixtures/schedule")
    public AdminMatchRow scheduleFixture(@PathVariable int season, @Valid @RequestBody ScheduleFixtureRequest body) {
        return fixtureAdminService.scheduleLeagueMatch(season, body);
    }

    @GetMapping("/results")
    public List<AdminMatchRow> listResults(@PathVariable int season) {
        return matchAdminService.listMatches(season);
    }

    @PostMapping("/results")
    public AdminMatchRow recordResult(@PathVariable int season, @RequestBody RecordMatchRequest body) {
        return matchAdminService.recordMatch(season, body);
    }

    @GetMapping("/match-results/{matchId}")
    public AdminMatchDetailDto getMatchResult(@PathVariable int season, @PathVariable UUID matchId) {
        return matchAdminService.getMatch(season, matchId);
    }

    @PatchMapping("/match-results/{matchId}")
    public AdminMatchDetailDto updateMatchResult(
        @PathVariable int season,
        @PathVariable UUID matchId,
        @RequestBody UpdateMatchRequest body
    ) {
        return matchAdminService.updateMatch(season, matchId, body);
    }

    @DeleteMapping("/match-results/{matchId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMatchResult(@PathVariable int season, @PathVariable UUID matchId) {
        matchAdminService.deleteMatch(season, matchId);
    }
}
