package com.mphasis.jobportal.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@SuppressWarnings("null")
public class ResendEmailService {
    private static final Logger log = LoggerFactory.getLogger(ResendEmailService.class);
    private final RestClient client;

    @Value("${RESEND_API_KEY:}")
    private String apiKey;

    @Value("${MAIL_FROM:HireTrack <onboarding@resend.dev>}")
    private String from;

    public ResendEmailService(RestClient.Builder builder) {
        this.client = builder.baseUrl("https://api.resend.com").build();
    }

    public void send(String to, String subject, String message) {
        if (to == null || to.isBlank() || apiKey == null || apiKey.isBlank()) {
            return;
        }

        String html = "<div style=\"font-family:Arial,sans-serif;line-height:1.6\">"
                + "<h2>" + escape(subject) + "</h2>"
                + "<p>" + escape(message) + "</p>"
                + "<p style=\"color:#667085;font-size:12px\">HireTrack notification</p>"
                + "</div>";

        try {
            client.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", from,
                            "to", new String[]{to},
                            "subject", subject,
                            "html", html
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            // Email delivery must not break an application-status update.
            log.warn("Resend email delivery failed for {}: {}", to, ex.getMessage());
        }
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;")
                .replace("\n", "<br>");
    }
}
