package com.janseva.ml;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public final class MLDtos {

    private MLDtos() {}

    public record GrievancePredictRequest(
            String text,
            @JsonProperty("existing_location") String existingLocation
    ) {}

    public record GrievancePredictResponse(
            String department,
            String category,
            String subcategory,
            String priority,
            String description,
            @JsonProperty("location_text") String locationText,
            String language,
            double confidence,
            @JsonProperty("subcategory_probabilities") Map<String, Double> subcategoryProbabilities,
            @JsonProperty("missing_information") List<String> missingInformation,
            @JsonProperty("needs_clarification") boolean needsClarification,
            @JsonProperty("explainable_features") List<String> explainableFeatures,
            @JsonProperty("safety_override") String safetyOverride
    ) {}

    public record IntentPredictRequest(String text) {}

    public record IntentPredictResponse(
            String intent,
            double confidence,
            @JsonProperty("needs_clarification") boolean needsClarification
    ) {}

    public record GrievanceCandidate(
            Long id,
            @JsonProperty("tracking_number") String trackingNumber,
            String category,
            String description,
            @JsonProperty("location_text") String locationText,
            Double latitude,
            Double longitude
    ) {}

    public record DuplicateCheckRequest(
            GrievanceCandidate target,
            List<GrievanceCandidate> candidates
    ) {}

    public record DuplicateMatch(
            @JsonProperty("duplicate_grievance_id") Long duplicateGrievanceId,
            @JsonProperty("tracking_number") String trackingNumber,
            String category,
            @JsonProperty("location_text") String locationText,
            String description,
            @JsonProperty("similarity_score") double similarityScore,
            @JsonProperty("geo_distance_km") Double geoDistanceKm,
            double confidence,
            String recommendation
    ) {}

    public record DuplicateCheckResponse(
            boolean success,
            int count,
            List<DuplicateMatch> duplicates
    ) {}

    public record ChatResponseRequest(
            String intent,
            @JsonProperty("extracted_data") Map<String, Object> extractedData,
            @JsonProperty("awaiting_field") String awaitingField
    ) {}

    public record ChatResponseResult(
            @JsonProperty("ai_message") String aiMessage
    ) {}

    public record MLHealthResponse(
            String status,
            @JsonProperty("models_loaded") boolean modelsLoaded,
            @JsonProperty("models_dir") String modelsDir,
            @JsonProperty("grievance_model") Map<String, Object> grievanceModel,
            @JsonProperty("intent_model") Map<String, Object> intentModel,
            @JsonProperty("subcategory_models_count") int subcategoryModelsCount,
            List<String> errors
    ) {}
}
