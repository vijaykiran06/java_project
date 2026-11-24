package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "audit_logs")
public class AuditLog extends TimestampedEntity {

    @Column(name = "user_id")
    @JsonProperty("user_id")
    private Long userId;

    @Column(nullable = false)
    private String action;

    @Column(name = "entity_name", nullable = false)
    @JsonProperty("entity_name")
    private String entityName;

    @Column(name = "entity_id")
    @JsonProperty("entity_id")
    private String entityId;

    private String details;

    public AuditLog() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getEntityName() { return entityName; }
    public void setEntityName(String entityName) { this.entityName = entityName; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
