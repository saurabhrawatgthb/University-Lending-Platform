package com.unilending.platform.repository;

import com.unilending.platform.domain.Transaction;
import com.unilending.platform.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByBorrowerOrLenderOrderByStartTimeDesc(User borrower, User lender);
}
