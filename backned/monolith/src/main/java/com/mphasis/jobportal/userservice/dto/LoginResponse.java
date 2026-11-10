package com.mphasis.jobportal.userservice.dto;

public class LoginResponse {
    private boolean success;
    private String message;
    private Long userId;
    private String role;
    private Long companyId;
    private String email;
    private String token;

    public LoginResponse() {}

    public LoginResponse(boolean success, String message, Long userId, String role, Long companyId, String email) {
        this.success = success;
        this.message = message;
        this.userId = userId;
        this.role = role;
        this.companyId = companyId;
        this.email = email;
    }

    public LoginResponse(boolean success, String message, Long userId, String role, Long companyId, String email, String token) {
        this(success, message, userId, role, companyId, email);
        this.token = token;
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

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}