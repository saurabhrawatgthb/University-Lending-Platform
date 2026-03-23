package com.unilending.platform.controller;

import com.unilending.platform.domain.ItemRequest;
import com.unilending.platform.domain.Offer;
import com.unilending.platform.domain.Transaction;
import com.unilending.platform.service.RequestService;
import com.unilending.platform.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
public class RequestController {

    private final RequestService requestService;
    private final TransactionService transactionService;

    // Create a Request
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemRequest createRequest(@RequestBody ItemRequest request, @RequestParam UUID requesterId) {
        return requestService.createRequest(request, requesterId);
    }

    // Get Active Feed
    @GetMapping
    public Page<ItemRequest> getFeed(Pageable pageable) {
        return requestService.getFeed(pageable);
    }

    // Lender Makes an Offer to a Request
    @PostMapping("/{requestId}/offers")
    @ResponseStatus(HttpStatus.CREATED)
    public Offer makeOffer(
            @PathVariable UUID requestId,
            @RequestBody Offer offer,
            @RequestParam UUID lenderId) {
        return requestService.createOffer(requestId, offer, lenderId);
    }

    // Requester views all Offers for their Request
    @GetMapping("/{requestId}/offers")
    public List<Offer> getOffers(@PathVariable UUID requestId) {
        return requestService.getOffersForRequest(requestId);
    }

    // Requester Accepts an Offer
    @PutMapping("/{requestId}/offers/{offerId}/accept")
    public Transaction acceptOffer(
            @PathVariable UUID requestId,
            @PathVariable UUID offerId) {
        return transactionService.acceptOffer(requestId, offerId);
    }
}
