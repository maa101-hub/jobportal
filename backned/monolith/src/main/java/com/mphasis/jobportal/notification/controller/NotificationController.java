package com.mphasis.jobportal.notification.controller;

import com.mphasis.hiringtracker.config.AuthContext;
import com.mphasis.jobportal.notification.entity.Notification;
import com.mphasis.jobportal.notification.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Notification> list(HttpServletRequest request) {
        return service.listFor(AuthContext.requireUserId(request), role(request));
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(HttpServletRequest request) {
        return Map.of("count", service.unreadCount(AuthContext.requireUserId(request), role(request)));
    }

    @PutMapping("/{id}/read")
    public void markRead(@PathVariable Long id, HttpServletRequest request) {
        service.markRead(id, AuthContext.requireUserId(request), role(request));
    }

    @PutMapping("/read-all")
    public Map<String, Integer> markAllRead(HttpServletRequest request) {
        return Map.of("updated", service.markAllRead(AuthContext.requireUserId(request), role(request)));
    }

    private String role(HttpServletRequest request) {
        return String.valueOf(request.getAttribute(com.mphasis.hiringtracker.config.JwtAuthFilter.AUTH_ROLE));
    }
}
