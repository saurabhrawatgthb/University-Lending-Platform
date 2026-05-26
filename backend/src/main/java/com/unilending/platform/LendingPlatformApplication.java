package com.unilending.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class LendingPlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(LendingPlatformApplication.class, args);
	}

}
