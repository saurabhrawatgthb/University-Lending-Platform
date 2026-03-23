package com.unilending.platform.controller;

import com.unilending.platform.domain.Transaction;
import com.unilending.platform.domain.enums.TransactionStatus;
import com.unilending.platform.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionRepository transactionRepository;

    @GetMapping("/{id}")
    public Transaction getTransaction(@PathVariable UUID id) {
        return transactionRepository.findById(id).orElseThrow();
    }

    @PutMapping("/{id}/status")
    public Transaction updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        Transaction tx = transactionRepository.findById(id).orElseThrow();
        tx.setStatus(TransactionStatus.valueOf(payload.get("status")));
        return transactionRepository.save(tx);
    }
}
