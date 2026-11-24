package com.janseva.util;

import java.security.SecureRandom;
import java.time.Year;

public final class IdGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final char[] HEX = "0123456789ABCDEF".toCharArray();

    private IdGenerator() {}

    /**
     * Generates a unique, non-sequential grievance tracking ID formatted as GRV-YYYY-XXXXXX.
     */
    public static String generateGrievanceId() {
        int currentYear = Year.now().getValue();
        byte[] bytes = new byte[3];
        RANDOM.nextBytes(bytes);
        StringBuilder hex = new StringBuilder(6);
        for (byte b : bytes) {
            hex.append(HEX[(b >> 4) & 0x0F]);
            hex.append(HEX[b & 0x0F]);
        }
        return "GRV-" + currentYear + "-" + hex;
    }

    /**
     * Generates a clustered master incident identifier formatted as INCIDENT-XXXX.
     */
    public static String generateIncidentNumber() {
        int num = 1000 + RANDOM.nextInt(9000);
        return "INCIDENT-" + num;
    }
}
