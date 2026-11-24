package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "incident_grievances")
public class IncidentGrievance extends TimestampedEntity {

    @Column(name = "incident_id", nullable = false)
    @JsonProperty("incident_id")
    private Long incidentId;

    @Column(name = "grievance_id", nullable = false)
    @JsonProperty("grievance_id")
    private Long grievanceId;

    public IncidentGrievance() {}

    public IncidentGrievance(Long incidentId, Long grievanceId) {
        this.incidentId = incidentId;
        this.grievanceId = grievanceId;
    }

    public Long getIncidentId() { return incidentId; }
    public void setIncidentId(Long incidentId) { this.incidentId = incidentId; }

    public Long getGrievanceId() { return grievanceId; }
    public void setGrievanceId(Long grievanceId) { this.grievanceId = grievanceId; }
}
