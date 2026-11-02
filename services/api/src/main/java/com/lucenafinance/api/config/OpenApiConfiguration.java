package com.lucenafinance.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {
    @Bean OpenAPI financeOpenApi() {
        return new OpenAPI().info(new Info().title("Lucena Finance API")
                .version("v1").description("API financeira. Integrações sensíveis permanecem desabilitadas até configuração segura."));
    }
}
