package com.mphasis.jobportal.offer_service.dto;

import java.time.LocalDate;

public class OfferResponse {

    private Long id;
    private String status;
    private LocalDate joiningDate;

    public OfferResponse(Long id, String status, LocalDate joiningDate) {
        this.id = id;
        this.status = status;
        this.joiningDate = joiningDate;
    }

    public Long getId() { return id; }
    public String getStatus() { return status; }
    public LocalDate getJoiningDate() { return joiningDate; }
}