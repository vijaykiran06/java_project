package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "grievance_categories")
public class GrievanceCategory extends BaseEntity {

    @Column(name = "department_id")
    @JsonProperty("department_id")
    private Long departmentId;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(name = "default_priority")
    @JsonProperty("default_priority")
    private String defaultPriority = "MEDIUM";

    @Column(name = "sla_hours")
    @JsonProperty("sla_hours")
    private Integer slaHours = 48;

    public GrievanceCategory() {}

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDefaultPriority() {
        return defaultPriority;
    }

    public void setDefaultPriority(String defaultPriority) {
        this.defaultPriority = defaultPriority;
    }

    public Integer getSlaHours() {
        return slaHours;
    }

    public void setSlaHours(Integer slaHours) {
        this.slaHours = slaHours;
    }
}
