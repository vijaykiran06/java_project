package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "incidents")
public class Incident extends TimestampedEntity {

    @Column(name = "incident_number", nullable = false, unique = true)
    @JsonProperty("incident_number")
    private String incidentNumber;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String priority = "HIGH";

    private String status = "OPEN";

    @Column(name = "primary_location")
    @JsonProperty("primary_location")
    private String primaryLocation;

    @Column(name = "affected_citizens_count")
    @JsonProperty("affected_citizens_count")
    private Integer affectedCitizensCount = 1;

    @Column(name = "assigned_officer_id")
    @JsonProperty("assigned_officer_id")
    private Long assignedOfficerId;

    public Incident() {}

    public String getIncidentNumber() {
        return incidentNumber;
    }

    public void setIncidentNumber(String incidentNumber) {
        this.incidentNumber = incidentNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPrimaryLocation() {
        return primaryLocation;
    }

    public void setPrimaryLocation(String primaryLocation) {
        this.primaryLocation = primaryLocation;
    }

    public Integer getAffectedCitizensCount() {
        return affectedCitizensCount;
    }

    public void setAffectedCitizensCount(Integer affectedCitizensCount) {
        this.affectedCitizensCount = affectedCitizensCount;
    }

    public Long getAssignedOfficerId() {
        return assignedOfficerId;
    }

    public void setAssignedOfficerId(Long assignedOfficerId) {
        this.assignedOfficerId = assignedOfficerId;
    }
}
