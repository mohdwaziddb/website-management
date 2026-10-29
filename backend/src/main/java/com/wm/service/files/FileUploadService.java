package com.wm.service.files;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import java.util.Map;

/** Upload: uploads/{code}/{yyyy}/{MM}/{uuid}.ext -> URL /files/{code}/... (har website ka alag folder) */
public interface FileUploadService {

    Map<String, Object> uploadFile(MultipartFile file) throws IOException;
}
