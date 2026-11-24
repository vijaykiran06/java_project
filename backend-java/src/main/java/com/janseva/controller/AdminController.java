package com.janseva.controller;

import com.janseva.dto.GrievanceDtos.AssignWorkerRequest;
import com.janseva.dto.GrievanceDtos.GrievanceListResponse;
import com.janseva.dto.GrievanceDtos.GrievanceView;
import com.janseva.dto.GrievanceDtos.ReopenGrievanceRequest;
import com.janseva.dto.GrievanceDtos.ResolveGrievanceRequest;
import com.janseva.dto.GrievanceDtos.SlaMonitoringOverview;
import com.janseva.dto.GrievanceDtos.WorkerWorkloadView;
import com.janseva.security.CustomUserDetails;
import com.janseva.service.GrievanceService;
import com.janseva.service.SlaService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'OFFICER')")
public class AdminController {

    private final GrievanceService grievanceService;
    private final SlaService slaService;

    public AdminController(GrievanceService grievanceService, SlaService slaService) {
        this.grievanceService = grievanceService;
        this.slaService = slaService;
    }

    @GetMapping("/grievances")
    public ResponseEntity<GrievanceListResponse> listAllGrievances(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(grievanceService.listGrievances(principal.getUser()));
    }

    @GetMapping("/workers/available")
    public ResponseEntity<List<WorkerWorkloadView>> getAvailableWorkers(
            @RequestParam(value = "departmentId", required = false) Long departmentId) {
        return ResponseEntity.ok(grievanceService.getAvailableWorkers(departmentId));
    }

    @PostMapping("/grievances/{id}/assign")
    public ResponseEntity<GrievanceView> assignWorker(
            @PathVariable("id") Long id,
            @RequestBody AssignWorkerRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        GrievanceView updated = grievanceService.assignWorker(id, request.workerId(), request.notes(), principal.getUser());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/grievances/{id}/reassign")
    public ResponseEntity<GrievanceView> reassignWorker(
            @PathVariable("id") Long id,
            @RequestBody AssignWorkerRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        GrievanceView updated = grievanceService.assignWorker(id, request.workerId(), request.notes(), principal.getUser());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/grievances/{id}/resolve")
    public ResponseEntity<GrievanceView> resolveGrievance(
            @PathVariable("id") Long id,
            @RequestBody ResolveGrievanceRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        GrievanceView updated = grievanceService.resolveGrievance(id, request, principal.getUser());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/grievances/{id}/reopen")
    public ResponseEntity<GrievanceView> reopenGrievance(
            @PathVariable("id") Long id,
            @RequestBody(required = false) ReopenGrievanceRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        String reason = request != null ? request.reason() : "Reopened by administrator";
        GrievanceView updated = grievanceService.reopenGrievance(id, reason, principal.getUser());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/sla/monitoring")
    public ResponseEntity<SlaMonitoringOverview> getSlaMonitoring() {
        return ResponseEntity.ok(slaService.getSlaMonitoringOverview());
    }
}
