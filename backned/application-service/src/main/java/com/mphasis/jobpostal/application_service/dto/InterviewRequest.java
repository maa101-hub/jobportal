package com.mphasis.jobpostal.application_service.dto;

import java.time.LocalDateTime;

public class InterviewRequest {

    private Long applicationId;
    private String round;
    private LocalDateTime scheduledAt;

    public Long getApplicationId() { return applicationId; }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }

    public String getRound() { return round; }
    public void setRound(String round) { this.round = round; }

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
}