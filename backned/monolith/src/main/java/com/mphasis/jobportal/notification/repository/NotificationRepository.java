package com.mphasis.jobportal.notification.repository;

import com.mphasis.jobportal.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop50ByRecipientIdAndRecipientRoleOrderByCreatedAtDesc(Long recipientId, String recipientRole);
    long countByRecipientIdAndRecipientRoleAndReadFalse(Long recipientId, String recipientRole);
}
