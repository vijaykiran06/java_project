package com.janseva;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.janseva.exception.MLServiceException;
import com.janseva.ml.MLDtos.GrievancePredictRequest;
import com.janseva.ml.MLDtos.GrievancePredictResponse;
import com.janseva.ml.MLDtos.IntentPredictRequest;
import com.janseva.ml.MLDtos.IntentPredictResponse;
import com.janseva.ml.MLDtos.MLHealthResponse;
import com.janseva.ml.PythonMLService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class PythonMLServiceTest {

    private MockRestServiceServer server;
    private PythonMLService pythonMLService;

    @BeforeEach
    void setup() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://127.0.0.1:8001");
        this.server = MockRestServiceServer.bindTo(builder).build();
        this.pythonMLService = new PythonMLService(builder.build());
    }

    @Test
    void healthCheckDeserializesCorrectly() {
        server.expect(requestTo("http://127.0.0.1:8001/ml/health"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {
                          "status": "HEALTHY",
                          "models_loaded": true,
                          "models_dir": "../backend/ml/models",
                          "grievance_model": {"model_name": "JanSeva Hierarchical Grievance Classifier"},
                          "intent_model": {"model_name": "JanSeva Local Intent Detector"},
                          "subcategory_models_count": 9,
                          "errors": []
                        }
                        """, MediaType.APPLICATION_JSON));

        MLHealthResponse health = pythonMLService.checkHealth();
        assertTrue(health.modelsLoaded());
        assertEquals(9, health.subcategoryModelsCount());
        server.verify();
    }

    @Test
    void intentPredictionDeserializesCorrectly() {
        server.expect(requestTo("http://127.0.0.1:8001/ml/intent/predict"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("""
                        {"intent": "GRIEVANCE", "confidence": 0.97, "needs_clarification": false}
                        """, MediaType.APPLICATION_JSON));

        IntentPredictResponse intent = pythonMLService.predictIntent(new IntentPredictRequest("no water"));
        assertEquals("GRIEVANCE", intent.intent());
        server.verify();
    }

    @Test
    void grievancePredictionDeserializesCorrectly() {
        server.expect(requestTo("http://127.0.0.1:8001/ml/grievance/predict"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("""
                        {
                          "department": "Water Department",
                          "category": "Water Supply",
                          "subcategory": "No Water Supply",
                          "priority": "HIGH",
                          "description": "No water in Model Town",
                          "location_text": "Model Town",
                          "language": "en",
                          "confidence": 0.95,
                          "subcategory_probabilities": {"No Water Supply": 0.95},
                          "missing_information": [],
                          "needs_clarification": false,
                          "explainable_features": ["water"],
                          "safety_override": null
                        }
                        """, MediaType.APPLICATION_JSON));

        GrievancePredictResponse pred = pythonMLService.predictGrievance(
                new GrievancePredictRequest("No water in Model Town", null));
        assertEquals("Water Supply", pred.category());
        assertEquals("Water Department", pred.department());
        server.verify();
    }

    @Test
    void mlHttpErrorThrowsMLServiceExceptionWithoutFakeFallback() {
        server.expect(requestTo("http://127.0.0.1:8001/ml/grievance/predict"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        assertThrows(MLServiceException.class, () ->
                pythonMLService.predictGrievance(new GrievancePredictRequest("No water", null)));
        server.verify();
    }
}
