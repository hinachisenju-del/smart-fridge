package com.smartfridge;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfridge.controller.HealthController;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;

@SpringBootTest
class SmartFridgeApplicationTests {

    @Autowired
    private HealthController healthController;

    @Test
    void contextLoadsAndHealthEndpointReturnsUp() {
        ResponseEntity<Map<String, Object>> response = healthController.checkHealth();
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("UP");
        assertThat(response.getBody().get("service")).isEqualTo("smart-fridge-backend");
    }
}
