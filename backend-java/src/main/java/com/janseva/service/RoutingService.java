package com.janseva.service;

import com.janseva.entity.Department;
import com.janseva.entity.Grievance;
import com.janseva.entity.GrievanceAssignmentHistory;
import com.janseva.entity.GrievanceStatusHistory;
import com.janseva.entity.User;
import com.janseva.repository.DepartmentRepository;
import com.janseva.repository.GrievanceAssignmentHistoryRepository;
import com.janseva.repository.GrievanceRepository;
import com.janseva.repository.GrievanceStatusHistoryRepository;
import com.janseva.repository.UserRepository;
import com.janseva.util.DomainConstants;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoutingService {

    private static final Logger log = LoggerFactory.getLogger(RoutingService.class);

    public record RoutingResult(boolean assigned, User officer, String department, String reason) {}

    private final GrievanceRepository grievanceRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final GrievanceStatusHistoryRepository historyRepository;
    private final GrievanceAssignmentHistoryRepository assignmentHistoryRepository;

    public RoutingService(
            GrievanceRepository grievanceRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            GrievanceStatusHistoryRepository historyRepository,
            GrievanceAssignmentHistoryRepository assignmentHistoryRepository) {
        this.grievanceRepository = grievanceRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.assignmentHistoryRepository = assignmentHistoryRepository;
    }

    /**
     * Resolves the department ID using exact name match, category mapping, code match, or keyword analysis.
     */
    public Long resolveDepartmentId(String departmentName, String categoryName) {
        if (departmentName != null && !departmentName.isBlank()) {
            String trimmed = departmentName.trim();
            Optional<Department> direct = departmentRepository.findByNameIgnoreCase(trimmed);
            if (direct.isPresent()) return direct.get().getId();
            Optional<Department> codeMatch = departmentRepository.findByCodeIgnoreCase(trimmed);
            if (codeMatch.isPresent()) return codeMatch.get().getId();
        }

        // Try category to department mapping
        if (categoryName != null && !categoryName.isBlank()) {
            String trimmedCat = categoryName.trim();
            if (DomainConstants.CATEGORY_TO_DEPARTMENT.containsKey(trimmedCat)) {
                String mappedDept = DomainConstants.CATEGORY_TO_DEPARTMENT.get(trimmedCat);
                Optional<Department> mapped = departmentRepository.findByNameIgnoreCase(mappedDept);
                if (mapped.isPresent()) return mapped.get().getId();
            }
        }

        // Keyword / substring match against all departments in DB
        List<Department> allDepts = departmentRepository.findAll();
        String searchStr = ((departmentName != null ? departmentName : "") + " " + (categoryName != null ? categoryName : "")).toLowerCase();

        for (Department d : allDepts) {
            String dName = d.getName().toLowerCase();
            String dCode = d.getCode() != null ? d.getCode().toLowerCase() : "";

            if (!dCode.isBlank() && searchStr.contains(dCode)) return d.getId();

            // Strict contextual keywords
            if ((searchStr.contains("traffic") || searchStr.contains("parking")) && dName.contains("traffic")) return d.getId();
            if (searchStr.contains("waste") && (dName.contains("waste") || dName.contains("sanitation & waste"))) return d.getId();
            if (searchStr.contains("sanitat") && !searchStr.contains("waste") && dName.equals("sanitation department")) return d.getId();
            if (searchStr.contains("water") && dName.contains("water")) return d.getId();
            if ((searchStr.contains("light") || searchStr.contains("street light")) && dName.contains("lighting")) return d.getId();
            if (searchStr.contains("electri") && !searchStr.contains("light") && dName.equals("electricity department")) return d.getId();
            if ((searchStr.contains("road") || searchStr.contains("pwd") || searchStr.contains("pothole")) && (dName.contains("public works") || dName.contains("pwd"))) return d.getId();
            if (searchStr.contains("drain") && dName.contains("drain")) return d.getId();
            if (searchStr.contains("health") && dName.contains("health")) return d.getId();
            if ((searchStr.contains("transport") || searchStr.contains("transit") || searchStr.contains("bus")) && dName.contains("transport")) return d.getId();
        }

        return null;
    }

    @Transactional
    public RoutingResult routeAndAssignGrievance(Long grievanceId) {
        Optional<Grievance> optGrievance = grievanceRepository.findById(grievanceId);
        if (optGrievance.isEmpty()) {
            return null;
        }
        Grievance grievance = optGrievance.get();

        Long deptId = resolveDepartmentId(grievance.getDepartment(), grievance.getCategory());

        User assignedOfficer = null;
        if (deptId != null) {
            assignedOfficer = userRepository.findLeastLoadedOfficerInDepartment(deptId).orElse(null);
        }

        // IMPORTANT REQUIREMENT:
        // Never assign an officer to an unrelated department.
        // Do not use a hardcoded default officer.
        // If no eligible officer is available, keep the grievance unassigned and notify the admin.
        if (assignedOfficer != null) {
            grievance.setAssignedOfficerId(assignedOfficer.getId());
            grievance.setStatus("ASSIGNED");
            grievance.setAssignedAt(Instant.now().toString());
            grievance.setAssignmentNotes("Auto-routed to " + grievance.getDepartment() + " official");
            grievanceRepository.save(grievance);

            // Record in grievance_assignment_history
            GrievanceAssignmentHistory assignHist = new GrievanceAssignmentHistory();
            assignHist.setGrievanceId(grievanceId);
            assignHist.setWorkerId(assignedOfficer.getId());
            assignHist.setAssignedAt(Instant.now().toString());
            assignHist.setAssignmentNotes("Automated departmental routing based on issue category");
            assignHist.setStatus("ACTIVE");
            assignmentHistoryRepository.save(assignHist);

            GrievanceStatusHistory hist = new GrievanceStatusHistory();
            hist.setGrievanceId(grievanceId);
            hist.setPreviousStatus("SUBMITTED");
            hist.setNewStatus("ASSIGNED");
            hist.setNotes("Automatically routed to " + grievance.getDepartment()
                    + " and assigned to " + assignedOfficer.getName());
            historyRepository.save(hist);

            log.info("Grievance {} routed to {} (Officer: {})",
                    grievance.getTrackingNumber(), grievance.getDepartment(), assignedOfficer.getName());
            return new RoutingResult(true, assignedOfficer, grievance.getDepartment(), null);
        }

        // If no eligible departmental officer is available, keep unassigned
        grievance.setAssignedOfficerId(null);
        grievance.setStatus("SUBMITTED");
        grievanceRepository.save(grievance);

        GrievanceStatusHistory unassignedHist = new GrievanceStatusHistory();
        unassignedHist.setGrievanceId(grievanceId);
        unassignedHist.setPreviousStatus("SUBMITTED");
        unassignedHist.setNewStatus("SUBMITTED");
        unassignedHist.setNotes("Routed to " + grievance.getDepartment() + " (Pending assignment: No active field officer available in this department)");
        historyRepository.save(unassignedHist);

        log.warn("Grievance {} kept unassigned: No officer available in department {}", 
                grievance.getTrackingNumber(), grievance.getDepartment());
        return new RoutingResult(false, null, grievance.getDepartment(), "No eligible officer available in " + grievance.getDepartment());
    }
}
