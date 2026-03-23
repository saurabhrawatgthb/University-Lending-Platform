# Core Backend Logic (Java & Spring Boot)

This document highlights the core backend architecture, specifically focusing on the critical **Smart Matching** and **Real-Time Notification** features.

## 1. Domain Entities (JPA)

```java
@Entity
@Table(name = "requests")
public class ItemRequest {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    private User requester;

    @Column(nullable = false)
    private String title;
    
    @Enumerated(EnumType.STRING)
    private RequestStatus status; // OPEN, FULFILLED, CLOSED

    private String locationTag;
    
    // Getters and setters...
}

@Entity
@Table(name = "offers")
public class Offer {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private ItemRequest request;

    @ManyToOne
    private User lender;

    @Enumerated(EnumType.STRING)
    private OfferStatus status; // PENDING, ACCEPTED, REJECTED
}
```

## 2. Real-Time Notification Implementation (Spring WebSockets)

WebSocket configuration using STOMP.

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Topic for broadcast (e.g. all users in hostel), Queue for direct user messages
        config.enableSimpleBroker("/topic", "/queue"); 
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
         // Connect via ws://localhost:8080/ws with SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

Service to push notifications:
```java
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendDirectNotification(UUID userId, NotificationPayload payload) {
        // Sends to /user/{userId}/queue/notifications
        messagingTemplate.convertAndSendToUser(
            userId.toString(), 
            "/queue/notifications", 
            payload
        );
    }
    
    public void broadcastLocalRequest(String locationTag, ItemRequest request) {
        // Sends to /topic/requests/BlockA
        messagingTemplate.convertAndSend(
            "/topic/requests/" + locationTag.replaceAll(" ", ""),
            request
        );
    }
}
```

## 3. Smart Matching Core Logic

When a request is created, we don't just wait passively. We proactively find the best users to notify.

```java
@Service
@RequiredArgsConstructor
public class MatchingEngineService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Async // Run asynchronously to not block the request API response
    @Transactional(readOnly = true)
    public void processNewRequest(ItemRequest request) {
        // Smart Matching Step 1: Proximity (Find users in the same location tag / Hostel block)
        List<User> localUsers = userRepository.findByHostelBlock(request.getLocationTag());

        // Smart Matching Step 2: Quality Filtering (Filter users with bad trust scores, < 2.0)
        List<User> qualifiedLenders = localUsers.stream()
            .filter(user -> user.getTrustScore() >= 2.0)
            .filter(user -> !user.getId().equals(request.getRequester().getId())) // Exclude self
            .collect(Collectors.toList());

        // Smart Matching Step 3: Predictive Matching (Optional AI/Heuristics)
        // E.g. Query the 'Items' table to see if they specifically listed this item before
        
        // Step 4: Dispatch push notifications via WebSocket
        NotificationPayload payload = new NotificationPayload(
            "NEW_REQUEST_NEARBY", 
            request.getRequester().getFullName() + " needs a " + request.getTitle() + " urgently."
        );

        for (User lender : qualifiedLenders) {
             notificationService.sendDirectNotification(lender.getId(), payload);
        }
    }
}
```

## 4. The Acceptance Workflow (Critical Transaction Logic)

Handling edge cases where multiple people bid, but only one can be accepted.

```java
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final RequestRepository requestRepository;
    private final OfferRepository offerRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    @Transactional // CRITICAL: This method must be atomic
    public Transaction acceptOffer(UUID requestId, UUID acceptedOfferId, UUID requesterId) {
        ItemRequest request = requestRepository.findById(requestId).orElseThrow();
        
        // Prevent race conditions (Double acceptance)
        if (request.getStatus() != RequestStatus.OPEN) {
            throw new IllegalStateException("Request is already fulfilled or closed");
        }

        Offer acceptedOffer = offerRepository.findById(acceptedOfferId).orElseThrow();

        // 1. Mark request as fulfilled
        request.setStatus(RequestStatus.FULFILLED);
        requestRepository.save(request);

        // 2. Mark this offer as accepted
        acceptedOffer.setStatus(OfferStatus.ACCEPTED);
        offerRepository.save(acceptedOffer);

        // 3. Mark all other offers as REJECTED
        List<Offer> otherOffers = offerRepository.findByRequestAndStatus(request, OfferStatus.PENDING);
        for (Offer offer : otherOffers) {
            if (!offer.getId().equals(acceptedOfferId)) {
                offer.setStatus(OfferStatus.REJECTED);
                notificationService.sendDirectNotification(
                    offer.getLender().getId(), 
                    new NotificationPayload("OFFER_DECLINED", "Your offer was not selected.")
                );
            }
        }

        // 4. Create actual Transaction
        Transaction tx = new Transaction();
        tx.setRequest(request);
        tx.setBorrower(request.getRequester());
        tx.setLender(acceptedOffer.getLender());
        tx.setStatus(TransactionStatus.PENDING_EXCHANGE);
        
        return transactionRepository.save(tx);
    }
}
```

### 5. Edge Cases Addressed in Logic
*   **Race Conditions**: Handled by `@Transactional` and checking `status != OPEN` before modifying state. If two users try to accept an offer simultaneously, DB row-level locking or optimistic locking (via `@Version`) should be employed to ensure idempotency.
*   **Spam Control**: Missing from code snippet for brevity, but should be interceptors checking Redis for `POST /requests` count per user per minute.
