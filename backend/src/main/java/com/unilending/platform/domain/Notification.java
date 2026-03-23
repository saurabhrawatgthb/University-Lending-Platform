package com.unilending.platform.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String type; // NEW_REQUEST_NEARBY, OFFER_DECLINED, OFFER_ACCEPTED
    private String message;
    private String referenceId; // E.g., request Id or offer Id

    private boolean isRead = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
