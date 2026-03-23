package com.unilending.platform.service;

import com.unilending.platform.domain.ItemRequest;
import com.unilending.platform.domain.Offer;
import com.unilending.platform.domain.User;
import com.unilending.platform.repository.ItemRequestRepository;
import com.unilending.platform.repository.OfferRepository;
import com.unilending.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RequestService {
    
    private final ItemRequestRepository requestRepository;
    private final OfferRepository offerRepository;
    private final UserRepository userRepository;
    private final MatchingEngineService matchingEngineService;

    public ItemRequest createRequest(ItemRequest request, UUID requesterId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        request.setRequester(requester);
        ItemRequest savedRequest = requestRepository.save(request);
        
        matchingEngineService.processNewRequest(savedRequest);
        
        return savedRequest;
    }

    public Page<ItemRequest> getFeed(Pageable pageable) {
        return requestRepository.findAll(pageable); // Basic feed for MVP
    }
    
    public Offer createOffer(UUID requestId, Offer offer, UUID lenderId) {
        ItemRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        User lender = userRepository.findById(lenderId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        offer.setRequest(request);
        offer.setLender(lender);
        
        return offerRepository.save(offer);
    }

    public List<Offer> getOffersForRequest(UUID requestId) {
        ItemRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        return offerRepository.findByRequest(request);
    }
}
