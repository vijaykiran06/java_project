package com.janseva.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Translates non-ASCII (e.g. Hindi/Devanagari) complaint text to English before ML inference,
 * matching the legacy Express /api/ai/parse-complaint integration.
 */
@Service
public class GoogleTranslationService implements TranslationService {

    private static final Logger log = LoggerFactory.getLogger(GoogleTranslationService.class);

    private final RestClient translationRestClient;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final String baseUrl;

    public GoogleTranslationService(
            RestClient translationRestClient,
            ObjectMapper objectMapper,
            @Value("${janseva.translation.enabled:true}") boolean enabled,
            @Value("${janseva.translation.base-url:https://translate.googleapis.com}") String baseUrl) {
        this.translationRestClient = translationRestClient;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.baseUrl = baseUrl;
    }

    @Override
    public String translateToEnglishIfNeeded(String text) {
        if (!enabled || text == null || !containsNonAscii(text)) {
            return text;
        }
        try {
            String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8);
            String url = baseUrl + "/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" + encoded;
            String raw = translationRestClient.get().uri(url).retrieve().body(String.class);
            if (raw != null && !raw.isBlank()) {
                JsonNode root = objectMapper.readTree(raw);
                if (root.isArray() && !root.isEmpty()
                        && root.get(0).isArray() && !root.get(0).isEmpty()
                        && root.get(0).get(0).isArray() && !root.get(0).get(0).isEmpty()) {
                    String translated = root.get(0).get(0).get(0).asText();
                    if (translated != null && !translated.isBlank()) {
                        log.info("Translated input text to English for ML inference");
                        return translated;
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Translation failed, falling back to original text: {}", ex.getMessage());
        }
        return text;
    }

    private boolean containsNonAscii(String text) {
        for (int i = 0; i < text.length(); i++) {
            if (text.charAt(i) > 127) {
                return true;
            }
        }
        return false;
    }
}
