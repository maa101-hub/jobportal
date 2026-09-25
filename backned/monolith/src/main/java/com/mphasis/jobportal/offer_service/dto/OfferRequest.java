package com.mphasis.jobportal.offer_service.dto;

import java.time.LocalDate;

public class OfferRequest {

    private Long applicationId;
    private LocalDate joiningDate;

    public Long getApplicationId() { return applicationId; }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }

    public LocalDate getJoiningDate() { return joiningDate; }
    public void setJoiningDate(LocalDate joiningDate) { this.joiningDate = joiningDate; }
}