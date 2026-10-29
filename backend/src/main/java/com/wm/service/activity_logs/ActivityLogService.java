package com.wm.service.activity_logs;

import com.wm.common.PageResult;

import java.util.Map;

/** Har create/update/delete ka log (reference ke saare "showlog" screens ki jagah ek common log). */
public interface ActivityLogService {

    void addLog(String module, Long recordId, String action, String summary);

    PageResult<Map<String, Object>> getLogs(Map<String, Object> param);
}
