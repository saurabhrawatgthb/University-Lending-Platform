package com.unilending.platform.service;

import com.unilending.platform.domain.ItemRequest;
import com.unilending.platform.domain.Offer;
import com.unilending.platform.domain.Transaction;
import com.unilending.platform.domain.enums.OfferStatus;
import com.unilending.platform.domain.enums.RequestStatus;
import com.unilending.platform.domain.enums.TransactionStatus;
import com.unilending.platform.dto.NotificationPayload;
import com.unilending.platform.repository.ItemRequestRepository;
import com.unilending.platform.repository.OfferRepository;
import com.unilending.platform.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final ItemRequestRepository requestRepository;
    private final OfferRepository offerRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    @Transactional
    public Transaction acceptOffer(UUID requestId, UUID offerId) {
        ItemRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (request.getStatus() != RequestStatus.OPEN) {
            throw new IllegalStateException("Request is already " + request.getStatus());
        }

        Offer acceptedOffer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        // Update Request
        request.setStatus(RequestStatus.FULFILLED);
        requestRepository.save(request);

        // Update Offer
        acceptedOffer.setStatus(OfferStatus.ACCEPTED);
        offerRepository.save(acceptedOffer);

        // Reject other pending offers
        List<Offer> otherOffers = offerRepository.findByRequestAndStatus(request, OfferStatus.PENDING);
        for (Offer offer : otherOffers) {
            if (!offer.getId().equals(offerId)) {
                offer.setStatus(OfferStatus.REJECTED);
                notificationService.sendDirectNotification(
                        offer.getLender(),
                        new NotificationPayload("OFFER_DECLINED", "Your offer for " + request.getTitle() + " was not selected.", request.getId().toString())
                );
            }
        }

        // Notify winner
        notificationService.sendDirectNotification(
                acceptedOffer.getLender(),
                new NotificationPayload("OFFER_ACCEPTED", "Your offer for " + request.getTitle() + " was ACCEPTED!", request.getId().toString())
        );

        // Create Transaction
        Transaction tx = Transaction.builder()
                .request(request)
                .offer(acceptedOffer)
                .borrower(request.getRequester())
                .lender(acceptedOffer.getLender())
                .status(TransactionStatus.PENDING_EXCHANGE)
                .build();

        return transactionRepository.save(tx);
    }
}
