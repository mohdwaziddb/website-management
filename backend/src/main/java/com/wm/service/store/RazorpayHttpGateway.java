package com.wm.service.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wm.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class RazorpayHttpGateway implements RazorpayGateway {
    private static final Logger log = LoggerFactory.getLogger(RazorpayHttpGateway.class);
    private static final String API = "https://api.razorpay.com/v1";

    @Autowired
    private ObjectMapper mapper;

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Override
    public String createOrder(String keyId, String keySecret, long amountPaise, String receipt, Map<String, String> notes) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", amountPaise);
        body.put("currency", "INR");
        body.put("receipt", receipt);
        body.put("notes", notes);
        return call("POST", "/orders", keyId, keySecret, body).path("id").asText();
    }

    @Override
    public String refund(String keyId, String keySecret, String paymentId, long amountPaise) {
        return call("POST", "/payments/" + paymentId + "/refund", keyId, keySecret, Map.of("amount", amountPaise)).path("id").asText();
    }

    @Override
    public void ping(String keyId, String keySecret) {
        call("GET", "/orders?count=1", keyId, keySecret, null);
    }

    private JsonNode call(String method, String path, String keyId, String keySecret, Object body) {
        try {
            String auth = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
            HttpRequest.Builder req = HttpRequest.newBuilder(URI.create(API + path)).timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Basic " + auth).header("Content-Type", "application/json");
            req = body == null ? req.GET() : req.method(method, HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)));
            HttpResponse<String> res = http.send(req.build(), HttpResponse.BodyHandlers.ofString());
            JsonNode json = mapper.readTree(res.body().isEmpty() ? "{}" : res.body());
            if (res.statusCode() == 401) throw ApiException.badRequest("Razorpay: invalid Key ID / Key Secret");
            if (res.statusCode() >= 300) {
                String msg = json.path("error").path("description").asText("HTTP " + res.statusCode());
                log.warn("Razorpay {} {} failed: {}", method, path, msg);
                throw ApiException.badRequest("Razorpay: " + msg);
            }
            return json;
        } catch (ApiException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw ApiException.badRequest("Razorpay is not reachable, please try again");
        } catch (Exception e) {
            log.warn("Razorpay {} {} error: {}", method, path, e.getMessage());
            throw ApiException.badRequest("Razorpay is not reachable, please try again");
        }
    }
}
