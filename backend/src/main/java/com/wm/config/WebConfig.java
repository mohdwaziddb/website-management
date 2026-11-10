package com.wm.config;

import com.wm.common.ApiException;
import com.wm.service.settings.WebsiteSettingsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    /** Online store sirf is website type par */
    private static final String STORE_TYPE = "ecommerce";

    private final AppProperties props;
    // lazy: settings service ke beans WebConfig se pehle na banane padein
    private final ObjectProvider<WebsiteSettingsService> settings;

    public WebConfig(AppProperties props, ObjectProvider<WebsiteSettingsService> settings) {
        this.props = props;
        this.settings = settings;
    }

    /** Uploaded files public serve hoti hain (website par images/PDF dikhane ke liye). */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Path.of(props.uploadDir()).toAbsolutePath().normalize().toUri().toString();
        // folder abhi na bana ho to toUri() trailing "/" nahi lagata, aur resource handler kuch nahi dhoondhta
        if (!location.endsWith("/")) location += "/";
        registry.addResourceHandler("/files/**").addResourceLocations(location);
    }

    /**
     * Online store ki saari APIs (customer login / sign-up, cart, checkout, store admin) sirf E-commerce website par.
     * Baaki website par 404 — frontend par bhi ye pages "Page not found" hain.
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
                if ("OPTIONS".equalsIgnoreCase(req.getMethod())) return true;
                if (!STORE_TYPE.equals(settings.getObject().getSettings().get("site_type"))) {
                    throw ApiException.notFound("Online store is not enabled for this website");
                }
                return true;
            }
        }).addPathPatterns("/api/store/**", "/api/public/store/**", "/api/shop/**");
    }
}
