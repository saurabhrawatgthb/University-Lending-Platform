package com.unilending.platform.repository;

import com.unilending.platform.domain.ItemRequest;
import com.unilending.platform.domain.enums.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ItemRequestRepository extends JpaRepository<ItemRequest, UUID> {
    Page<ItemRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status, Pageable pageable);
    
    Page<ItemRequest> findByCategoryAndStatusOrderByCreatedAtDesc(String category, RequestStatus status, Pageable pageable);
}
