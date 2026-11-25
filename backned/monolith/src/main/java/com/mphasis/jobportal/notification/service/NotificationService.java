package com.mphasis.jobportal.notification.service;

import com.mphasis.hiringtracker.config.AuthContext;
import com.mphasis.jobportal.notification.entity.Notification;
import com.mphasis.jobportal.notification.repository.NotificationRepository;
import com.mphasis.jobportal.userservice.model.CompanyEmployee;
import com.mphasis.jobportal.userservice.repo.CandidateRepository;
import com.mphasis.jobportal.userservice.repo.CompanyEmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@SuppressWarnings("null")
public class NotificationService {
    private final NotificationRepository repository;
    private final CandidateRepository candidateRepository;
    private final CompanyEmployeeRepository employeeRepository;
    private final ResendEmailService emailService;

    public NotificationService(NotificationRepository repository,
                               CandidateRepository candidateRepository,
                               CompanyEmployeeRepository employeeRepository,
                               ResendEmailService emailService) {
        this.repository = repository;
        this.candidateRepository = candidateRepository;
        this.employeeRepository = employeeRepository;
        this.emailService = emailService;
    }

    public Notification create(Long recipientId, String recipientRole, String type,
                               String title, String message, String link) {
        Notification notification = new Notification();
        notification.setRecipientId(recipientId);
        notification.setRecipientRole(recipientRole);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLink(link);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        Notification saved = repository.save(notification);
        resolveEmail(recipientId, recipientRole).ifPresent(email ->
                emailService.send(email, title, message));
        return saved;
    }

    public List<Notification> listFor(Long recipientId, String role) {
        return repository.findTop50ByRecipientIdAndRecipientRoleOrderByCreatedAtDesc(recipientId, role);
    }

    public long unreadCount(Long recipientId, String role) {
        return repository.countByRecipientIdAndRecipientRoleAndReadFalse(recipientId, role);
    }

    @Transactional
    public void markRead(Long id, Long recipientId, String role) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        assertOwner(notification, recipientId, role);
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        repository.save(notification);
    }

    @Transactional
    public int markAllRead(Long recipientId, String role) {
        List<Notification> notifications = repository
                .findTop50ByRecipientIdAndRecipientRoleOrderByCreatedAtDesc(recipientId, role);
        int changed = 0;
        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                notification.setReadAt(LocalDateTime.now());
                changed++;
            }
        }
        repository.saveAll(notifications);
        return changed;
    }

    private void assertOwner(Notification notification, Long recipientId, String role) {
        if (!recipientId.equals(notification.getRecipientId()) || !role.equals(notification.getRecipientRole())) {
            throw new AuthContext.ForbiddenException("You cannot access this notification");
        }
    }

    private java.util.Optional<String> resolveEmail(Long recipientId, String role) {
        if ("CANDIDATE".equals(role)) {
            return candidateRepository.findById(recipientId).map(candidate -> candidate.getEmail());
        }
        return employeeRepository.findById(recipientId).map(CompanyEmployee::getEmail);
    }
}
