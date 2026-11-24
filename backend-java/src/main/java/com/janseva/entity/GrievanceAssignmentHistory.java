package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "grievance_assignment_history")
public class GrievanceAssignmentHistory extends TimestampedEntity {

    @Column(name = "grievance_id", nullable = false)
    @JsonProperty("grievance_id")
    private Long grievanceId;

    @Column(name = "worker_id", nullable = false)
    @JsonProperty("worker_id")
    private Long workerId;

    @Column(name = "assigned_by")
    @JsonProperty("assigned_by")
    private Long assignedBy;

    @Column(name = "assigned_at")
    @JsonProperty("assigned_at")
    private String assignedAt;

    @Column(name = "previous_worker_id")
    @JsonProperty("previous_worker_id")
    private Long previousWorkerId;

    @Column(name = "assignment_notes")
    @JsonProperty("assignment_notes")
    private String assignmentNotes;

    @Column(name = "status")
    private String status = "ACTIVE"; // ACTIVE, REASSIGNED, COMPLETED

    public GrievanceAssignmentHistory() {}

    public Long getGrievanceId() { return grievanceId; }
    public void setGrievanceId(Long grievanceId) { this.grievanceId = grievanceId; }

    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }

    public Long getAssignedBy() { return assignedBy; }
    public void setAssignedBy(Long assignedBy) { this.assignedBy = assignedBy; }

    public String getAssignedAt() { return assignedAt; }
    public void setAssignedAt(String assignedAt) { this.assignedAt = assignedAt; }

    public Long getPreviousWorkerId() { return previousWorkerId; }
    public void setPreviousWorkerId(Long previousWorkerId) { this.previousWorkerId = previousWorkerId; }

    public String getAssignmentNotes() { return assignmentNotes; }
    public void setAssignmentNotes(String assignmentNotes) { this.assignmentNotes = assignmentNotes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
