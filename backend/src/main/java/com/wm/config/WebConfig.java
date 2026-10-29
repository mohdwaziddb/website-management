package com.wm.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final AppProperties props;

    public WebConfig(AppProperties props) {
        this.props = props;
    }

    /** Uploaded files public serve hoti hain (website par images/PDF dikhane ke liye). */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Path.of(props.uploadDir()).toAbsolutePath().normalize().toUri().toString();
        // folder abhi na bana ho to toUri() trailing "/" nahi lagata, aur resource handler kuch nahi dhoondhta
        if (!location.endsWith("/")) location += "/";
        registry.addResourceHandler("/files/**").addResourceLocations(location);
    }
}
