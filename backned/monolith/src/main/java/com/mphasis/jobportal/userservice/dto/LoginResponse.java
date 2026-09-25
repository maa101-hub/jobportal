package com.mphasis.jobportal.userservice.dto;

public class LoginResponse {
    private boolean success;
    private String message;
    private Long userId;
    private String role;
    private Long companyId;
    private String email;

    public LoginResponse() {}

    public LoginResponse(boolean success, String message, Long userId, String role, Long companyId, String email) {
        this.success = success;
        this.message = message;
        this.userId = userId;
        this.role = role;
        this.companyId = companyId;
        this.email = email;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}