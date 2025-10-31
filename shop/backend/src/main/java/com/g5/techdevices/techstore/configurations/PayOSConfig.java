package com.g5.techdevices.techstore.configurations;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.payos.PayOS;

@Configuration
public class PayOSConfig {

    @Value("${6ec31cb8-179a-4337-8e98-ff0f0d211080}")
    private String clientId;

    @Value("${9834c521-7822-4915-9149-9bd10dceff9d}")
    private String apiKey;

    @Value("${0d4f2dc2696208605151119e9b10d4d225cb2c1185815e25fd78ad21c0f6b281}")
    private String checksumKey;

    @Bean
    public PayOS payOS() {
        return new PayOS(clientId, apiKey, checksumKey);
    }
}
