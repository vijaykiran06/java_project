package com.janseva.ml;

import com.janseva.exception.MLServiceException;
import com.janseva.ml.MLDtos.ChatResponseRequest;
import com.janseva.ml.MLDtos.ChatResponseResult;
import com.janseva.ml.MLDtos.DuplicateCheckRequest;
import com.janseva.ml.MLDtos.DuplicateCheckResponse;
import com.janseva.ml.MLDtos.GrievancePredictRequest;
import com.janseva.ml.MLDtos.GrievancePredictResponse;
import com.janseva.ml.MLDtos.IntentPredictRequest;
import com.janseva.ml.MLDtos.IntentPredictResponse;
import com.janseva.ml.MLDtos.MLHealthResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * HTTP RestClient implementation communicating with the Python FastAPI ML microservice.
 * Never fabricates fake ML predictions on failure.
 */
@Service
public class PythonMLService implements MLService {

    private static final Logger log = LoggerFactory.getLogger(PythonMLService.class);
    private final RestClient mlRestClient;

    public PythonMLService(RestClient mlRestClient) {
        this.mlRestClient = mlRestClient;
    }

    @Override
    public MLHealthResponse checkHealth() {
        try {
            MLHealthResponse res = mlRestClient.get()
                    .uri("/ml/health")
                    .retrieve()
                    .body(MLHealthResponse.class);
            if (res == null) {
                throw new MLServiceException("Empty response from Python ML health endpoint.");
            }
            return res;
        } catch (RestClientException ex) {
            throw new MLServiceException("Python ML service health check failed: " + ex.getMessage(), ex);
        }
    }

    @Override
    public GrievancePredictResponse predictGrievance(GrievancePredictRequest request) {
        log.debug("Calling Python ML /ml/grievance/predict");
        try {
            GrievancePredictResponse res = mlRestClient.post()
                    .uri("/ml/grievance/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(GrievancePredictResponse.class);
            if (res == null) {
                throw new MLServiceException("Empty response from /ml/grievance/predict.");
            }
            return res;
        } catch (RestClientException ex) {
            throw new MLServiceException("Grievance prediction failed via Python ML service: " + ex.getMessage(), ex);
        }
    }

    @Override
    public IntentPredictResponse predictIntent(IntentPredictRequest request) {
        log.debug("Calling Python ML /ml/intent/predict");
        try {
            IntentPredictResponse res = mlRestClient.post()
                    .uri("/ml/intent/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(IntentPredictResponse.class);
            if (res == null) {
                throw new MLServiceException("Empty response from /ml/intent/predict.");
            }
            return res;
        } catch (RestClientException ex) {
            throw new MLServiceException("Intent prediction failed via Python ML service: " + ex.getMessage(), ex);
        }
    }

    @Override
    public DuplicateCheckResponse checkDuplicates(DuplicateCheckRequest request) {
        log.debug("Calling Python ML /ml/duplicate/check for {} candidates",
                request.candidates() != null ? request.candidates().size() : 0);
        try {
            DuplicateCheckResponse res = mlRestClient.post()
                    .uri("/ml/duplicate/check")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(DuplicateCheckResponse.class);
            if (res == null) {
                throw new MLServiceException("Empty response from /ml/duplicate/check.");
            }
            return res;
        } catch (RestClientException ex) {
            throw new MLServiceException("Duplicate check failed via Python ML service: " + ex.getMessage(), ex);
        }
    }

    @Override
    public ChatResponseResult generateChatResponse(ChatResponseRequest request) {
        log.debug("Calling Python ML /ml/chat/response for intent={}", request.intent());
        try {
            ChatResponseResult res = mlRestClient.post()
                    .uri("/ml/chat/response")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(ChatResponseResult.class);
            if (res == null) {
                throw new MLServiceException("Empty response from /ml/chat/response.");
            }
            return res;
        } catch (RestClientException ex) {
            throw new MLServiceException("Chat response generation failed via Python ML service: " + ex.getMessage(), ex);
        }
    }
}
