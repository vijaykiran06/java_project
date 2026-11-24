package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Abstract mapped superclass for entities tracking creation timestamps in UTC SQLite format.
 */
@MappedSuperclass
public abstract class TimestampedEntity extends BaseEntity {

    private static final DateTimeFormatter SQLITE_UTC_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneOffset.UTC);

    @Column(name = "created_at")
    @JsonProperty("created_at")
    private String createdAt;

    @PrePersist
    protected void onCreateTimestamp() {
        if (this.createdAt == null) {
            this.createdAt = nowUtcString();
        }
    }

    protected static String nowUtcString() {
        return SQLITE_UTC_FORMAT.format(Instant.now());
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
