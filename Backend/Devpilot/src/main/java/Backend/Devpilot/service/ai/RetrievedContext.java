package Backend.Devpilot.service.ai;

import java.util.List;

import Backend.Devpilot.dto.CitationDto;

public record RetrievedContext(
			List<CitationDto> citations,
			String contextText
		) {
	
}
