package com.janseva.service;

import com.janseva.entity.Department;
import com.janseva.entity.Grievance;
import com.janseva.entity.GrievanceStatusHistory;
import com.janseva.entity.User;
import com.janseva.repository.DepartmentRepository;
import com.janseva.repository.GrievanceRepository;
import com.janseva.repository.GrievanceStatusHistoryRepository;
import com.janseva.repository.UserRepository;
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

    public RoutingService(
            GrievanceRepository grievanceRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            GrievanceStatusHistoryRepository historyRepository) {
        this.grievanceRepository = grievanceRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
    }

    @Transactional
    public RoutingResult routeAndAssignGrievance(Long grievanceId) {
        Optional<Grievance> optGrievance = grievanceRepository.findById(grievanceId);
        if (optGrievance.isEmpty()) {
            return null;
        }
        Grievance grievance = optGrievance.get();

        Long deptId = departmentRepository.findByName(grievance.getDepartment())
                .map(Department::getId)
                .orElse(null);

        User assignedOfficer = null;
        if (deptId != null) {
            assignedOfficer = userRepository.findLeastLoadedOfficerInDepartment(deptId).orElse(null);
        }
        if (assignedOfficer == null) {
            assignedOfficer = userRepository.findFirstByRole("OFFICER").orElse(null);
        }

        if (assignedOfficer != null) {
            grievance.setAssignedOfficerId(assignedOfficer.getId());
            grievance.setStatus("ASSIGNED");
            grievanceRepository.save(grievance);

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

        return new RoutingResult(false, null, grievance.getDepartment(), "No active officer available");
    }
}
