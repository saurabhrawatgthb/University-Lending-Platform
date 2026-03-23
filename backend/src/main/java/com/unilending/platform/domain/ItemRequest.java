package com.unilending.platform.domain;

import com.unilending.platform.domain.enums.RequestStatus;
import com.unilending.platform.domain.enums.UrgencyLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Column(nullable = false)
    private String title;

    private String category;
    private String description;

    @Enumerated(EnumType.STRING)
    private UrgencyLevel urgency;

    private Integer durationHours;
    private String locationTag;

    @Enumerated(EnumType.STRING)
    private RequestStatus status = RequestStatus.OPEN;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
