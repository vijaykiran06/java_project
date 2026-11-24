package com.janseva.controller;

import com.janseva.dto.IncidentDtos.ClusterResponse;
import com.janseva.dto.IncidentDtos.IncidentListResponse;
import com.janseva.service.IncidentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    public ResponseEntity<IncidentListResponse> list() {
        return ResponseEntity.ok(incidentService.listIncidents());
    }

    @PostMapping("/cluster-duplicates")
    @PreAuthorize("hasAnyRole('DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'OFFICER')")
    public ResponseEntity<ClusterResponse> clusterDuplicates() {
        return ResponseEntity.ok(incidentService.clusterDuplicates());
    }
}
