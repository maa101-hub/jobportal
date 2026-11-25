package com.mphasis.jobportal.notification.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long recipientId;

    @Column(nullable = false, length = 32)
    private String recipientRole;

    @Column(nullable = false, length = 80)
    private String type;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(length = 255)
    private String link;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime readAt;

    public Long getId() { return id; }
    public Long getRecipientId() { return recipientId; }
    public void setRecipientId(Long value) { this.recipientId = value; }
    public String getRecipientRole() { return recipientRole; }
    public void setRecipientRole(String value) { this.recipientRole = value; }
    public String getType() { return type; }
    public void setType(String value) { this.type = value; }
    public String getTitle() { return title; }
    public void setTitle(String value) { this.title = value; }
    public String getMessage() { return message; }
    public void setMessage(String value) { this.message = value; }
    public String getLink() { return link; }
    public void setLink(String value) { this.link = value; }
    public boolean isRead() { return read; }
    public void setRead(boolean value) { this.read = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime value) { this.createdAt = value; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime value) { this.readAt = value; }
}
