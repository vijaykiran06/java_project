package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "ai_analysis")
public class AiAnalysis extends TimestampedEntity {

    @Column(name = "grievance_id")
    @JsonProperty("grievance_id")
    private Long grievanceId;

    @Column(name = "extracted_json", nullable = false)
    @JsonProperty("extracted_json")
    private String extractedJson;

    @Column(name = "raw_prompt")
    @JsonProperty("raw_prompt")
    private String rawPrompt;

    private Double confidence = 0.9;

    @Column(name = "missing_info")
    @JsonProperty("missing_info")
    private String missingInfo;

    public AiAnalysis() {}

    public Long getGrievanceId() { return grievanceId; }
    public void setGrievanceId(Long grievanceId) { this.grievanceId = grievanceId; }

    public String getExtractedJson() { return extractedJson; }
    public void setExtractedJson(String extractedJson) { this.extractedJson = extractedJson; }

    public String getRawPrompt() { return rawPrompt; }
    public void setRawPrompt(String rawPrompt) { this.rawPrompt = rawPrompt; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getMissingInfo() { return missingInfo; }
    public void setMissingInfo(String missingInfo) { this.missingInfo = missingInfo; }
}
