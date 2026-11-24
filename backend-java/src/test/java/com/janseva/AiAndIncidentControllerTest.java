package com.janseva;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.janseva.entity.Grievance;
import com.janseva.entity.User;
import com.janseva.exception.MLServiceException;
import com.janseva.ml.MLDtos.ChatResponseResult;
import com.janseva.ml.MLDtos.DuplicateCheckResponse;
import com.janseva.ml.MLDtos.DuplicateMatch;
import com.janseva.ml.MLDtos.GrievancePredictResponse;
import com.janseva.ml.MLDtos.IntentPredictResponse;
import com.janseva.ml.MLService;
import com.janseva.repository.GrievanceRepository;
import com.janseva.repository.UserRepository;
import com.janseva.security.JwtService;
import com.janseva.util.IdGenerator;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiAndIncidentControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private DataSource dataSource;
    @Autowired private UserRepository userRepository;
    @Autowired private GrievanceRepository grievanceRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    @MockitoBean private MLService mlService;

    private User citizen;
    private User admin;
    private String citizenToken;
    private String adminToken;

    @BeforeEach
    void setup() throws Exception {
        TestDbHelper.cleanAllTables(dataSource);
        citizen = saveUser("Citizen One", "c1@sih.gov.in", "CITIZEN");
        admin = saveUser("Super Admin", "admin@sih.gov.in", "SUPER_ADMIN");
        citizenToken = jwtService.generateToken(citizen.getId(), citizen.getRole(), citizen.getEmail());
        adminToken = jwtService.generateToken(admin.getId(), admin.getRole(), admin.getEmail());
    }

    private User saveUser(String name, String email, String role) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode("password123"));
        u.setRole(role);
        return userRepository.save(u);
    }

    @Test
    void conversationalAiMultiTurnMissingLocationThenProvided() throws Exception {
        when(mlService.predictIntent(any()))
                .thenReturn(new IntentPredictResponse("GRIEVANCE", 0.95, false));
        when(mlService.predictGrievance(any()))
                .thenReturn(new GrievancePredictResponse(
                        "Water Department",
                        "Water Supply",
                        "No Water Supply",
                        "HIGH",
                        "There has been no water supply for three days.",
                        null,
                        "en",
                        0.94,
                        Map.of("No Water Supply", 0.94),
                        List.of("location_text"),
                        true,
                        List.of("water", "supply"),
                        null
                ));

        // Turn 1: missing location -> prompts for location_text
        String turn1Body = mockMvc.perform(post("/api/ai/parse-complaint")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "text", "There has been no water supply for three days."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.is_grievance", is(true)))
                .andExpect(jsonPath("$.conversation_state.awaitingField", is("location_text")))
                .andReturn().getResponse().getContentAsString();

        @SuppressWarnings("unchecked")
        Map<String, Object> turn1Map = objectMapper.readValue(turn1Body, Map.class);

        // Turn 2: user provides location -> readyForSubmission = true
        mockMvc.perform(post("/api/ai/parse-complaint")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "text", "Model Town",
                                "conversation_state", turn1Map.get("conversation_state")
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.intent", is("LOCATION_PROVIDED")))
                .andExpect(jsonPath("$.extracted_data.location_text", is("Model Town")))
                .andExpect(jsonPath("$.conversation_state.readyForSubmission", is(true)));
    }

    @Test
    void greetingAndMlFailurePropagatesWithoutFakeFallback() throws Exception {
        when(mlService.predictIntent(any()))
                .thenReturn(new IntentPredictResponse("GREETING", 0.99, false));
        when(mlService.generateChatResponse(any()))
                .thenReturn(new ChatResponseResult("Hello! How can I assist you today?"));

        mockMvc.perform(post("/api/ai/parse-complaint")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("text", "hello"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.is_grievance", is(false)))
                .andExpect(jsonPath("$.intent", is("GREETING")));

        // Verify ML outage returns 502 instead of fake AI output
        when(mlService.predictIntent(any()))
                .thenThrow(new MLServiceException("Connection refused to Python ML service"));

        mockMvc.perform(post("/api/ai/parse-complaint")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("text", "water issue"))))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error", containsString("Python ML service")));
    }

    @Test
    void adminAssistantAndDuplicateClusteringWorkWithRoleChecks() throws Exception {
        Grievance g1 = new Grievance();
        g1.setTrackingNumber(IdGenerator.generateGrievanceId());
        g1.setCitizenId(citizen.getId());
        g1.setCategory("Water Supply");
        g1.setDepartment("Water Department");
        g1.setPriority("HIGH");
        g1.setDescription("No water supply in Model Town market");
        g1.setLocationText("Model Town");
        g1.setStatus("SUBMITTED");
        g1 = grievanceRepository.save(g1);

        Grievance g2 = new Grievance();
        g2.setTrackingNumber(IdGenerator.generateGrievanceId());
        g2.setCitizenId(citizen.getId());
        g2.setCategory("Water Supply");
        g2.setDepartment("Water Department");
        g2.setPriority("HIGH");
        g2.setDescription("No water supply in Model Town market area");
        g2.setLocationText("Model Town");
        g2.setStatus("SUBMITTED");
        g2 = grievanceRepository.save(g2);

        // Citizen blocked from admin-assistant -> 403
        mockMvc.perform(post("/api/ai/admin-assistant")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("question", "top category?"))))
                .andExpect(status().isForbidden());

        // Admin gets metrics -> 200
        mockMvc.perform(post("/api/ai/admin-assistant")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("question", "What is the biggest category?"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metrics.total_grievances", is(2)))
                .andExpect(jsonPath("$.answer", containsString("Water Supply")));

        // Cluster duplicates into INCIDENT-XXXX
        final Long firstId = g1.getId();
        final String firstTrack = g1.getTrackingNumber();
        when(mlService.checkDuplicates(any())).thenReturn(new DuplicateCheckResponse(
                true, 1,
                List.of(new DuplicateMatch(
                        firstId, firstTrack, "Water Supply", "Model Town",
                        "No water supply in Model Town market", 0.9, 0.2, 0.93, "POSSIBLE DUPLICATE"))
        ));

        mockMvc.perform(post("/api/incidents/cluster-duplicates")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.incidents", hasSize(1)));
    }
}
