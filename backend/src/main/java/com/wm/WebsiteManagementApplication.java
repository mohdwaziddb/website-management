package com.wm;

import com.wm.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

// JWT khud handle hota hai; default in-memory user/password nahi chahiye
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(AppProperties.class)
public class WebsiteManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(WebsiteManagementApplication.class, args);
    }
}
