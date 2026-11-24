package com.janseva.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(String name, String email, String password, String phone) {}

    public record LoginRequest(String email, String password) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserSummary(
            Long id,
            String name,
            String email,
            String role,
            @JsonProperty("department_id") Long departmentId
    ) {}

    public record AuthResponse(String message, String token, UserSummary user) {}

    public record MeResponse(UserSummary user) {}
}
