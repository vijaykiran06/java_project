package com.janseva.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.janseva.entity.Grievance;
import java.util.List;
import java.util.Map;

public final class AiDtos {

    private AiDtos() {}

    public record ParseComplaintRequest(
            String text,
            @JsonProperty("location_text") String locationText,
            @JsonProperty("conversation_state") Map<String, Object> conversationState
    ) {}

    public record ParseComplaintResponse(
            boolean success,
            @JsonProperty("is_grievance") boolean isGrievance,
            String intent,
            @JsonProperty("ai_message") String aiMessage,
            @JsonProperty("extracted_data") Map<String, Object> extractedData,
            @JsonProperty("conversation_state") Map<String, Object> conversationState
    ) {}

    public record AdminAssistantRequest(String question) {}

    public record CategoryCount(String category, long count) {}

    public record DepartmentCount(String department, long count) {}

    public record AdminMetrics(
            @JsonProperty("total_grievances") long totalGrievances,
            @JsonProperty("pending_grievances") long pendingGrievances,
            @JsonProperty("resolved_grievances") long resolvedGrievances,
            @JsonProperty("escalated_grievances") long escalatedGrievances,
            @JsonProperty("category_breakdown") List<CategoryCount> categoryBreakdown,
            @JsonProperty("department_breakdown") List<DepartmentCount> departmentBreakdown
    ) {}

    public record AdminAssistantResponse(String answer, AdminMetrics metrics) {}

    public record SemanticSearchRequest(String query) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ScoredGrievanceView extends GrievanceDtos.GrievanceView {
        public int score;

        public static ScoredGrievanceView from(Grievance g, int score) {
            ScoredGrievanceView v = new ScoredGrievanceView();
            GrievanceDtos.GrievanceView base = GrievanceDtos.GrievanceView.from(g, null, null);
            v.id = base.id;
            v.trackingNumber = base.trackingNumber;
            v.citizenId = base.citizenId;
            v.category = base.category;
            v.subcategory = base.subcategory;
            v.department = base.department;
            v.priority = base.priority;
            v.description = base.description;
            v.locationText = base.locationText;
            v.latitude = base.latitude;
            v.longitude = base.longitude;
            v.language = base.language;
            v.status = base.status;
            v.aiConfidence = base.aiConfidence;
            v.assignedOfficerId = base.assignedOfficerId;
            v.slaDeadline = base.slaDeadline;
            v.isEscalated = base.isEscalated;
            v.escalationLevel = base.escalationLevel;
            v.incidentId = base.incidentId;
            v.isDuplicate = base.isDuplicate;
            v.duplicateOfId = base.duplicateOfId;
            v.duplicateConfidence = base.duplicateConfidence;
            v.reopenCount = base.reopenCount;
            v.reopenReason = base.reopenReason;
            v.resolutionNotes = base.resolutionNotes;
            v.resolvedAt = base.resolvedAt;
            v.verifiedAt = base.verifiedAt;
            v.imageUrl = base.imageUrl;
            v.createdAt = base.createdAt;
            v.updatedAt = base.updatedAt;
            v.score = score;
            return v;
        }
    }

    public record SemanticSearchResponse(String query, List<ScoredGrievanceView> results) {}
}
