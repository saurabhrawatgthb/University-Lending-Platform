package com.unilending.platform.service;

import com.unilending.platform.domain.Notification;
import com.unilending.platform.domain.User;
import com.unilending.platform.dto.NotificationPayload;
import com.unilending.platform.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    public void sendDirectNotification(User user, NotificationPayload payload) {
        // Persist to DB
        Notification notification = Notification.builder()
                .user(user)
                .type(payload.getType())
                .message(payload.getMessage())
                .referenceId(payload.getReferenceId())
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // STOMP WebSocket Push
        messagingTemplate.convertAndSendToUser(
                user.getId().toString(),
                "/queue/notifications",
                payload
        );
    }

    public void broadcastLocalRequest(String locationTag, NotificationPayload payload) {
        // Broadcast without persisting for every single user
        messagingTemplate.convertAndSend(
                "/topic/requests/" + locationTag.replaceAll(" ", ""),
                payload
        );
    }
}
