package com.janseva.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.janseva.entity.Grievance;
import com.janseva.entity.GrievanceStatusHistory;
import java.util.List;

public final class GrievanceDtos {

    private GrievanceDtos() {}

    public record CreateGrievanceRequest(
            String category,
            String subcategory,
            String department,
            String priority,
            String description,
            @JsonProperty("location_text") String locationText,
            Double latitude,
            Double longitude,
            String language,
            @JsonProperty("ai_confidence") Double aiConfidence
    ) {}

    public record UpdateStatusRequest(String status, String notes) {}

    public record VerifyRequest(Boolean verified, String reason) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class GrievanceView {
        public Long id;
        @JsonProperty("tracking_number") public String trackingNumber;
        @JsonProperty("citizen_id") public Long citizenId;
        public String category;
        public String subcategory;
        public String department;
        public String priority;
        public String description;
        @JsonProperty("location_text") public String locationText;
        public Double latitude;
        public Double longitude;
        public String language;
        public String status;
        @JsonProperty("ai_confidence") public Double aiConfidence;
        @JsonProperty("assigned_officer_id") public Long assignedOfficerId;
        @JsonProperty("sla_deadline") public String slaDeadline;
        @JsonProperty("is_escalated") public Integer isEscalated;
        @JsonProperty("escalation_level") public Integer escalationLevel;
        @JsonProperty("incident_id") public Long incidentId;
        @JsonProperty("is_duplicate") public Integer isDuplicate;
        @JsonProperty("duplicate_of_id") public Long duplicateOfId;
        @JsonProperty("duplicate_confidence") public Double duplicateConfidence;
        @JsonProperty("reopen_count") public Integer reopenCount;
        @JsonProperty("reopen_reason") public String reopenReason;
        @JsonProperty("resolution_notes") public String resolutionNotes;
        @JsonProperty("resolved_at") public String resolvedAt;
        @JsonProperty("verified_at") public String verifiedAt;
        @JsonProperty("image_url") public String imageUrl;
        @JsonProperty("created_at") public String createdAt;
        @JsonProperty("updated_at") public String updatedAt;
        @JsonProperty("citizen_name") public String citizenName;
        @JsonProperty("officer_name") public String officerName;

        public static GrievanceView from(Grievance g, String citizenName, String officerName) {
            GrievanceView v = new GrievanceView();
            v.id = g.getId();
            v.trackingNumber = g.getTrackingNumber();
            v.citizenId = g.getCitizenId();
            v.category = g.getCategory();
            v.subcategory = g.getSubcategory();
            v.department = g.getDepartment();
            v.priority = g.getPriority();
            v.description = g.getDescription();
            v.locationText = g.getLocationText();
            v.latitude = g.getLatitude();
            v.longitude = g.getLongitude();
            v.language = g.getLanguage();
            v.status = g.getStatus();
            v.aiConfidence = g.getAiConfidence();
            v.assignedOfficerId = g.getAssignedOfficerId();
            v.slaDeadline = g.getSlaDeadline();
            v.isEscalated = g.getIsEscalated();
            v.escalationLevel = g.getEscalationLevel();
            v.incidentId = g.getIncidentId();
            v.isDuplicate = g.getIsDuplicate();
            v.duplicateOfId = g.getDuplicateOfId();
            v.duplicateConfidence = g.getDuplicateConfidence();
            v.reopenCount = g.getReopenCount();
            v.reopenReason = g.getReopenReason();
            v.resolutionNotes = g.getResolutionNotes();
            v.resolvedAt = g.getResolvedAt();
            v.verifiedAt = g.getVerifiedAt();
            v.imageUrl = g.getImageUrl();
            v.createdAt = g.getCreatedAt();
            v.updatedAt = g.getUpdatedAt();
            v.citizenName = citizenName;
            v.officerName = officerName;
            return v;
        }
    }

    public static class StatusHistoryView {
        public Long id;
        @JsonProperty("grievance_id") public Long grievanceId;
        @JsonProperty("previous_status") public String previousStatus;
        @JsonProperty("new_status") public String newStatus;
        @JsonProperty("changed_by_user_id") public Long changedByUserId;
        public String notes;
        @JsonProperty("created_at") public String createdAt;
        @JsonProperty("changed_by_name") public String changedByName;

        public static StatusHistoryView from(GrievanceStatusHistory h, String changedByName) {
            StatusHistoryView v = new StatusHistoryView();
            v.id = h.getId();
            v.grievanceId = h.getGrievanceId();
            v.previousStatus = h.getPreviousStatus();
            v.newStatus = h.getNewStatus();
            v.changedByUserId = h.getChangedByUserId();
            v.notes = h.getNotes();
            v.createdAt = h.getCreatedAt();
            v.changedByName = changedByName;
            return v;
        }
    }

    public record CreateGrievanceResponse(
            String message,
            @JsonProperty("tracking_number") String trackingNumber,
            Grievance grievance,
            @JsonProperty("duplicates_detected") List<com.janseva.ml.MLDtos.DuplicateMatch> duplicatesDetected
    ) {}

    public record GrievanceListResponse(List<GrievanceView> grievances) {}

    public record GrievanceDetailResponse(Grievance grievance, List<StatusHistoryView> history) {}

    public record StatusUpdateResponse(String message, Grievance grievance) {}

    public record VerifyResponse(String message, String status) {}
}
