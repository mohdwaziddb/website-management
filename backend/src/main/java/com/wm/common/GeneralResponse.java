package com.wm.common;

/** Har API ka common response: { success, message, data } */
public class GeneralResponse<T> {

    private Boolean success;

    private String message;

    private T data;

    public GeneralResponse() {
    }

    public GeneralResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public Boolean isSuccess() {
        return success;
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
