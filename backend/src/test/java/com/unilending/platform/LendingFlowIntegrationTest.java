package com.unilending.platform;

import com.unilending.platform.controller.UserController;
import com.unilending.platform.domain.ItemRequest;
import com.unilending.platform.domain.Offer;
import com.unilending.platform.domain.Transaction;
import com.unilending.platform.domain.User;
import com.unilending.platform.domain.enums.OfferStatus;
import com.unilending.platform.domain.enums.RequestStatus;
import com.unilending.platform.domain.enums.TransactionStatus;
import com.unilending.platform.domain.enums.UrgencyLevel;
import com.unilending.platform.repository.ItemRequestRepository;
import com.unilending.platform.repository.OfferRepository;
import com.unilending.platform.repository.TransactionRepository;
import com.unilending.platform.repository.UserRepository;
import com.unilending.platform.service.RequestService;
import com.unilending.platform.service.TransactionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class LendingFlowIntegrationTest {

    @Autowired
    private UserController userController;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RequestService requestService;

    @Autowired
    private ItemRequestRepository requestRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Test
    void testEndToEndLendingFlow() {
        String emailAlex = "alex." + java.util.UUID.randomUUID().toString().substring(0, 8) + "@uni.edu";
        String emailBob = "bob." + java.util.UUID.randomUUID().toString().substring(0, 8) + "@uni.edu";

        // 1. Register User A (Alex)
        User alex = User.builder()
                .fullName("Alex Student")
                .email(emailAlex)
                .passwordHash("hash")
                .hostelBlock("Block A")
                .build();
        User savedAlex = userController.registerUser(alex);
        assertNotNull(savedAlex.getId());
        assertEquals("Alex Student", savedAlex.getFullName());

        // 2. Register Alex again with same email (Verifies login-registration redirection behavior!)
        User alexDuplicate = User.builder()
                .fullName("Alex Duplicate Name")
                .email(emailAlex)
                .passwordHash("other-hash")
                .hostelBlock("Block B")
                .build();
        User loggedInAlex = userController.registerUser(alexDuplicate);
        assertEquals(savedAlex.getId(), loggedInAlex.getId());
        assertEquals("Alex Student", loggedInAlex.getFullName()); // Retains original details!

        // 3. Register User B (Bob)
        User bob = User.builder()
                .fullName("Bob Lender")
                .email(emailBob)
                .passwordHash("hash2")
                .hostelBlock("Block A")
                .build();
        User savedBob = userController.registerUser(bob);
        assertNotNull(savedBob.getId());

        // 4. Alex posts a request for an item
        ItemRequest request = ItemRequest.builder()
                .title("Scientific Calculator")
                .category("BOOKS")
                .description("Need for exam tomorrow!")
                .urgency(UrgencyLevel.HIGH)
                .durationHours(3)
                .locationTag("Block A")
                .build();
        ItemRequest savedRequest = requestService.createRequest(request, savedAlex.getId());
        assertNotNull(savedRequest.getId());
        assertEquals(RequestStatus.OPEN, savedRequest.getStatus());
        assertEquals(savedAlex.getId(), savedRequest.getRequester().getId());

        // 5. Bob makes an offer
        Offer offer1 = Offer.builder()
                .message("I have a Casio fx-991EX you can borrow.")
                .build();
        Offer savedOffer1 = requestService.createOffer(savedRequest.getId(), offer1, savedBob.getId());
        assertNotNull(savedOffer1.getId());
        assertEquals(OfferStatus.PENDING, savedOffer1.getStatus());
        assertEquals("I have a Casio fx-991EX you can borrow.", savedOffer1.getMessage());

        // 6. Bob makes a SECOND offer (Verifies our check-and-update duplicate offer protection!)
        Offer offer2 = Offer.builder()
                .message("Actually, I have the Casio and also a TI-84. Let me know which one.")
                .build();
        Offer savedOffer2 = requestService.createOffer(savedRequest.getId(), offer2, savedBob.getId());
        
        // Assert that no SQL constraint crashed the request, and it updated the original offer!
        assertEquals(savedOffer1.getId(), savedOffer2.getId());
        assertEquals("Actually, I have the Casio and also a TI-84. Let me know which one.", savedOffer2.getMessage());

        // 7. Alex accepts Bob's offer
        Transaction tx = transactionService.acceptOffer(savedRequest.getId(), savedOffer2.getId());
        assertNotNull(tx.getId());
        assertEquals(TransactionStatus.PENDING_EXCHANGE, tx.getStatus());
        assertEquals(savedAlex.getId(), tx.getBorrower().getId());
        assertEquals(savedBob.getId(), tx.getLender().getId());

        // Verify request status transitioned to FULFILLED
        ItemRequest updatedRequest = requestRepository.findById(savedRequest.getId()).orElseThrow();
        assertEquals(RequestStatus.FULFILLED, updatedRequest.getStatus());

        // Verify offer status transitioned to ACCEPTED
        Offer updatedOffer = offerRepository.findById(savedOffer2.getId()).orElseThrow();
        assertEquals(OfferStatus.ACCEPTED, updatedOffer.getStatus());

        // 8. Alex confirms receipt (IN_POSSESSION)
        Transaction handoffTx = transactionService.updateTransactionStatus(tx.getId(), TransactionStatus.IN_POSSESSION);
        assertEquals(TransactionStatus.IN_POSSESSION, handoffTx.getStatus());

        // 9. Alex confirms return (RETURNED)
        Transaction returnedTx = transactionService.updateTransactionStatus(tx.getId(), TransactionStatus.RETURNED);
        assertEquals(TransactionStatus.RETURNED, returnedTx.getStatus());

        // 10. Alex rates Bob (Updates trust score in DB!)
        Map<String, Object> ratePayload = new HashMap<>();
        ratePayload.put("trustScore", 4.8); // Alex rates Bob 4.8 (new calculated trust score!)
        User updatedBob = userController.updateTrustScore(savedBob.getId(), ratePayload);
        
        // Weighted average: (5.0 * 4 + 4.0) / 5 = 4.8
        assertEquals(0, new BigDecimal("4.8").compareTo(updatedBob.getTrustScore()));
    }
}
