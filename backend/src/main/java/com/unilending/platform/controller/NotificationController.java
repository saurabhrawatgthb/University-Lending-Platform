package com.unilending.platform.controller;

import com.unilending.platform.domain.Notification;
import com.unilending.platform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/user/{userId}")
    public List<Notification> getNotificationsForUser(@PathVariable UUID userId) {
        return notificationService.getNotificationsForUser(userId);
    }
}
