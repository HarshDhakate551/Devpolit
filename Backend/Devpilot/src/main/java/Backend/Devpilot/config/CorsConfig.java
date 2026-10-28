package Backend.Devpilot.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {
	
	@Bean
	CorsConfigurationSource corsConfigurationSource(
//			value from applciation.properties will be stored in allowedOrigins variables
			@Value("${app.cors.allowed-origins}") String allowedOrigins) {
		CorsConfiguration config = new CorsConfiguration();
		List<String> origins = Arrays.stream(allowedOrigins.split(","))
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.toList();
		config.setAllowedOrigins(origins);
		config.setAllowedMethods(List.of("GET","POST","PUT","DELETE"));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowCredentials(true);
		config.setMaxAge(3600L); // here L is long data type and used to tell how long can data be cached here it's 1 hour
//		 caching for 1hr helps i anw that browser first check connection bridge and then for next 1hr it won't need to check
		
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//		Storing the rules which were set in config for the url "/**" i.e; accross entire application
		source.registerCorsConfiguration("/**", config);
		return source;
		
	}
}
