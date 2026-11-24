package com.janseva.service;

import com.janseva.dto.AiDtos.ParseComplaintRequest;
import com.janseva.dto.AiDtos.ParseComplaintResponse;
import com.janseva.exception.BadRequestException;
import com.janseva.integration.TranslationService;
import com.janseva.ml.MLDtos.ChatResponseRequest;
import com.janseva.ml.MLDtos.GrievancePredictRequest;
import com.janseva.ml.MLDtos.GrievancePredictResponse;
import com.janseva.ml.MLDtos.IntentPredictRequest;
import com.janseva.ml.MLDtos.IntentPredictResponse;
import com.janseva.ml.MLService;
import com.janseva.util.DomainConstants;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

/**
 * Structured conversational grievance analysis workflow:
 * 1. Understand the complaint and user intent.
 * 2. Identify the correct department, category, and subcategory.
 * 3. Extract locality, landmark, and entrance.
 * 4. Maintain conversation context across multiple turns without asking for already provided details.
 * 5. Present a clear structured complaint summary.
 * 6. Obtain user confirmation before final ticket submission.
 */
@Service
public class ConversationAiService {

    private static final List<String> NON_GRIEVANCE_INTENTS = List.of(
            "GREETING", "CAPABILITIES", "THANKS", "UNKNOWN"
    );

    private static final Set<String> CONFIRMATION_PHRASES = Set.of(
            "yes", "yeah", "yep", "confirm", "confirmed", "submit", "proceed",
            "correct", "ha", "haan", "theek hai", "sahi hai", "go ahead",
            "yes please", "looks good", "ok submit", "submit it", "kardo", "kar do",
            "sure", "done", "perfect"
    );

    private static final Set<String> DENIAL_PHRASES = Set.of(
            "no", "nope", "nahi", "wrong", "galat", "change", "cancel",
            "incorrect", "update", "modify"
    );

    private final MLService mlService;
    private final TranslationService translationService;

    public ConversationAiService(MLService mlService, TranslationService translationService) {
        this.mlService = mlService;
        this.translationService = translationService;
    }

    @SuppressWarnings("unchecked")
    public ParseComplaintResponse parseComplaint(ParseComplaintRequest req) {
        if (req == null || req.text() == null || req.text().trim().isEmpty()) {
            throw new BadRequestException("Text description is required.");
        }

        Map<String, Object> state = req.conversationState() != null
                ? new LinkedHashMap<>(req.conversationState())
                : new LinkedHashMap<>();

        // If explicit GPS or UI location passed, remember it in pending state
        if (req.locationText() != null && !req.locationText().isBlank()) {
            Object pendingObj = state.get("pendingGrievance");
            Map<String, Object> pending = pendingObj instanceof Map<?, ?> m
                    ? new LinkedHashMap<>((Map<String, Object>) m)
                    : new LinkedHashMap<>();
            pending.put("location_text", req.locationText());
            state.put("pendingGrievance", pending);
        }

        String rawInput = req.text().trim();
        String processedText = translationService.translateToEnglishIfNeeded(rawInput).trim();
        String lowerInput = rawInput.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s]", " ").trim();

        // Check if there is an active pending grievance
        Map<String, Object> existingPending = null;
        if (state.get("pendingGrievance") instanceof Map<?, ?> pendingMap) {
            existingPending = new LinkedHashMap<>((Map<String, Object>) pendingMap);
        }

        boolean isAwaitingConfirmation = Boolean.TRUE.equals(state.get("readyForSubmission"))
                || "confirmation".equals(state.get("awaitingField"));

