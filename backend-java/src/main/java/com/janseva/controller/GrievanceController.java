package com.janseva.controller;

import com.janseva.dto.GrievanceDtos.CreateGrievanceRequest;
import com.janseva.dto.GrievanceDtos.CreateGrievanceResponse;
import com.janseva.dto.GrievanceDtos.GrievanceDetailResponse;
import com.janseva.dto.GrievanceDtos.GrievanceListResponse;
import com.janseva.dto.GrievanceDtos.GrievanceView;
import com.janseva.dto.GrievanceDtos.ReopenGrievanceRequest;
import com.janseva.dto.GrievanceDtos.ResolveGrievanceRequest;
import com.janseva.dto.GrievanceDtos.StatusUpdateResponse;
import com.janseva.dto.GrievanceDtos.UpdateStatusRequest;
import com.janseva.dto.GrievanceDtos.VerifyRequest;
import com.janseva.dto.GrievanceDtos.VerifyResponse;
import com.janseva.security.CustomUserDetails;
import com.janseva.service.GrievanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/grievances")
public class GrievanceController {

    private final GrievanceService grievanceService;

    public GrievanceController(GrievanceService grievanceService) {
        this.grievanceService = grievanceService;
    }

    @PostMapping
    public ResponseEntity<CreateGrievanceResponse> create(
            @RequestBody CreateGrievanceRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        CreateGrievanceResponse res = grievanceService.createGrievance(request, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping
    public ResponseEntity<GrievanceListResponse> list(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(grievanceService.listGrievances(principal.getUser()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GrievanceDetailResponse> detail(
            @PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(grievanceService.getGrievanceDetail(id, principal.getUser()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OFFICER', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<StatusUpdateResponse> updateStatus(
            @PathVariable("id") Long id,
            @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(grievanceService.updateStatus(id, request, principal.getUser()));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<VerifyResponse> verify(
            @PathVariable("id") Long id,
            @RequestBody VerifyRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(grievanceService.verifyResolution(id, request, principal.getUser()));
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('OFFICER', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<GrievanceView> resolve(
            @PathVariable("id") Long id,
            @RequestBody ResolveGrievanceRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(grievanceService.resolveGrievance(id, request, principal.getUser()));
    }

    @PostMapping("/{id}/reopen")
    public ResponseEntity<GrievanceView> reopen(
            @PathVariable("id") Long id,
            @RequestBody(required = false) ReopenGrievanceRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        String reason = request != null ? request.reason() : "Reopened by user";
        return ResponseEntity.ok(grievanceService.reopenGrievance(id, reason, principal.getUser()));
    }
}
