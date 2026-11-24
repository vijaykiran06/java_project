package com.janseva;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.janseva.entity.Grievance;
import com.janseva.entity.User;
import com.janseva.repository.GrievanceRepository;
import com.janseva.repository.UserRepository;
import com.janseva.security.JwtService;
import com.janseva.util.IdGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private GrievanceRepository grievanceRepository;
    @Autowired private JwtService jwtService;

    private User admin;
    private User citizen;
    private String adminToken;
    private String citizenToken;

    @BeforeEach
    void setUp() {
        admin = userRepository.findByEmail("admin_mock_test@sih.gov.in").orElseGet(() -> {
            User u = new User();
            u.setName("Admin Tester");
            u.setEmail("admin_mock_test@sih.gov.in");
            u.setPasswordHash("$2a$10$DWKuwUZElLsu2TWomQG4perHFtEjvJ2bpcsUTvzGjQOEjSyvFOyfm");
            u.setRole("SUPER_ADMIN");
            return userRepository.save(u);
        });

        citizen = userRepository.findByEmail("citizen_mock_test@sih.gov.in").orElseGet(() -> {
            User u = new User();
            u.setName("Citizen Tester");
            u.setEmail("citizen_mock_test@sih.gov.in");
            u.setPasswordHash("$2a$10$DWKuwUZElLsu2TWomQG4perHFtEjvJ2bpcsUTvzGjQOEjSyvFOyfm");
            u.setRole("CITIZEN");
            return userRepository.save(u);
        });

        Grievance g = new Grievance();
        g.setTrackingNumber(IdGenerator.generateGrievanceId());
        g.setCitizenId(citizen.getId());
        g.setCategory("Water Supply");
        g.setDepartment("Water Department");
        g.setPriority("HIGH");
        g.setDescription("Test complaint");
        g.setLocationText("Test Road");
        g.setStatus("SUBMITTED");
        grievanceRepository.save(g);

        adminToken = jwtService.generateToken(admin.getId(), admin.getRole(), admin.getEmail());
        citizenToken = jwtService.generateToken(citizen.getId(), citizen.getRole(), citizen.getEmail());
    }

    @Test
    void testGetAdminGrievancesAsAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/grievances")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grievances", not(empty())));
    }

    @Test
    void testGetAdminGrievancesAsCitizenForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/grievances")
                .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isForbidden());
    }
}
