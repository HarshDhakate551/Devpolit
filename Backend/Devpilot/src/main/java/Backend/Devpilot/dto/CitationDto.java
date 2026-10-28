package Backend.Devpilot.dto;

public record CitationDto(
			String FilePath,
			Integer StartLine,
			Integer EndLine,
			String Language
		) {
	
}
