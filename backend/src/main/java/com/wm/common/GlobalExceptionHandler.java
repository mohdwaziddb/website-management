package com.wm.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Poore project ki errors ek jagah. Controllers me try/catch nahi hota — service ApiException throw kare,
 * yahan se hamesha same shape aata hai: { success:false, message, data:null } + sahi HTTP status.
 * 4xx = user ki galti (message dikhao), 5xx = hamari galti (log karo, andar ki detail kabhi bahar nahi).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Service validation / not found / unauthorized — status aur message ApiException se */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<GeneralResponse<Object>> handleApi(ApiException e) {
        return body(e.getStatus(), e.getMessage());
    }

    /** Body JSON hi galat hai / missing */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<GeneralResponse<Object>> handleBadJson(HttpMessageNotReadableException e) {
        return body(HttpStatus.BAD_REQUEST, "Invalid request body");
    }

    /** /m/sliders/abc — id number nahi */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<GeneralResponse<Object>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return body(HttpStatus.BAD_REQUEST, "Invalid value for " + e.getName());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<GeneralResponse<Object>> handleMissingParam(MissingServletRequestParameterException e) {
        return body(HttpStatus.BAD_REQUEST, e.getParameterName() + " is required");
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<GeneralResponse<Object>> handleMissingPart(MissingServletRequestPartException e) {
        return body(HttpStatus.BAD_REQUEST, "File is required");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<GeneralResponse<Object>> handleTooLarge(MaxUploadSizeExceededException e) {
        return body(HttpStatus.PAYLOAD_TOO_LARGE, "File too large (max 25 MB)");
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<GeneralResponse<Object>> handleMultipart(MultipartException e) {
        return body(HttpStatus.BAD_REQUEST, "Invalid file upload");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<GeneralResponse<Object>> handleMethod(HttpRequestMethodNotSupportedException e) {
        return body(HttpStatus.METHOD_NOT_ALLOWED, "Method " + e.getMethod() + " not allowed");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<GeneralResponse<Object>> handleMediaType(HttpMediaTypeNotSupportedException e) {
        return body(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported content type");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<GeneralResponse<Object>> handleDenied(AccessDeniedException e) {
        return body(HttpStatus.FORBIDDEN, "Access denied");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<GeneralResponse<Object>> handleNoResource(NoResourceFoundException e) {
        return body(HttpStatus.NOT_FOUND, "Not found");
    }

    /** Unique key race (do log ek saath same email/slug) — service check ke baad bhi DB pakad leta hai */
    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<GeneralResponse<Object>> handleDuplicate(DuplicateKeyException e) {
        return body(HttpStatus.BAD_REQUEST, "This value already exists");
    }

    /** DB down / SQL error — detail sirf log me */
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<GeneralResponse<Object>> handleDatabase(DataAccessException e) {
        log.error("Database error", e);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Database error, please try again");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<GeneralResponse<Object>> handleOther(Exception e) {
        log.error("Unhandled error", e);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
    }

    private static ResponseEntity<GeneralResponse<Object>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new GeneralResponse<>(false, message, null));
    }
}
