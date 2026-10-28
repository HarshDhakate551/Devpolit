package Backend.Devpilot.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import Backend.Devpilot.entity.MessageRole;

public record ChatMessageResponse(
			UUID id,
			MessageRole role,
			String content,
			List<CitationDto> citations,
			Instant createdAt
		) {

}
