package com.janseva.controller;

import com.janseva.dto.AuthDtos.AuthResponse;
import com.janseva.dto.AuthDtos.LoginRequest;
import com.janseva.dto.AuthDtos.MeResponse;
import com.janseva.dto.AuthDtos.ProfileUpdateRequest;
import com.janseva.dto.AuthDtos.RegisterRequest;
import com.janseva.dto.AuthDtos.UserSummary;
import com.janseva.security.CustomUserDetails;
import com.janseva.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(new MeResponse(authService.toUserSummary(principal.getUser())));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserSummary> updateProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody ProfileUpdateRequest request
    ) {
        return ResponseEntity.ok(authService.updateProfile(principal.getUser().getId(), request));
    }
}
