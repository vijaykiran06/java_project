package com.janseva;

import static org.junit.jupiter.api.Assertions.*;

import com.janseva.dto.GrievanceDtos.AssignWorkerRequest;
import com.janseva.dto.GrievanceDtos.CreateGrievanceRequest;
import com.janseva.dto.GrievanceDtos.CreateGrievanceResponse;
import com.janseva.dto.GrievanceDtos.GrievanceView;
import com.janseva.dto.GrievanceDtos.ResolveGrievanceRequest;
import com.janseva.dto.GrievanceDtos.WorkerWorkloadView;
import com.janseva.entity.Department;
import com.janseva.entity.Grievance;
import com.janseva.entity.GrievanceAssignmentHistory;
import com.janseva.entity.User;
import com.janseva.repository.DepartmentRepository;
import com.janseva.repository.GrievanceAssignmentHistoryRepository;
import com.janseva.repository.GrievanceRepository;
import com.janseva.repository.UserRepository;
import com.janseva.service.GrievanceService;
import com.janseva.service.SlaService;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminWorkerAssignmentAndSlaTest {

    @Autowired
    private GrievanceService grievanceService;

    @Autowired
    private SlaService slaService;

    @Autowired
    private GrievanceRepository grievanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private GrievanceAssignmentHistoryRepository assignmentHistoryRepository;

    private User citizen;
    private User admin;
    private User fieldWorker;
    private Department waterDept;

    @BeforeEach
    void setUp() {
        waterDept = departmentRepository.findByName("Water Department")
                .orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Water Department");
                    d.setCode("WATER");
                    return departmentRepository.save(d);
                });

        citizen = saveUser("Rajesh Citizen", "rajesh_test@sih.gov.in", "CITIZEN", null);
        admin = saveUser("Super Admin", "superadmin_test@sih.gov.in", "SUPER_ADMIN", null);
        fieldWorker = saveUser("Suresh Technician", "suresh_tech_test@sih.gov.in", "OFFICER", waterDept.getId());
    }

    private User saveUser(String name, String email, String role, Long deptId) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setName(name);
            u.setEmail(email);
            u.setPasswordHash("$2a$10$DWKuwUZElLsu2TWomQG4perHFtEjvJ2bpcsUTvzGjQOEjSyvFOyfm");
            u.setRole(role);
            u.setDepartmentId(deptId);
            u.setPhone("9876543299");
            return userRepository.save(u);
        });
    }

    @Test
    void testStrict24HourSlaAssignmentAndResolutionWorkflow() {
        // 1. Create grievance
        CreateGrievanceRequest req = new CreateGrievanceRequest(
                "Water Supply",
                "Pipe Leakage",
                "Water Department",
                "HIGH",
                "Severe pipeline rupture in Block 4",
                "Block 4, City Center",
                18.5204,
                73.8567,
                "en",
                0.95
        );

        CreateGrievanceResponse createRes = grievanceService.createGrievance(req, citizen);
        assertNotNull(createRes.trackingNumber());
        Grievance g = createRes.grievance();
        assertNotNull(g.getSlaDeadline(), "SLA deadline must be automatically calculated and populated");

        // Verify SLA deadline is exactly ~24 hours from now
        Instant deadline = Instant.parse(g.getSlaDeadline());
        long hoursDiff = Duration.between(Instant.now(), deadline).toHours();
        assertTrue(hoursDiff >= 23 && hoursDiff <= 24, "Deadline must be 24 continuous hours from submission");
        assertEquals("WITHIN_SLA", g.getSlaStatus());

        // 2. Query available workers
        List<WorkerWorkloadView> workers = grievanceService.getAvailableWorkers(waterDept.getId());
        assertFalse(workers.isEmpty(), "Workers should be listed for water department");

        // 3. Admin assigns field worker
        GrievanceView assignedView = grievanceService.assignWorker(
                g.getId(), fieldWorker.getId(), "Prioritize repair within 4 hours", admin);

        assertEquals(fieldWorker.getId(), assignedView.assignedOfficerId);
        assertEquals(admin.getId(), assignedView.assignedBy);
        assertNotNull(assignedView.assignedAt);
        assertEquals("Prioritize repair within 4 hours", assignedView.assignmentNotes);

        // Verify assignment history logged
        List<GrievanceAssignmentHistory> history = assignmentHistoryRepository.findByGrievanceIdOrderByCreatedAtDesc(g.getId());
        assertFalse(history.isEmpty(), "Assignment history must be recorded");
        assertEquals(fieldWorker.getId(), history.get(0).getWorkerId());
        assertEquals("ACTIVE", history.get(0).getStatus());

        // 4. Resolve Grievance with mandatory details
        ResolveGrievanceRequest resolveReq = new ResolveGrievanceRequest(
                "Pipeline welded and main valve replaced",
                "Excavated street point, welded 4-inch pipe, pressure tested at 5 bar",
                "Work verified on-site"
        );

        GrievanceView resolvedView = grievanceService.resolveGrievance(g.getId(), resolveReq, fieldWorker);
        assertEquals("RESOLVED", resolvedView.status);
        assertNotNull(resolvedView.resolvedAt);
        assertEquals(fieldWorker.getId(), resolvedView.resolvedBy);
        assertEquals("Pipeline welded and main valve replaced", resolvedView.resolutionSummary);
        assertEquals("Excavated street point, welded 4-inch pipe, pressure tested at 5 bar", resolvedView.workPerformed);
        assertEquals("RESOLVED_ON_TIME", resolvedView.slaStatus);

        // 5. Reopen Grievance -> Starts fresh 24h SLA cycle
        GrievanceView reopenedView = grievanceService.reopenGrievance(g.getId(), "Citizen noticed low pressure after weld", citizen);
        assertEquals("REOPENED", reopenedView.status);
        assertEquals(1, reopenedView.reopenCount);
        assertEquals("WITHIN_SLA", reopenedView.slaStatus);
        assertNotNull(reopenedView.slaDeadline);

        Instant newDeadline = Instant.parse(reopenedView.slaDeadline);
        long newHoursDiff = Duration.between(Instant.now(), newDeadline).toHours();
        assertTrue(newHoursDiff >= 23 && newHoursDiff <= 24, "Fresh 24-hour cycle must be established upon reopening");
    }
}
