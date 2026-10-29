package com.wm.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

/**
 * Controllers ke success responses. Errors yahan nahi banti — service ApiException throw karti hai
 * aur GlobalExceptionHandler use { success:false, message } me badalta hai.
 */
@Component
public class ResponseFactory {

    public ResponseEntity<?> success(Object data) {
        return new ResponseEntity<>(new GeneralResponse<>(true, "Successfully", data), HttpStatus.OK);
    }

    public ResponseEntity<?> successMessage(String message) {
        return new ResponseEntity<>(new GeneralResponse<>(true, message, null), HttpStatus.OK);
    }
}
