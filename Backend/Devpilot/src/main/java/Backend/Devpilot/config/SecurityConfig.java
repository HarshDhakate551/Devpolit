package Backend.Devpilot.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.endpoint.OAuth2AccessTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.endpoint.RestClientAuthorizationCodeTokenResponseClient;
import org.springframework.security.oauth2.client.http.OAuth2ErrorResponseErrorHandler;
import org.springframework.security.oauth2.core.http.converter.OAuth2AccessTokenResponseHttpMessageConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.web.client.RestClient;

import Backend.Devpilot.Security.GithubOAuth2UserService;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
	private final GithubOAuth2UserService githubOAuth2UserService;
//	private final AuthenticationSuccessHandler oauth2SuccessHandler; // Is this exist it giving circular dependency
//	private final AuthenticationFailureHandler oauth2FailureHandler;

	@Bean
	SecurityFilterChain securityFilterChain(
			HttpSecurity http, 
			AuthenticationSuccessHandler oauth2SuccessHandler, 
			AuthenticationFailureHandler oauth2FailureHandler) throws Exception {
		http
		.cors(Customizer.withDefaults())
		.csrf(csrf -> csrf.disable())
		.sessionManagement(
				session -> session.sessionCreationPolicy(
						SessionCreationPolicy.IF_REQUIRED)
				)
		.authorizeHttpRequests(auth -> auth.requestMatchers(
					"/api/auth/login-url",
					"/oauth2/**",
					"/login/oauth2/**",
					"/error"
				)
				.permitAll()
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // without this server blocks the browser without even check if it has acessId or token
				.requestMatchers("/api/**").authenticated() // Any URL starting with /api/ (except the public ones above) requires a valid, logged-in session or token
				.anyRequest().permitAll()
				)
		.exceptionHandling(exception -> exception.authenticationEntryPoint(
				new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
				))
		.oauth2Login(oauth -> oauth
			    .userInfoEndpoint(userInfo -> userInfo
			        .userService(githubOAuth2UserService)
			    )
//		Claude used for this .tokenEndpoint part
			    .tokenEndpoint(token -> token
			            .accessTokenResponseClient(accessTokenResponseClient()))
			    .successHandler(oauth2SuccessHandler)
			    .failureHandler((request, response, exception) -> {
			        exception.printStackTrace();
			        response.sendRedirect("http://localhost:3000/login?error");
			    })
			)
		.logout(logout -> logout
				.logoutUrl("/api/auth/logout")
				.logoutSuccessHandler((request, response, authenticate) ->
						response.setStatus(HttpStatus.NO_CONTENT.value())
						)
				.invalidateHttpSession(true)
				.clearAuthentication(false)
				.deleteCookies("DEVPILOT_SESSION")
				);
		return http.build();
		
	}
	
//	This bean was created by claude -- this needed else things break -- 
	@Bean
	OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> accessTokenResponseClient() {
	    RestClient restClient = RestClient.builder()
	            .requestFactory(new JdkClientHttpRequestFactory())
	            .configureMessageConverters(configurer -> {
	                configurer.registerDefaults();
	                configurer.addCustomConverter(new OAuth2AccessTokenResponseHttpMessageConverter());
	            })
	            .defaultStatusHandler(new OAuth2ErrorResponseErrorHandler())
	            .build();

	    RestClientAuthorizationCodeTokenResponseClient client =
	            new RestClientAuthorizationCodeTokenResponseClient();
	    client.setRestClient(restClient);
	    return client;
	}
	
	
	@Bean
	AuthenticationSuccessHandler oauth2SuccessHandler(@Value("${app.frontend-url}") String frontendUrl) {
		SimpleUrlAuthenticationSuccessHandler handler = new SimpleUrlAuthenticationSuccessHandler();
		handler.setDefaultTargetUrl(frontendUrl+ "/auth/callback");
		return handler;
	}
	
	@Bean
	AuthenticationFailureHandler oauth2FailureHandler(@Value("${app.frontend-url}") String frontendUrl) {
		SimpleUrlAuthenticationFailureHandler handler = new SimpleUrlAuthenticationFailureHandler();
		handler.setDefaultFailureUrl(frontendUrl+ "/login?error=oauth_failed");
		return handler;
	}
	
}
