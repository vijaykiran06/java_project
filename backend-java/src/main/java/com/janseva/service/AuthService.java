package com.janseva.service;

import com.janseva.dto.AuthDtos.AuthResponse;
import com.janseva.dto.AuthDtos.LoginRequest;
import com.janseva.dto.AuthDtos.ProfileUpdateRequest;
import com.janseva.dto.AuthDtos.RegisterRequest;
import com.janseva.dto.AuthDtos.UserSummary;
import com.janseva.entity.User;
import com.janseva.exception.BadRequestException;
import com.janseva.exception.UnauthorizedException;
import com.janseva.repository.UserRepository;
import com.janseva.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req == null || isBlank(req.name()) || isBlank(req.email()) || isBlank(req.password())) {
            throw new BadRequestException("Name, email, and password are required.");
        }

        String normalizedEmail = req.email().toLowerCase().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        User user = new User();
        user.setName(req.name().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole("CITIZEN");
        user.setPhone(req.phone());
        user.setZone("Zone 1");

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved.getId(), saved.getRole(), saved.getEmail());

        UserSummary summary = new UserSummary(
                saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), null, saved.getPhone(), saved.getZone());

        return new AuthResponse("Citizen account registered successfully.", token, summary);
    }

    public AuthResponse login(LoginRequest req) {
        if (req == null || isBlank(req.email()) || isBlank(req.password())) {
            throw new BadRequestException("Email and password are required.");
        }

        String normalizedEmail = req.email().toLowerCase().trim();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        String token = jwtService.generateToken(user.getId(), user.getRole(), user.getEmail());
        UserSummary summary = new UserSummary(
                user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getDepartmentId(), user.getPhone(), user.getZone());

        return new AuthResponse("Login successful.", token, summary);
    }

    public UserSummary toUserSummary(User user) {
        return new UserSummary(
                user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getDepartmentId(), user.getPhone(), user.getZone());
    }

    @Transactional
    public UserSummary updateProfile(Long userId, ProfileUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User account not found."));

        if (req != null) {
            if (req.name() != null && !req.name().trim().isEmpty()) {
                user.setName(req.name().trim());
            }
            if (req.phone() != null) {
                user.setPhone(req.phone().trim());
            }
            if (req.zone() != null && !req.zone().trim().isEmpty()) {
                user.setZone(req.zone().trim());
            }
            if (req.newPassword() != null && !req.newPassword().trim().isEmpty()) {
                if (req.currentPassword() == null || !passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
                    throw new BadRequestException("Current password verification failed.");
                }
                if (req.newPassword().trim().length() < 6) {
                    throw new BadRequestException("New password must be at least 6 characters.");
                }
                user.setPasswordHash(passwordEncoder.encode(req.newPassword().trim()));
            }
        }

        User saved = userRepository.save(user);
        return toUserSummary(saved);
    }

    private boolean isBlank(String val) {
        return val == null || val.trim().isEmpty();
    }
}
