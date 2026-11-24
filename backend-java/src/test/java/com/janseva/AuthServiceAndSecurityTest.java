package com.janseva;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.janseva.repository.DepartmentRepository;
import com.janseva.repository.UserRepository;
import com.janseva.security.JwtService;
import java.util.Map;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthServiceAndSecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private JwtService jwtService;
    @Autowired private DataSource dataSource;

    @BeforeEach
    void resetDb() throws Exception {
        TestDbHelper.cleanAllTables(dataSource);
    }

    @Test
    void healthAndDepartmentsArePublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("HEALTHY")))
                .andExpect(jsonPath("$.backend", is("Java Spring Boot")));

        mockMvc.perform(get("/api/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid_categories[0]", is("Water Supply")));
    }

    @Test
    void registerLoginAndMeFlowWithJwtValidation() throws Exception {
        // Missing token -> 401
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", notNullValue()));

        // Invalid token -> 403
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", notNullValue()));

        // Register new citizen -> 201
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Rahul Sharma",
                                "email", "rahul@sih.gov.in",
                                "password", "password123",
                                "phone", "9876543210"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.role", is("CITIZEN")))
                .andReturn();

        JsonNode regJson = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String token = regJson.get("token").asText();
        long userId = regJson.get("user").get("id").asLong();
        assertEquals(userId, jwtService.extractUserId(token));

        // Duplicate email -> 400
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Rahul Clone",
                                "email", "rahul@sih.gov.in",
                                "password", "password123"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", notNullValue()));

        // Login valid -> 200
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "rahul@sih.gov.in",
                                "password", "password123"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("rahul@sih.gov.in")));

        // Login wrong password -> 401
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "rahul@sih.gov.in",
                                "password", "wrongpass"
                        ))))
                .andExpect(status().isUnauthorized());

        // /api/auth/me with valid token -> 200
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email", is("rahul@sih.gov.in")))
                .andExpect(jsonPath("$.user.role", is("CITIZEN")));
    }
}
