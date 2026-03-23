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
        return userRepository.save(user);
    }
    
    @GetMapping("/{id}")
    public User getUser(@PathVariable UUID id) {
        return userRepository.findById(id).orElseThrow();
    }
}
