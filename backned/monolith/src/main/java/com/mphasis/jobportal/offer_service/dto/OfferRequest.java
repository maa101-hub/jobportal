package com.mphasis.jobportal.offer_service.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class OfferRequest {

    @NotNull(message = "Application ID is required")
    private Long applicationId;
    private LocalDate joiningDate;

    public Long getApplicationId() { return applicationId; }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }

    public LocalDate getJoiningDate() { return joiningDate; }
    public void setJoiningDate(LocalDate joiningDate) { this.joiningDate = joiningDate; }
}