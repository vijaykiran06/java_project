package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "grievances")
public class Grievance extends TimestampedEntity {

    @Column(name = "tracking_number", nullable = false, unique = true)
    @JsonProperty("tracking_number")
    private String trackingNumber;

    @Column(name = "citizen_id", nullable = false)
    @JsonProperty("citizen_id")
    private Long citizenId;

    @Column(nullable = false)
    private String category;

    private String subcategory;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String priority = "MEDIUM";

    @Column(nullable = false)
    private String description;

    @Column(name = "location_text")
    @JsonProperty("location_text")
    private String locationText;

    private Double latitude;

    private Double longitude;

    private String language = "en";

    @Column(nullable = false)
    private String status = "SUBMITTED";

    @Column(name = "ai_confidence")
    @JsonProperty("ai_confidence")
    private Double aiConfidence = 0.90;

    @Column(name = "assigned_officer_id")
    @JsonProperty("assigned_officer_id")
    private Long assignedOfficerId;

    @Column(name = "sla_deadline")
    @JsonProperty("sla_deadline")
    private String slaDeadline;

    @Column(name = "is_escalated")
    @JsonProperty("is_escalated")
    private Integer isEscalated = 0;

    @Column(name = "escalation_level")
    @JsonProperty("escalation_level")
    private Integer escalationLevel = 0;

    @Column(name = "incident_id")
    @JsonProperty("incident_id")
    private Long incidentId;

    @Column(name = "is_duplicate")
    @JsonProperty("is_duplicate")
    private Integer isDuplicate = 0;

    @Column(name = "duplicate_of_id")
    @JsonProperty("duplicate_of_id")
    private Long duplicateOfId;

    @Column(name = "duplicate_confidence")
    @JsonProperty("duplicate_confidence")
    private Double duplicateConfidence = 0.0;

    @Column(name = "reopen_count")
    @JsonProperty("reopen_count")
    private Integer reopenCount = 0;

    @Column(name = "reopen_reason")
    @JsonProperty("reopen_reason")
    private String reopenReason;

    @Column(name = "resolution_notes")
    @JsonProperty("resolution_notes")
    private String resolutionNotes;

    @Column(name = "resolved_at")
    @JsonProperty("resolved_at")
    private String resolvedAt;

    @Column(name = "verified_at")
    @JsonProperty("verified_at")
    private String verifiedAt;

    @Column(name = "image_url")
    @JsonProperty("image_url")
    private String imageUrl;

    @Column(name = "updated_at")
    @JsonProperty("updated_at")
    private String updatedAt;

    public Grievance() {}

    @PrePersist
    protected void onGrievancePersist() {
        super.onCreateTimestamp();
        if (this.updatedAt == null) {
            this.updatedAt = nowUtcString();
        }
    }

    @PreUpdate
    protected void onGrievanceUpdate() {
        this.updatedAt = nowUtcString();
    }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public Long getCitizenId() { return citizenId; }
    public void setCitizenId(Long citizenId) { this.citizenId = citizenId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSubcategory() { return subcategory; }
    public void setSubcategory(String subcategory) { this.subcategory = subcategory; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocationText() { return locationText; }
    public void setLocationText(String locationText) { this.locationText = locationText; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(Double aiConfidence) { this.aiConfidence = aiConfidence; }

    public Long getAssignedOfficerId() { return assignedOfficerId; }
    public void setAssignedOfficerId(Long assignedOfficerId) { this.assignedOfficerId = assignedOfficerId; }

    public String getSlaDeadline() { return slaDeadline; }
    public void setSlaDeadline(String slaDeadline) { this.slaDeadline = slaDeadline; }

    public Integer getIsEscalated() { return isEscalated; }
    public void setIsEscalated(Integer isEscalated) { this.isEscalated = isEscalated; }

    public Integer getEscalationLevel() { return escalationLevel; }
    public void setEscalationLevel(Integer escalationLevel) { this.escalationLevel = escalationLevel; }

    public Long getIncidentId() { return incidentId; }
    public void setIncidentId(Long incidentId) { this.incidentId = incidentId; }

    public Integer getIsDuplicate() { return isDuplicate; }
    public void setIsDuplicate(Integer isDuplicate) { this.isDuplicate = isDuplicate; }

    public Long getDuplicateOfId() { return duplicateOfId; }
    public void setDuplicateOfId(Long duplicateOfId) { this.duplicateOfId = duplicateOfId; }

    public Double getDuplicateConfidence() { return duplicateConfidence; }
    public void setDuplicateConfidence(Double duplicateConfidence) { this.duplicateConfidence = duplicateConfidence; }

    public Integer getReopenCount() { return reopenCount; }
    public void setReopenCount(Integer reopenCount) { this.reopenCount = reopenCount; }

    public String getReopenReason() { return reopenReason; }
    public void setReopenReason(String reopenReason) { this.reopenReason = reopenReason; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public String getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(String resolvedAt) { this.resolvedAt = resolvedAt; }

    public String getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(String verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
