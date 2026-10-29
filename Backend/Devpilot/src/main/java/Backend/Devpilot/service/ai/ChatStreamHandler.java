package Backend.Devpilot.service.ai;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import Backend.Devpilot.dto.ChatMessageResponse;
import Backend.Devpilot.dto.CitationDto;
import Backend.Devpilot.entity.ChatMessage;
import Backend.Devpilot.entity.MessageRole;
import Backend.Devpilot.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatStreamHandler {

    private final ChatModel chatModel;
    private final ChatMessageRepository chatMessageRepository;
    private final CitationMapper citationMapper;

    public void stream(
            SseEmitter emitter,
            UUID sessionId,
            List<CitationDto> citations,
            String systemPrompt,
            String userPrompt) {

        StringBuilder fullReply = new StringBuilder();

        AtomicBoolean first = new AtomicBoolean(true);
        long start = System.currentTimeMillis();

        ChatClient.builder(chatModel)
                .build()
                .prompt()
                .system(systemPrompt)
                .user(userPrompt)
                .stream()
                .content()
                .timeout(Duration.ofSeconds(60))   // fail visibly instead of hanging
                .doOnSubscribe(s -> log.info("LLM stream subscribed"))
                .doOnNext(token -> {
                    if (first.compareAndSet(true, false)) {
                        log.info("First token after {} ms", System.currentTimeMillis() - start);
                    }
                    appendToken(emitter, fullReply, token);
                })
                .doOnComplete(() -> {
                    log.info("LLM stream complete, {} chars", fullReply.length());
                    completeStream(emitter, sessionId, fullReply, citations);
                })
                .doOnCancel(() -> log.warn("LLM stream cancelled"))
                .doOnError(err -> {
                    log.error("Chat stream error", err);
                    try {
                        emitter.send(SseEmitter.event().name("error")
                                .data("The AI model is unavailable right now. Please try again."));
                    } catch (Exception ignored) {}
                    emitter.complete();
                })
                .subscribe(token -> { }, err -> { });
    }

    private void appendToken(SseEmitter emitter, StringBuilder fullReply, String token) {
        fullReply.append(token);
        try {
            emitter.send(SseEmitter.event()
                    .name("token")
                    .data(token, MediaType.APPLICATION_JSON));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private void completeStream(
            SseEmitter emitter,
            UUID sessionId,
            StringBuilder fullReply,
            List<CitationDto> citations) {
        try {
            ChatMessage assistant = chatMessageRepository.save(ChatMessage.builder()
                    .sessionId(sessionId)
                    .role(MessageRole.ASSISTANT)
                    .content(fullReply.toString())
                    .citations(citationMapper.toJson(citations))
                    .build());

            emitter.send(SseEmitter.event()
                    .name("assistant_message")
                    .data(toMessageResponse(assistant)));
            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
            emitter.complete();
        } catch (Exception ex) {
            log.error("Failed to finish chat stream", ex);
            emitter.complete();
        }
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                citationMapper.fromJson(message.getCitations()),
                message.getCreatedAt());
    }
}