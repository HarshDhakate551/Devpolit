package Backend.Devpilot.service.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AiRateLimiter {
private final long delayMs;
	
	public AiRateLimiter(@Value("${app.ai.embedding-delay-ms:600}") long delayMs) {
		this.delayMs = Math.max(0, delayMs);
	}
	
	public void pause() {
		if(delayMs <= 0) {
			return;
		}
		try {
			Thread.sleep(delayMs);
		}catch(InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new IllegalStateException("Interrupted while AI rate limiting", e);
		}
	}
}
