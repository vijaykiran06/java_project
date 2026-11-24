package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "sla_rules")
public class SlaRule extends BaseEntity {

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String priority;

    @Column(name = "sla_hours", nullable = false)
    @JsonProperty("sla_hours")
    private Integer slaHours;

    @Column(name = "escalation_threshold_hours")
    @JsonProperty("escalation_threshold_hours")
    private Integer escalationThresholdHours = 4;

    public SlaRule() {}

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public Integer getSlaHours() {
        return slaHours;
    }

    public void setSlaHours(Integer slaHours) {
        this.slaHours = slaHours;
    }

    public Integer getEscalationThresholdHours() {
        return escalationThresholdHours;
    }

    public void setEscalationThresholdHours(Integer escalationThresholdHours) {
        this.escalationThresholdHours = escalationThresholdHours;
    }
}
