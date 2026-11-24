package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "escalations")
public class Escalation extends TimestampedEntity {

    @Column(name = "grievance_id", nullable = false)
    @JsonProperty("grievance_id")
    private Long grievanceId;

    @Column(name = "escalated_from_officer_id")
    @JsonProperty("escalated_from_officer_id")
    private Long escalatedFromOfficerId;

    @Column(name = "escalated_to_officer_id")
    @JsonProperty("escalated_to_officer_id")
    private Long escalatedToOfficerId;

    @Column(nullable = false)
    private String reason;

    private Integer level = 1;

    private String status = "PENDING";

    public Escalation() {}

    public Long getGrievanceId() { return grievanceId; }
    public void setGrievanceId(Long grievanceId) { this.grievanceId = grievanceId; }

    public Long getEscalatedFromOfficerId() { return escalatedFromOfficerId; }
    public void setEscalatedFromOfficerId(Long escalatedFromOfficerId) { this.escalatedFromOfficerId = escalatedFromOfficerId; }

    public Long getEscalatedToOfficerId() { return escalatedToOfficerId; }
    public void setEscalatedToOfficerId(Long escalatedToOfficerId) { this.escalatedToOfficerId = escalatedToOfficerId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
