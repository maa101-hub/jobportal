package com.mphasis.jobpostal.application_service.dto;

public class ApplicationResponse {

    private Long id;
    private String status;

    public ApplicationResponse(Long id, String status) {
        this.id = id;
        this.status = status;
    }

    public Long getId() { return id; }
    public String getStatus() { return status; }
}