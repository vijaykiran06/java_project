package com.janseva.ml;

import com.janseva.ml.MLDtos.ChatResponseRequest;
import com.janseva.ml.MLDtos.ChatResponseResult;
import com.janseva.ml.MLDtos.DuplicateCheckRequest;
import com.janseva.ml.MLDtos.DuplicateCheckResponse;
import com.janseva.ml.MLDtos.GrievancePredictRequest;
import com.janseva.ml.MLDtos.GrievancePredictResponse;
import com.janseva.ml.MLDtos.IntentPredictRequest;
import com.janseva.ml.MLDtos.IntentPredictResponse;
import com.janseva.ml.MLDtos.MLHealthResponse;

/**
 * Abstraction layer for communicating with the local ML inference microservice.
 */
public interface MLService {

    MLHealthResponse checkHealth();

    GrievancePredictResponse predictGrievance(GrievancePredictRequest request);

    IntentPredictResponse predictIntent(IntentPredictRequest request);

    DuplicateCheckResponse checkDuplicates(DuplicateCheckRequest request);

    ChatResponseResult generateChatResponse(ChatResponseRequest request);
}
