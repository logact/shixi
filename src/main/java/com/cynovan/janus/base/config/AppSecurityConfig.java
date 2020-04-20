package com.cynovan.janus.base.config;

import com.cynovan.janus.base.config.auth.AuthenticationFilter;
import com.cynovan.janus.base.config.auth.handler.CustomLoginFailureHandler;
import com.cynovan.janus.base.config.auth.handler.CustomLoginSuccessHandler;
import com.cynovan.janus.base.config.auth.handler.CustomLogoutSuccessHandler;
import com.cynovan.janus.base.config.auth.provider.DomainUsernamePasswordAuthenticationProvider;
import com.cynovan.janus.base.config.auth.provider.TokenAuthenticationProvider;
import com.cynovan.janus.base.utils.JwtTokenUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(securedEnabled = true)
@Order(50)
class AppSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.authenticationProvider(domainUsernamePasswordAuthenticationProvider())
                .authenticationProvider(tokenAuthenticationProvider());
    }

    @Bean
    public AuthenticationProvider domainUsernamePasswordAuthenticationProvider() {
        DomainUsernamePasswordAuthenticationProvider domainUsernamePasswordAuthenticationProvider = new DomainUsernamePasswordAuthenticationProvider();
        return domainUsernamePasswordAuthenticationProvider;
    }

    @Bean
    public AuthenticationProvider tokenAuthenticationProvider() {
        TokenAuthenticationProvider tokenAuthenticationProvider = new TokenAuthenticationProvider();
        return tokenAuthenticationProvider;
    }

    @Override
    public void configure(WebSecurity web) throws Exception {
        super.configure(web);
        web.ignoring().antMatchers("/resource/**", "/websocket/**","/ws/**",
                "/welcome/**", "/neptune/**", "/api/**", "/tunnel", "/guacamole", "/dashboard/**");
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {

        http.headers().frameOptions().disable();

        http.httpBasic().disable();

        http.cors()
                .and()
                .csrf().disable()
                .authorizeRequests()
                .antMatchers("/", "/initialize/**", "/actuator/**", "/gridfs/**", "/httpapi/**", "/i18n/**").permitAll()
                .anyRequest().authenticated()
                .and()
                .formLogin()
                .loginPage("/login")
                .permitAll()
                .failureUrl("/login")
                .failureHandler(newCustomLoginFailureHandler())
                .loginProcessingUrl("/authenticate")
                .successForwardUrl("/index")
                .successHandler(newCustomLoginSuccessHandler())
                .and()
                .logout()
                .logoutUrl("/logout")
                .logoutSuccessHandler(customLogoutSuccessHandler())
                .permitAll()
                .logoutSuccessUrl("/login")
                .deleteCookies(JwtTokenUtils.ACCESS_TOKEN_KEY, JwtTokenUtils.REFRESH_TOKEN_KEY)
                .and()
                .rememberMe()
                .key("rememberme")
                .and().sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .addFilterBefore(new AuthenticationFilter(authenticationManager()),
                        BasicAuthenticationFilter.class);
    }

    @Bean(name = "authenticationManager")
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    public CustomLoginFailureHandler newCustomLoginFailureHandler() throws Exception {
        return new CustomLoginFailureHandler();
    }

    public CustomLoginSuccessHandler newCustomLoginSuccessHandler() throws Exception {
        return new CustomLoginSuccessHandler();
    }

    public CustomLogoutSuccessHandler customLogoutSuccessHandler() throws Exception {
        return new CustomLogoutSuccessHandler();
    }
}