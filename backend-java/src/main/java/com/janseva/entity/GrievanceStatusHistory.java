package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "grievance_status_history")
public class GrievanceStatusHistory extends TimestampedEntity {

    @Column(name = "grievance_id", nullable = false)
    @JsonProperty("grievance_id")
    private Long grievanceId;

    @Column(name = "previous_status")
    @JsonProperty("previous_status")
    private String previousStatus;

    @Column(name = "new_status", nullable = false)
    @JsonProperty("new_status")
    private String newStatus;

    @Column(name = "changed_by_user_id")
    @JsonProperty("changed_by_user_id")
    private Long changedByUserId;

    private String notes;

    public GrievanceStatusHistory() {}

    public Long getGrievanceId() { return grievanceId; }
    public void setGrievanceId(Long grievanceId) { this.grievanceId = grievanceId; }

    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public Long getChangedByUserId() { return changedByUserId; }
    public void setChangedByUserId(Long changedByUserId) { this.changedByUserId = changedByUserId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
