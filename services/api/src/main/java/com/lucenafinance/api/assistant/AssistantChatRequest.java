package com.lucenafinance.api.assistant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AssistantChatRequest(@NotBlank @Size(max = 800) String question,
                                   @Size(max = 10) List<HistoryMessage> history,
                                   @Size(max = 48) String agentId) {
    public record HistoryMessage(@NotBlank String role, @NotBlank @Size(max = 1200) String content) {}
}
