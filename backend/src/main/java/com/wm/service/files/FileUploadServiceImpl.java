package com.wm.service.files;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.config.AppProperties;
import com.wm.tenant.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** SVG/HTML allowed nahi (script chal sakti hai). */
@Service
public class FileUploadServiceImpl implements FileUploadService {
    private static final Set<String> ALLOWED = Set.of(
            "jpg", "jpeg", "png", "gif", "webp",
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "zip",
            "mp4", "mp3");

    @Autowired
    private AppProperties props;

    @Override
    public Map<String, Object> uploadFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("File is empty");
        String original = file.getOriginalFilename() == null ? "file" : Path.of(file.getOriginalFilename()).getFileName().toString();
        int dot = original.lastIndexOf('.');
        String ext = dot < 0 ? "" : original.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED.contains(ext)) throw ApiException.badRequest("File type ." + ext + " not allowed");

        Path root = Path.of(props.uploadDir()).toAbsolutePath().normalize();
        LocalDate today = LocalDate.now();
        String rel = TenantContext.require().code() + "/" + today.getYear() + "/" + String.format("%02d", today.getMonthValue())
                + "/" + UUID.randomUUID() + "." + ext;
        Path target = root.resolve(rel).normalize();
        if (!target.startsWith(root)) throw ApiException.badRequest("Invalid path");
        Files.createDirectories(target.getParent());
        file.transferTo(target);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("url", "/files/" + rel);
        out.put("name", DataTypeUtility.stringValue(original));
        out.put("size", file.getSize());
        return out;
    }
}
