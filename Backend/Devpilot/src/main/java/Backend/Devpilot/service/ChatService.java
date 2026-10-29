package Backend.Devpilot.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import Backend.Devpilot.dto.ChatMessageResponse;
import Backend.Devpilot.dto.ChatSessionResponse;
import Backend.Devpilot.dto.CreateChatSessionRequest;
import Backend.Devpilot.entity.ChatMessage;
import Backend.Devpilot.entity.ChatSession;
import Backend.Devpilot.entity.IndexStatus;
import Backend.Devpilot.entity.MessageRole;
import Backend.Devpilot.entity.Repository;
import Backend.Devpilot.expection.BadRequestException;
import Backend.Devpilot.expection.NotFoundException;
import Backend.Devpilot.repository.ChatMessageRepository;
import Backend.Devpilot.repository.ChatSessionRepository;
import Backend.Devpilot.service.ai.ChatPromptBuilder;
import Backend.Devpilot.service.ai.ChatStreamHandler;
import Backend.Devpilot.service.ai.CitationMapper;
import Backend.Devpilot.service.ai.CodeContextRetriver;
import Backend.Devpilot.service.ai.RagSettings;
import lombok.RequiredArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Chat sessions and the RAG chat pipeline entry point.
 *
 * <p>{@link #streamReply} orchestrates the full flow:
 * validate → save user message → retrieve code context → build prompts → stream AI reply.
 * Each step is implemented in a dedicated class under {@code service.ai}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final RepoServices repoService;
    private final CodeContextRetriver codeContextRetriever;
    private final ChatPromptBuilder chatPromptBuilder;
    private final ChatStreamHandler chatStreamHandler;
    private final CitationMapper citationMapper;
    
    private static final java.util.concurrent.ExecutorService CHAT_EXECUTOR =
            java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor();

    @Transactional
    public ChatSessionResponse createSession(UUID userId, CreateChatSessionRequest request) {
        Repository repo = repoService.requireOwned(request.repositoryId(), userId);
        if (repo.getIndexStatus() != IndexStatus.READY) {
            throw new BadRequestException("Repository must be indexed before chatting");
        }

        String title = request.title() != null && !request.title().isBlank()
                ? request.title()
                : "Chat with " + repo.getFullName();

        ChatSession session = ChatSession.builder()
                .userId(userId)
                .repositoryId(repo.getId())
                .title(title)
                .build();
        session = chatSessionRepository.save(session);
        return toSessionResponse(session);
    }

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listSessions(UUID userId, UUID repositoryId) {
        repoService.requireOwned(repositoryId, userId);
        return chatSessionRepository
                .findByUserIdAndRepositoryIdOrderByCreatedAtDesc(userId, repositoryId)
                .stream()
                .map(this::toSessionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(UUID userId, UUID sessionId) {
        ChatSession session = requireSession(userId, sessionId);
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId()).stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatSession requireSession(UUID userId, UUID sessionId) {
        return chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new NotFoundException("Chat session not found"));
    }

    public SseEmitter streamReply(UUID userId, UUID sessionId, String userContent) {
        ChatSession session = requireSession(userId, sessionId);
        Repository repo = repoService.requireOwned(session.getRepositoryId(), userId);
        if (repo.getIndexStatus() != IndexStatus.READY) {
            throw new BadRequestException("Repository is not ready for chat");
        }

        SseEmitter emitter = new SseEmitter(RagSettings.STREAM_TIMEOUT_MS);

        CHAT_EXECUTOR.execute(() -> {
            try {
                ChatMessage userMessage = chatMessageRepository.save(ChatMessage.builder()
                        .sessionId(session.getId())
                        .role(MessageRole.USER)
                        .content(userContent)
                        .build());
                emitter.send(SseEmitter.event().name("user_message").data(toMessageResponse(userMessage)));
                emitter.send(SseEmitter.event().name("status").data("searching"));

                long t0 = System.currentTimeMillis();
                var ctx = codeContextRetriever.retrive(repo.getId(), userContent);
                log.info("retrieval took {} ms", System.currentTimeMillis() - t0);

                String systemPrompt = chatPromptBuilder.systemPrompt(repo.getFullName());
                String userPrompt = chatPromptBuilder.userPrompt(ctx.contextText(), userContent);

                chatStreamHandler.stream(emitter, session.getId(), ctx.citations(), systemPrompt, userPrompt);
            } catch (Exception e) {
                log.error("Chat failed", e);
                try {
                    emitter.send(SseEmitter.event().name("error").data("Something went wrong. Please try again."));
                } catch (Exception ignored) {}
                emitter.complete();
            }
        });
        return emitter;
    }
    private ChatSessionResponse toSessionResponse(ChatSession session) {
        return new ChatSessionResponse(
                session.getId(),
                session.getRepositoryId(),
                session.getTitle(),
                session.getCreatedAt());
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