        // STEP 7 & 8: Check for user confirmation
        if (existingPending != null && (isAwaitingConfirmation || isUserConfirming(lowerInput))) {
            if (isUserConfirming(lowerInput)) {
                Map<String, Object> newState = new LinkedHashMap<>(state);
                newState.put("readyForSubmission", true);
                newState.put("status", "CONFIRMED");
                newState.put("awaitingField", null);

                String confirmMsg = "Thank you for confirming! Your grievance details have been verified and are ready for registration.\n\n"
                        + "Please click the **Submit Grievance** button below to lodge your ticket.";

                return new ParseComplaintResponse(
                        true,
                        true,
                        "CONFIRMATION",
                        confirmMsg,
                        existingPending,
                        newState
                );
            }

            if (isUserDenying(lowerInput)) {
                Map<String, Object> newState = new LinkedHashMap<>(state);
                newState.put("readyForSubmission", false);
                newState.put("awaitingField", "correction");

                String denyMsg = "Understood. What details would you like to change? You can specify a different location, a new description, or update your problem.";
                return new ParseComplaintResponse(
                        true,
                        true,
                        "CORRECTION",
                        denyMsg,
                        existingPending,
                        newState
                );
            }
        }

        // STEP 4: If bot was explicitly waiting for location_text
        if ("location_text".equals(state.get("awaitingField")) && existingPending != null) {
            Map<String, Object> updatedGrievance = new LinkedHashMap<>(existingPending);
            updatedGrievance.put("location_text", processedText);
            updatedGrievance.put("missing_information", List.of());
            updatedGrievance.put("needs_clarification", false);

            String aiMsg = String.format(
                    "Got it: **%s**.\n\nHere is the summary of your grievance:\n\n"
                            + "- **Department**: %s\n"
                            + "- **Category**: %s\n"
                            + "- **Issue**: %s\n"
                            + "- **Location**: %s\n"
                            + "- **Priority**: %s\n"
                            + "- **Description**: %s\n\n"
                            + "Would you like me to submit this grievance now? Please confirm (Yes/No).",
                    processedText,
                    updatedGrievance.get("department"),
                    updatedGrievance.get("category"),
                    updatedGrievance.get("subcategory"),
                    processedText,
                    updatedGrievance.get("priority"),
                    updatedGrievance.get("description")
            );

            Map<String, Object> newState = new LinkedHashMap<>(state);
            newState.put("awaitingField", "confirmation");
            newState.put("pendingGrievance", updatedGrievance);
            newState.put("readyForSubmission", true);

            return new ParseComplaintResponse(true, true, "LOCATION_PROVIDED", aiMsg, updatedGrievance, newState);
        }

        // Check Intent Detection
        IntentPredictResponse intentResult = mlService.predictIntent(new IntentPredictRequest(processedText));
        String intent = intentResult.intent();

        if ("CONFIRMATION".equals(intent) && existingPending != null) {
            Map<String, Object> newState = new LinkedHashMap<>(state);
            newState.put("readyForSubmission", true);
            newState.put("status", "CONFIRMED");
            newState.put("awaitingField", null);

            String confirmMsg = "Thank you for confirming! Your grievance details have been verified and are ready for registration.\n\n"
                    + "Please click the **Submit Grievance** button below to lodge your ticket.";

            return new ParseComplaintResponse(
                    true,
                    true,
                    "CONFIRMATION",
                    confirmMsg,
                    existingPending,
                    newState
            );
        }

        // If intent is purely conversational (greeting, thanks, etc.) and user has NOT started a grievance yet
        if (NON_GRIEVANCE_INTENTS.contains(intent) && existingPending == null) {
            String responseMessage = mlService.generateChatResponse(
                    new ChatResponseRequest(intent, null, null)).aiMessage();
            Map<String, Object> newState = new LinkedHashMap<>(state);
            newState.put("lastIntent", intent);
            return new ParseComplaintResponse(true, false, intent, responseMessage, null, newState);
        }

        // STEP 4 & 5: Context Awareness & Multi-Turn Memory
        String accumulatedText = (String) state.get("accumulatedText");
        String combinedAnalysisText;
        if (accumulatedText != null && !accumulatedText.isBlank()) {
            combinedAnalysisText = accumulatedText + ". " + processedText;
        } else {
            combinedAnalysisText = processedText;
        }

        String existingLoc = null;
        if (existingPending != null && existingPending.get("location_text") != null) {
            existingLoc = String.valueOf(existingPending.get("location_text")).trim();
            if (existingLoc.isBlank()) {
                existingLoc = null;
            }
        }

