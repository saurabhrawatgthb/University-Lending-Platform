package com.unilending.platform.controller;

import com.unilending.platform.domain.User;
import com.unilending.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public User registerUser(@RequestBody User user) {
        return userRepository.findByEmail(user.getEmail())
                .orElseGet(() -> userRepository.save(user));
    }
    
    @GetMapping("/{id}")
    public User getUser(@PathVariable UUID id) {
        return userRepository.findById(id).orElseThrow();
    }

    @PutMapping("/{id}/trust-score")
    public User updateTrustScore(@PathVariable UUID id, @RequestBody java.util.Map<String, Object> payload) {
        User user = userRepository.findById(id).orElseThrow();
        Object score = payload.get("trustScore");
        if (score instanceof Number) {
            user.setTrustScore(new java.math.BigDecimal(score.toString()));
        } else if (score instanceof String) {
            user.setTrustScore(new java.math.BigDecimal((String) score));
        }
        return userRepository.save(user);
    }
}
