package com.janseva;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.janseva.entity.Department;
import com.janseva.entity.Grievance;
import com.janseva.entity.User;
import com.janseva.ml.MLDtos.DuplicateCheckResponse;
import com.janseva.ml.MLService;
import com.janseva.repository.DepartmentRepository;
import com.janseva.repository.GrievanceRepository;
import com.janseva.repository.UserRepository;
import com.janseva.security.JwtService;
import com.janseva.service.SlaService;
import com.janseva.util.IdGenerator;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GrievanceAndSlaWorkflowTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private DataSource dataSource;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private GrievanceRepository grievanceRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private SlaService slaService;

    @MockitoBean private MLService mlService;

    private User citizen1;
    private User citizen2;
    private User officerWater;
    private User admin;
    private String citizen1Token;
    private String citizen2Token;
    private String officerToken;

    @BeforeEach
    void setup() throws Exception {
        TestDbHelper.cleanAllTables(dataSource);
        when(mlService.checkDuplicates(any())).thenReturn(new DuplicateCheckResponse(true, 0, List.of()));

        Department waterDept = departmentRepository.save(
                new Department("Water Department", "WATER", "Water supply & pipes"));

        citizen1 = saveUser("Rahul Sharma", "citizen@sih.gov.in", "CITIZEN", null);
        citizen2 = saveUser("Priya Verma", "priya@sih.gov.in", "CITIZEN", null);
        officerWater = saveUser("Officer Vikram", "officer@sih.gov.in", "OFFICER", waterDept.getId());
        admin = saveUser("Super Admin", "admin@sih.gov.in", "SUPER_ADMIN", null);

        citizen1Token = jwtService.generateToken(citizen1.getId(), citizen1.getRole(), citizen1.getEmail());
        citizen2Token = jwtService.generateToken(citizen2.getId(), citizen2.getRole(), citizen2.getEmail());
        officerToken = jwtService.generateToken(officerWater.getId(), officerWater.getRole(), officerWater.getEmail());
    }

    private User saveUser(String name, String email, String role, Long deptId) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode("password123"));
        u.setRole(role);
        u.setDepartmentId(deptId);
        return userRepository.save(u);
    }

    @Test
    void trackingIdFormatMatchesLegacySpec() {
        String id = IdGenerator.generateGrievanceId();
        assertTrue(id.matches("GRV-\\d{4}-[0-9A-F]{6}"), "Expected GRV-YYYY-XXXXXX format, got: " + id);
    }

    @Test
    void fullGrievanceLifecycleRoutingAuthorizationAndVerify() throws Exception {
        // 1. Citizen1 creates grievance -> auto-assigned to officerWater, SLA set
        MvcResult createRes = mockMvc.perform(post("/api/grievances")
                        .header("Authorization", "Bearer " + citizen1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "category", "Water Supply",
                                "subcategory", "No Water Supply",
                                "department", "Water Department",
                                "priority", "HIGH",
                                "description", "No water supply in Model Town for 3 days",
                                "location_text", "Model Town",
                                "ai_confidence", 0.96
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tracking_number", notNullValue()))
                .andExpect(jsonPath("$.grievance.status", is("ASSIGNED")))
                .andExpect(jsonPath("$.grievance.assigned_officer_id", is(officerWater.getId().intValue())))
                .andExpect(jsonPath("$.grievance.sla_deadline", notNullValue()))
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(createRes.getResponse().getContentAsString());
        long grievanceId = createdJson.get("grievance").get("id").asLong();
        String trackingNo = createdJson.get("tracking_number").asText();

        // 2. Citizen2 cannot view Citizen1's grievance -> 403
        mockMvc.perform(get("/api/grievances/" + trackingNo)
                        .header("Authorization", "Bearer " + citizen2Token))
                .andExpect(status().isForbidden());

        // 3. Citizen1 can view by tracking number with timeline history
        mockMvc.perform(get("/api/grievances/" + trackingNo)
                        .header("Authorization", "Bearer " + citizen1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grievance.tracking_number", is(trackingNo)))
                .andExpect(jsonPath("$.history", hasSize(2)));

        // 4. Citizen cannot update status -> 403
        mockMvc.perform(patch("/api/grievances/" + grievanceId + "/status")
                        .header("Authorization", "Bearer " + citizen1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "RESOLVED"))))
                .andExpect(status().isForbidden());

        // 5. Officer updates status to RESOLVED -> 200
        mockMvc.perform(patch("/api/grievances/" + grievanceId + "/status")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "RESOLVED",
                                "notes", "Pipeline valve repaired"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grievance.status", is("RESOLVED")))
                .andExpect(jsonPath("$.grievance.resolved_at", notNullValue()));

        // 6. Citizen rejects resolution -> REOPENED & ESCALATED to Level 2
        mockMvc.perform(post("/api/grievances/" + grievanceId + "/verify")
                        .header("Authorization", "Bearer " + citizen1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "verified", false,
                                "reason", "Still no water pressure"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("REOPENED")));

        Grievance reopened = grievanceRepository.findById(grievanceId).orElseThrow();
        assertEquals(1, reopened.getIsEscalated());
        assertEquals(2, reopened.getEscalationLevel());
        assertEquals(1, reopened.getReopenCount());
    }

    @Test
    void slaEscalationWorkerDetectsAndEscalatesBreachedGrievance() {
        Grievance g = new Grievance();
        g.setTrackingNumber(IdGenerator.generateGrievanceId());
        g.setCitizenId(citizen1.getId());
        g.setCategory("Electricity");
        g.setDepartment("Electricity Department");
        g.setPriority("HIGH");
        g.setDescription("Power outage SLA breach test");
        g.setStatus("ASSIGNED");
        g.setAssignedOfficerId(officerWater.getId());
        g.setSlaDeadline(Instant.now().minus(1, ChronoUnit.HOURS).toString());
        g = grievanceRepository.save(g);

        int escalatedCount = slaService.processSLAEscalations();
        assertEquals(1, escalatedCount);

        Grievance updated = grievanceRepository.findById(g.getId()).orElseThrow();
        assertEquals("ESCALATED", updated.getStatus());
        assertEquals(1, updated.getIsEscalated());
        assertEquals(1, updated.getEscalationLevel());
    }
}
