package com.unilending.platform.service;

import com.unilending.platform.domain.ItemRequest;
import com.unilending.platform.domain.User;
import com.unilending.platform.dto.NotificationPayload;
import com.unilending.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchingEngineService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Async
    @Transactional(readOnly = true)
    public void processNewRequest(ItemRequest request) {
        // 1. Proximity Match (Users in same block)
        List<User> localUsers = userRepository.findByHostelBlock(request.getLocationTag());

        // 2. Filter users with bad trust scores (< 2.0)
        BigDecimal minTrustScore = new BigDecimal("2.0");
        List<User> qualifiedLenders = localUsers.stream()
                .filter(u -> u.getTrustScore().compareTo(minTrustScore) >= 0)
                .filter(u -> !u.getId().equals(request.getRequester().getId()))
                .toList();

        // 3. Dispatch direct push notifications
        NotificationPayload payload = new NotificationPayload(
                "NEW_REQUEST_NEARBY",
                request.getRequester().getFullName() + " urgently needs: " + request.getTitle(),
                request.getId().toString()
        );

        for (User lender : qualifiedLenders) {
            notificationService.sendDirectNotification(lender, payload);
        }
        
        // 4. Also broadcast to the location topic freely
        notificationService.broadcastLocalRequest(request.getLocationTag(), payload);
    }
}
