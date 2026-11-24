package com.janseva.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.janseva.dto.GrievanceDtos.AssignWorkerRequest;
import com.janseva.dto.GrievanceDtos.CreateGrievanceRequest;
import com.janseva.dto.GrievanceDtos.CreateGrievanceResponse;
import com.janseva.dto.GrievanceDtos.GrievanceDetailResponse;
import com.janseva.dto.GrievanceDtos.GrievanceListResponse;
import com.janseva.dto.GrievanceDtos.GrievanceView;
import com.janseva.dto.GrievanceDtos.ReopenGrievanceRequest;
import com.janseva.dto.GrievanceDtos.ResolveGrievanceRequest;
import com.janseva.dto.GrievanceDtos.StatusHistoryView;
import com.janseva.dto.GrievanceDtos.StatusUpdateResponse;
import com.janseva.dto.GrievanceDtos.UpdateStatusRequest;
import com.janseva.dto.GrievanceDtos.VerifyRequest;
import com.janseva.dto.GrievanceDtos.VerifyResponse;
import com.janseva.dto.GrievanceDtos.WorkerWorkloadView;
import com.janseva.entity.AiAnalysis;
import com.janseva.entity.AuditLog;
import com.janseva.entity.Department;
import com.janseva.entity.Escalation;
import com.janseva.entity.Grievance;
import com.janseva.entity.GrievanceAssignmentHistory;
import com.janseva.entity.GrievanceStatusHistory;
import com.janseva.entity.LocationRecord;
import com.janseva.entity.User;
import com.janseva.exception.BadRequestException;
import com.janseva.exception.ForbiddenException;
import com.janseva.exception.ResourceNotFoundException;
import com.janseva.ml.MLDtos.DuplicateMatch;
import com.janseva.repository.AiAnalysisRepository;
import com.janseva.repository.AuditLogRepository;
import com.janseva.repository.DepartmentRepository;
import com.janseva.repository.EscalationRepository;
import com.janseva.repository.GrievanceAssignmentHistoryRepository;
import com.janseva.repository.GrievanceRepository;
import com.janseva.repository.GrievanceStatusHistoryRepository;
import com.janseva.repository.LocationRepository;
import com.janseva.repository.UserRepository;
import com.janseva.util.DomainConstants;
import com.janseva.util.IdGenerator;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GrievanceService {

    private static final Logger log = LoggerFactory.getLogger(GrievanceService.class);

    private final GrievanceRepository grievanceRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final LocationRepository locationRepository;
    private final AiAnalysisRepository aiAnalysisRepository;
    private final GrievanceStatusHistoryRepository historyRepository;
    private final AuditLogRepository auditLogRepository;
    private final EscalationRepository escalationRepository;
    private final GrievanceAssignmentHistoryRepository assignmentHistoryRepository;
    private final SlaService slaService;
    private final RoutingService routingService;
    private final DuplicateService duplicateService;
    private final ObjectMapper objectMapper;

    public GrievanceService(
            GrievanceRepository grievanceRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            LocationRepository locationRepository,
            AiAnalysisRepository aiAnalysisRepository,
            GrievanceStatusHistoryRepository historyRepository,
            AuditLogRepository auditLogRepository,
            EscalationRepository escalationRepository,
            GrievanceAssignmentHistoryRepository assignmentHistoryRepository,
            SlaService slaService,
            RoutingService routingService,
            DuplicateService duplicateService,
            ObjectMapper objectMapper) {
        this.grievanceRepository = grievanceRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.locationRepository = locationRepository;
        this.aiAnalysisRepository = aiAnalysisRepository;
        this.historyRepository = historyRepository;
        this.auditLogRepository = auditLogRepository;
        this.escalationRepository = escalationRepository;
        this.assignmentHistoryRepository = assignmentHistoryRepository;
        this.slaService = slaService;
        this.routingService = routingService;
        this.duplicateService = duplicateService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public CreateGrievanceResponse createGrievance(CreateGrievanceRequest req, User citizen) {
        if (req == null || req.description() == null || req.description().trim().isEmpty()) {
            throw new BadRequestException("Grievance description is required.");
        }
        if (req.category() == null || !DomainConstants.VALID_CATEGORIES.contains(req.category())) {
            throw new BadRequestException("Invalid category. Must be one of: "
                    + String.join(", ", DomainConstants.VALID_CATEGORIES));
        }

        String validatedPriority = (req.priority() != null && DomainConstants.VALID_PRIORITIES.contains(req.priority()))
                ? req.priority()
                : "MEDIUM";
        String validatedDepartment = (req.department() != null && !req.department().isBlank())
                ? req.department()
                : "Municipal Administration";
        String trackingNumber = IdGenerator.generateGrievanceId();

        Grievance g = new Grievance();
        g.setTrackingNumber(trackingNumber);
        g.setCitizenId(citizen.getId());
        g.setCategory(req.category());
        g.setSubcategory(req.subcategory() != null && !req.subcategory().isBlank()
                ? req.subcategory() : "General Complaint");
        g.setDepartment(validatedDepartment);
        g.setPriority(validatedPriority);
        g.setDescription(req.description().trim());
        g.setLocationText(req.locationText() != null ? req.locationText().trim() : null);
        g.setLatitude(req.latitude());
        g.setLongitude(req.longitude());
        g.setLanguage(req.language() != null && !req.language().isBlank() ? req.language() : "en");
        g.setStatus("SUBMITTED");
        g.setAiConfidence(req.aiConfidence() != null ? req.aiConfidence() : 0.9);

        Grievance saved = grievanceRepository.save(g);
        Long grievanceId = saved.getId();

        if (saved.getLocationText() != null && !saved.getLocationText().isBlank()) {
            LocationRecord loc = new LocationRecord();
            loc.setGrievanceId(grievanceId);
            loc.setLocationText(saved.getLocationText());
            loc.setLatitude(saved.getLatitude());
            loc.setLongitude(saved.getLongitude());
            locationRepository.save(loc);
        }

        AiAnalysis analysis = new AiAnalysis();
        analysis.setGrievanceId(grievanceId);
        analysis.setConfidence(saved.getAiConfidence());
        analysis.setExtractedJson(serializeExtractedJson(saved));
        aiAnalysisRepository.save(analysis);

        GrievanceStatusHistory hist = new GrievanceStatusHistory();
        hist.setGrievanceId(grievanceId);
        hist.setPreviousStatus(null);
        hist.setNewStatus("SUBMITTED");
        hist.setChangedByUserId(citizen.getId());
        hist.setNotes("Grievance submitted by citizen via AI Assistant");
        historyRepository.save(hist);

        AuditLog audit = new AuditLog();
        audit.setUserId(citizen.getId());
        audit.setAction("GRIEVANCE_CREATED");
        audit.setEntityName("grievances");
        audit.setEntityId(trackingNumber);
        audit.setDetails("Created grievance " + trackingNumber);
        auditLogRepository.save(audit);

        slaService.setSLAForGrievance(grievanceId, validatedPriority);
        routingService.routeAndAssignGrievance(grievanceId);

        Grievance targetGrv = grievanceRepository.findById(grievanceId).orElse(saved);
        List<DuplicateMatch> duplicates = List.of();
        try {
            duplicates = duplicateService.findDuplicatesForGrievance(targetGrv);
            if (!duplicates.isEmpty()) {
                DuplicateMatch topDup = duplicates.get(0);
                targetGrv.setIsDuplicate(1);
                targetGrv.setDuplicateOfId(topDup.duplicateGrievanceId());
                targetGrv.setDuplicateConfidence(topDup.confidence());
                grievanceRepository.save(targetGrv);
            }
        } catch (Exception ex) {
            log.warn("Duplicate check skipped for grievance {}: {}", trackingNumber, ex.getMessage());
        }

        Grievance createdGrievance = grievanceRepository.findById(grievanceId).orElse(targetGrv);
        return new CreateGrievanceResponse(
                "Grievance registered successfully.",
                trackingNumber,
                createdGrievance,
                duplicates
        );
    }

    public GrievanceListResponse listGrievances(User user) {
        List<Grievance> rows;
        if ("CITIZEN".equals(user.getRole())) {
            rows = grievanceRepository.findByCitizenIdOrderByCreatedAtDesc(user.getId());
        } else if ("OFFICER".equals(user.getRole())) {
            String deptName = user.getDepartmentId() != null
                    ? departmentRepository.findById(user.getDepartmentId()).map(Department::getName).orElse(null)
                    : null;
            rows = grievanceRepository.findForOfficer(user.getId(), deptName);
        } else {
            rows = grievanceRepository.findAllByOrderByCreatedAtDesc();
        }

        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a));

        List<GrievanceView> views = rows.stream()
                .map(g -> {
                    String citizenName = g.getCitizenId() != null && userMap.containsKey(g.getCitizenId())
                            ? userMap.get(g.getCitizenId()).getName() : null;
                    User officer = g.getAssignedOfficerId() != null ? userMap.get(g.getAssignedOfficerId()) : null;
                    String officerName = officer != null ? officer.getName() : null;
                    String workerPhone = officer != null ? officer.getPhone() : null;
                    String workerEmail = officer != null ? officer.getEmail() : null;
                    return GrievanceView.from(g, citizenName, officerName, officerName, workerPhone, workerEmail);
                })
                .toList();

        return new GrievanceListResponse(views);
    }

    public GrievanceDetailResponse getGrievanceDetail(String idOrTracking, User user) {
        Grievance grievance = findByIdOrTracking(idOrTracking);

        if ("CITIZEN".equals(user.getRole()) && !grievance.getCitizenId().equals(user.getId())) {
            throw new ForbiddenException("Forbidden. Access restricted to complaint owner.");
        }

        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a));

        List<StatusHistoryView> history = historyRepository
                .findByGrievanceIdOrderByCreatedAtAsc(grievance.getId())
                .stream()
                .map(h -> {
                    String changedByName = h.getChangedByUserId() != null && userMap.containsKey(h.getChangedByUserId())
                            ? userMap.get(h.getChangedByUserId()).getName() : null;
                    return StatusHistoryView.from(h, changedByName);
                })
                .toList();

        return new GrievanceDetailResponse(grievance, history);
    }

    @Transactional
    public StatusUpdateResponse updateStatus(Long grievanceId, UpdateStatusRequest req, User actor) {
        if (req == null || req.status() == null || req.status().isBlank()) {
            throw new BadRequestException("Status is required.");
        }

        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance not found."));

        String prevStatus = grievance.getStatus();
        String newStatus = req.status().trim();
        grievance.setStatus(newStatus);
        grievance.setResolutionNotes(req.notes());
        if ("RESOLVED".equals(newStatus)) {
            grievance.setResolvedAt(Instant.now().toString());
        }
        Grievance updated = grievanceRepository.save(grievance);

        GrievanceStatusHistory hist = new GrievanceStatusHistory();
        hist.setGrievanceId(grievanceId);
        hist.setPreviousStatus(prevStatus);
        hist.setNewStatus(newStatus);
        hist.setChangedByUserId(actor.getId());
        hist.setNotes(req.notes() != null && !req.notes().isBlank()
                ? req.notes()
                : "Status changed from " + prevStatus + " to " + newStatus);
        historyRepository.save(hist);

        AuditLog audit = new AuditLog();
        audit.setUserId(actor.getId());
        audit.setAction("STATUS_UPDATE");
        audit.setEntityName("grievances");
        audit.setEntityId(grievance.getTrackingNumber());
        audit.setDetails("Status updated to " + newStatus);
        auditLogRepository.save(audit);

        return new StatusUpdateResponse("Status updated successfully.", updated);
    }

    @Transactional
    public GrievanceView assignWorker(Long grievanceId, Long workerId, String notes, User actor) {
        Grievance g = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance not found."));

        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker/Official not found with ID " + workerId));

        Long prevWorkerId = g.getAssignedOfficerId();
        String prevStatus = g.getStatus();

        g.setAssignedOfficerId(worker.getId());
        g.setAssignedBy(actor.getId());
        g.setAssignedAt(Instant.now().toString());
        g.setAssignmentNotes(notes);
        if ("SUBMITTED".equals(prevStatus) || "REOPENED".equals(prevStatus)) {
            g.setStatus("ASSIGNED");
        }
        Grievance saved = grievanceRepository.save(g);

        GrievanceAssignmentHistory assignHist = new GrievanceAssignmentHistory();
        assignHist.setGrievanceId(grievanceId);
        assignHist.setWorkerId(worker.getId());
        assignHist.setAssignedBy(actor.getId());
        assignHist.setAssignedAt(Instant.now().toString());
        assignHist.setPreviousWorkerId(prevWorkerId);
        assignHist.setAssignmentNotes(notes);
        assignHist.setStatus("ACTIVE");
        assignmentHistoryRepository.save(assignHist);

        GrievanceStatusHistory statusHist = new GrievanceStatusHistory();
        statusHist.setGrievanceId(grievanceId);
        statusHist.setPreviousStatus(prevStatus);
        statusHist.setNewStatus(saved.getStatus());
        statusHist.setChangedByUserId(actor.getId());
        statusHist.setNotes("Assigned to " + worker.getName() + (notes != null && !notes.isBlank() ? " (" + notes + ")" : ""));
        historyRepository.save(statusHist);

        AuditLog audit = new AuditLog();
        audit.setUserId(actor.getId());
        audit.setAction("WORKER_ASSIGNED");
        audit.setEntityName("grievances");
        audit.setEntityId(g.getTrackingNumber());
        audit.setDetails("Assigned worker " + worker.getName() + " by " + actor.getName());
        auditLogRepository.save(audit);

        return toView(saved);
    }

    @Transactional
    public GrievanceView resolveGrievance(Long grievanceId, ResolveGrievanceRequest req, User actor) {
        if (req == null || req.resolutionSummary() == null || req.resolutionSummary().trim().isEmpty()) {
            throw new BadRequestException("Resolution summary is mandatory to resolve a grievance.");
        }
        if (req.workPerformed() == null || req.workPerformed().trim().isEmpty()) {
            throw new BadRequestException("Work performed details are required.");
        }

        Grievance g = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance not found."));

        String prevStatus = g.getStatus();
        Instant now = Instant.now();

        g.setStatus("RESOLVED");
        g.setResolvedAt(now.toString());
        g.setResolvedBy(actor.getId());
        g.setResolutionSummary(req.resolutionSummary().trim());
        g.setWorkPerformed(req.workPerformed().trim());
        g.setResolutionNotes(req.notes());

        // SLA resolution validation (within 24h or overdue)
        if (g.getSlaDeadline() != null) {
            try {
                Instant deadline = Instant.parse(g.getSlaDeadline());
                if (now.isAfter(deadline)) {
                    g.setSlaStatus("RESOLVED_OVERDUE");
                } else {
                    g.setSlaStatus("RESOLVED_ON_TIME");
                }
            } catch (Exception ignored) {
                g.setSlaStatus("RESOLVED_ON_TIME");
            }
        }

        // Calculate actual resolution duration in seconds
        if (g.getCreatedAt() != null) {
            try {
                String createdStr = g.getCreatedAt().replace(" ", "T");
                if (!createdStr.endsWith("Z")) {
                    createdStr += "Z";
                }
                Instant createdInstant = Instant.parse(createdStr);
                g.setActualResolutionDuration(java.time.Duration.between(createdInstant, now).getSeconds());
            } catch (Exception ignored) {}
        }

        Grievance saved = grievanceRepository.save(g);

        GrievanceStatusHistory statusHist = new GrievanceStatusHistory();
        statusHist.setGrievanceId(grievanceId);
        statusHist.setPreviousStatus(prevStatus);
        statusHist.setNewStatus("RESOLVED");
        statusHist.setChangedByUserId(actor.getId());
        statusHist.setNotes("Resolved: " + req.resolutionSummary().trim() + " | Work: " + req.workPerformed().trim());
        historyRepository.save(statusHist);

        AuditLog audit = new AuditLog();
        audit.setUserId(actor.getId());
        audit.setAction("GRIEVANCE_RESOLVED");
        audit.setEntityName("grievances");
        audit.setEntityId(g.getTrackingNumber());
        audit.setDetails("Resolved by " + actor.getName() + " with summary: " + req.resolutionSummary());
        auditLogRepository.save(audit);

        return toView(saved);
    }

    @Transactional
    public GrievanceView reopenGrievance(Long grievanceId, String reason, User actor) {
        Grievance g = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance not found."));

        int reopenCount = (g.getReopenCount() != null ? g.getReopenCount() : 0) + 1;
        String prevStatus = g.getStatus();

        g.setStatus("REOPENED");
        g.setReopenCount(reopenCount);
        g.setReopenReason(reason != null && !reason.isBlank() ? reason : "Reopened for additional investigation");
        g.setIsEscalated(1);
        g.setEscalationLevel(Math.max((g.getEscalationLevel() != null ? g.getEscalationLevel() : 0) + 1, 2));

        // Start a fresh 24-hour SLA cycle
        g.setSlaDeadline(Instant.now().plus(24, ChronoUnit.HOURS).toString());
        g.setSlaStatus("WITHIN_SLA");
        g.setSlaBreachedAt(null);
        g.setResolvedAt(null);

        Grievance saved = grievanceRepository.save(g);

        GrievanceStatusHistory statusHist = new GrievanceStatusHistory();
        statusHist.setGrievanceId(grievanceId);
        statusHist.setPreviousStatus(prevStatus);
        statusHist.setNewStatus("REOPENED");
        statusHist.setChangedByUserId(actor.getId());
        statusHist.setNotes("Reopened (Cycle " + reopenCount + "): " + (reason != null ? reason : "Issue persists"));
        historyRepository.save(statusHist);

        Escalation esc = new Escalation();
        esc.setGrievanceId(grievanceId);
        esc.setEscalatedFromOfficerId(g.getAssignedOfficerId());
        esc.setReason("Grievance reopened by " + actor.getName() + ": " + (reason != null ? reason : "Issue persists"));
        esc.setLevel(g.getEscalationLevel());
        esc.setStatus("REOPENED");
        escalationRepository.save(esc);

        return toView(saved);
    }

    public List<WorkerWorkloadView> getAvailableWorkers(Long departmentId) {
        List<User> workers = userRepository.findAll().stream()
                .filter(u -> "OFFICER".equals(u.getRole()) || "DEPARTMENT_ADMIN".equals(u.getRole()))
                .filter(u -> departmentId == null || departmentId.equals(u.getDepartmentId()))
                .toList();

        Map<Long, String> deptMap = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName, (a, b) -> a));

        List<Grievance> activeGrievances = grievanceRepository.findAll().stream()
                .filter(g -> "ASSIGNED".equals(g.getStatus()) || "ACKNOWLEDGED".equals(g.getStatus()) || "IN_PROGRESS".equals(g.getStatus()))
                .toList();

        Map<Long, Long> workloadCounts = activeGrievances.stream()
                .filter(g -> g.getAssignedOfficerId() != null)
                .collect(Collectors.groupingBy(Grievance::getAssignedOfficerId, Collectors.counting()));

        return workers.stream()
                .map(w -> new WorkerWorkloadView(
                        w.getId(),
                        w.getName(),
                        w.getEmail(),
                        w.getRole(),
                        w.getDepartmentId(),
                        w.getDepartmentId() != null ? deptMap.get(w.getDepartmentId()) : "General",
                        w.getPhone(),
                        w.getZone(),
                        workloadCounts.getOrDefault(w.getId(), 0L)
                ))
                .sorted((a, b) -> Long.compare(a.activeCases(), b.activeCases()))
                .toList();
    }

    public GrievanceView toView(Grievance g) {
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a));
        String citizenName = g.getCitizenId() != null && userMap.containsKey(g.getCitizenId())
                ? userMap.get(g.getCitizenId()).getName() : null;
        User worker = g.getAssignedOfficerId() != null ? userMap.get(g.getAssignedOfficerId()) : null;
        String workerName = worker != null ? worker.getName() : null;
        String workerPhone = worker != null ? worker.getPhone() : null;
        String workerEmail = worker != null ? worker.getEmail() : null;
        return GrievanceView.from(g, citizenName, workerName, workerName, workerPhone, workerEmail);
    }

    @Transactional
    public VerifyResponse verifyResolution(Long grievanceId, VerifyRequest req, User citizen) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance not found."));

        if (!grievance.getCitizenId().equals(citizen.getId())) {
            throw new ForbiddenException("Forbidden. Only the complaint author can verify resolution.");
        }

        boolean verified = Boolean.TRUE.equals(req != null ? req.verified() : null);
        if (verified) {
            grievance.setStatus("CITIZEN_VERIFIED");
            grievance.setVerifiedAt(Instant.now().toString());
            grievanceRepository.save(grievance);

            GrievanceStatusHistory hist = new GrievanceStatusHistory();
            hist.setGrievanceId(grievanceId);
            hist.setPreviousStatus("RESOLVED");
            hist.setNewStatus("CITIZEN_VERIFIED");
            hist.setChangedByUserId(citizen.getId());
            hist.setNotes("Citizen confirmed resolution: YES, RESOLVED");
            historyRepository.save(hist);

            return new VerifyResponse("Grievance marked as Citizen Verified & Closed.", "CITIZEN_VERIFIED");
        } else {
            int newReopenCount = (grievance.getReopenCount() != null ? grievance.getReopenCount() : 0) + 1;
            String reason = (req != null && req.reason() != null && !req.reason().isBlank())
                    ? req.reason()
                    : "Citizen stated issue persists after resolution attempt";

            grievance.setStatus("REOPENED");
            grievance.setIsEscalated(1);
            grievance.setEscalationLevel(2);
            grievance.setReopenCount(newReopenCount);
            grievance.setReopenReason(reason);
            // Strict 24-hour SLA cycle restart on reopen
            grievance.setSlaDeadline(Instant.now().plus(24, ChronoUnit.HOURS).toString());
            grievance.setSlaStatus("WITHIN_SLA");
            grievance.setSlaBreachedAt(null);
            grievance.setResolvedAt(null);
            grievanceRepository.save(grievance);

            GrievanceStatusHistory hist = new GrievanceStatusHistory();
            hist.setGrievanceId(grievanceId);
            hist.setPreviousStatus("RESOLVED");
            hist.setNewStatus("REOPENED");
            hist.setChangedByUserId(citizen.getId());
            hist.setNotes("CITIZEN REOPENED: " + (req != null && req.reason() != null && !req.reason().isBlank()
                    ? req.reason() : "Issue persists"));
            historyRepository.save(hist);

            Escalation esc = new Escalation();
            esc.setGrievanceId(grievanceId);
            esc.setEscalatedFromOfficerId(grievance.getAssignedOfficerId());
            esc.setReason("Reopened by citizen after false resolution marking");
            esc.setLevel(2);
            esc.setStatus("REOPENED");
            escalationRepository.save(esc);

            return new VerifyResponse("Grievance reopened and escalated to department senior officer.", "REOPENED");
        }
    }

    private Grievance findByIdOrTracking(String idOrTracking) {
        try {
            long numericId = Long.parseLong(idOrTracking);
            return grievanceRepository.findById(numericId)
                    .orElseThrow(() -> new ResourceNotFoundException("Grievance not found."));
        } catch (NumberFormatException ex) {
            return grievanceRepository.findByTrackingNumber(idOrTracking)
                    .orElseThrow(() -> new ResourceNotFoundException("Grievance not found."));
        }
    }

    private String serializeExtractedJson(Grievance g) {
        try {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("category", g.getCategory());
            map.put("subcategory", g.getSubcategory());
            map.put("department", g.getDepartment());
            map.put("priority", g.getPriority());
            map.put("description", g.getDescription());
            map.put("location_text", g.getLocationText());
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }
}
