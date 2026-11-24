package com.janseva.controller;

import com.janseva.dto.AiDtos.AdminAssistantRequest;
import com.janseva.dto.AiDtos.AdminAssistantResponse;
import com.janseva.dto.AiDtos.ParseComplaintRequest;
import com.janseva.dto.AiDtos.ParseComplaintResponse;
import com.janseva.dto.AiDtos.SemanticSearchRequest;
import com.janseva.dto.AiDtos.SemanticSearchResponse;
import com.janseva.service.AdminAnalyticsService;
import com.janseva.service.ConversationAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final ConversationAiService conversationAiService;
    private final AdminAnalyticsService adminAnalyticsService;

    public AiController(
            ConversationAiService conversationAiService,
            AdminAnalyticsService adminAnalyticsService) {
        this.conversationAiService = conversationAiService;
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @PostMapping("/parse-complaint")
    public ResponseEntity<ParseComplaintResponse> parseComplaint(@RequestBody ParseComplaintRequest request) {
        return ResponseEntity.ok(conversationAiService.parseComplaint(request));
    }

    @PostMapping("/admin-assistant")
    @PreAuthorize("hasAnyRole('DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'OFFICER')")
    public ResponseEntity<AdminAssistantResponse> adminAssistant(@RequestBody AdminAssistantRequest request) {
        return ResponseEntity.ok(adminAnalyticsService.answerAdminQuestion(request));
    }

    @PostMapping("/semantic-search")
    public ResponseEntity<SemanticSearchResponse> semanticSearch(@RequestBody SemanticSearchRequest request) {
        return ResponseEntity.ok(adminAnalyticsService.semanticSearch(request));
    }
}
