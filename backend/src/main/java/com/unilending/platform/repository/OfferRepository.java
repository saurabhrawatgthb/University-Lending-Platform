package com.unilending.platform.repository;

import com.unilending.platform.domain.ItemRequest;
import com.unilending.platform.domain.Offer;
import com.unilending.platform.domain.enums.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OfferRepository extends JpaRepository<Offer, UUID> {
    List<Offer> findByRequest(ItemRequest request);
    List<Offer> findByRequestAndStatus(ItemRequest request, OfferStatus status);
}