        // Call ML Service with combined context & existing location
        GrievancePredictResponse pred = mlService.predictGrievance(
                new GrievancePredictRequest(combinedAnalysisText, existingLoc));

        String validCat = DomainConstants.VALID_CATEGORIES.contains(pred.category())
                ? pred.category() : "Roads / PWD";
        String validDept = DomainConstants.CATEGORY_TO_DEPARTMENT.getOrDefault(
                validCat, pred.department() != null ? pred.department() : "Municipal Administration");
        String validPriority = DomainConstants.VALID_PRIORITIES.contains(pred.priority())
                ? pred.priority() : "MEDIUM";

        String finalLocation = pred.locationText();
        if ((finalLocation == null || finalLocation.isBlank()) && existingLoc != null) {
            finalLocation = existingLoc;
        }

        List<String> missingInfo = new ArrayList<>();
        boolean missingLoc = (finalLocation == null || finalLocation.isBlank());
        if (missingLoc) {
            missingInfo.add("location_text");
        }

        Map<String, Object> extractedData = new LinkedHashMap<>();
        extractedData.put("category", validCat);
        extractedData.put("subcategory", pred.subcategory());
        extractedData.put("department", validDept);
        extractedData.put("priority", validPriority);
        extractedData.put("description", combinedAnalysisText);
        extractedData.put("location_text", finalLocation);
        extractedData.put("language", pred.language());
        extractedData.put("confidence", pred.confidence());
        extractedData.put("missing_information", missingInfo);
        extractedData.put("needs_clarification", missingLoc);
        extractedData.put("explainable_features", pred.explainableFeatures());
        extractedData.put("safety_override", pred.safetyOverride());

        Map<String, Object> newState = new LinkedHashMap<>(state);
        newState.put("accumulatedText", combinedAnalysisText);
        newState.put("pendingGrievance", extractedData);

        String awaitingField;
        boolean readyForSubmission;
        String responseMsg;

        if (missingLoc) {
            awaitingField = "location_text";
            readyForSubmission = false;
            responseMsg = String.format(
                    "I understand you are reporting an issue regarding **%s** (%s).\n\n"
                            + "Where is this problem occurring? Please enter your locality, landmark, or street name.",
                    validCat,
                    pred.subcategory()
            );
        } else {
            awaitingField = "confirmation";
            readyForSubmission = true;
            responseMsg = String.format(
                    "Here is the summary of your grievance:\n\n"
                            + "- **Department**: %s\n"
                            + "- **Category**: %s\n"
                            + "- **Issue**: %s\n"
                            + "- **Location**: %s\n"
                            + "- **Priority**: %s\n"
                            + "- **Description**: %s\n\n"
                            + "Would you like me to submit this grievance now? Please confirm (Yes/No).",
                    validDept,
                    validCat,
                    pred.subcategory(),
                    finalLocation,
                    validPriority,
                    combinedAnalysisText
            );
        }

        newState.put("awaitingField", awaitingField);
        newState.put("readyForSubmission", readyForSubmission);

        return new ParseComplaintResponse(true, true, "GRIEVANCE", responseMsg, extractedData, newState);
    }

    private boolean isUserConfirming(String text) {
        if (text == null) return false;
        String trimmed = text.trim();
        if (CONFIRMATION_PHRASES.contains(trimmed)) {
            return true;
        }
        for (String phrase : CONFIRMATION_PHRASES) {
            if (trimmed.startsWith(phrase + " ") || trimmed.endsWith(" " + phrase) || trimmed.contains(" " + phrase + " ")) {
                return true;
            }
        }
        return false;
    }

    private boolean isUserDenying(String text) {
        if (text == null) return false;
        String trimmed = text.trim();
        if (DENIAL_PHRASES.contains(trimmed)) {
            return true;
        }
        for (String phrase : DENIAL_PHRASES) {
            if (trimmed.startsWith(phrase + " ") || trimmed.endsWith(" " + phrase)) {
                return true;
            }
        }
        return false;
    }
}
