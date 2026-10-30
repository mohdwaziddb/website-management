package com.wm.service.activity_logs;

import com.wm.common.DataTypeUtility;
import com.wm.common.PageResult;
import com.wm.security.AuthPrincipal;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ActivityLogServiceImpl implements ActivityLogService {

    @Autowired
    private TenantDataSources ds;

    @Override
    public void addLog(String module, Long recordId, String action, String summary) {
        // website ka visitor (contact form) / customer bhi log kar sakta hai — admin na ho to naam "Website visitor"
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        AuthPrincipal p = auth != null && auth.getPrincipal() instanceof AuthPrincipal ap ? ap : null;
        ds.current().update("INSERT INTO activity_logs (module, record_id, action, summary, user_id, user_name, created_on) " +
                "VALUES (?,?,?,?,?,?,NOW())", module, recordId, action, summary,
                p == null || AuthPrincipal.SCOPE_CUSTOMER.equals(p.scope()) ? null : p.userId(),
                p == null ? "Website visitor" : AuthPrincipal.SCOPE_CUSTOMER.equals(p.scope()) ? p.name() + " (customer)" : p.name());
    }

    @Override
    public PageResult<Map<String, Object>> getLogs(Map<String, Object> param) {
        String module = DataTypeUtility.stringNullValue(param.get("module"));
        Long recordId = DataTypeUtility.getForeignKeyValue(param.get("recordId"));
        int page = Math.max(DataTypeUtility.integerValue(param.get("page"), 1), 1);
        int size = Math.min(Math.max(DataTypeUtility.integerValue(param.get("size"), 20), 1), 100);

        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> args = new ArrayList<>();
        if (module != null) {
            where.append(" AND module = ?");
            args.add(module);
        }
        if (recordId != null) {
            where.append(" AND record_id = ?");
            args.add(recordId);
        }
        String action = DataTypeUtility.stringNullValue(param.get("action"));
        if (action != null) {
            where.append(" AND action = ?");
            args.add(action.toUpperCase(java.util.Locale.ROOT));
        }
        // kya badla / kisne badla — dono me dhoondo
        String q = DataTypeUtility.stringNullValue(param.get("q"));
        if (q != null) {
            String like = "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            where.append(" AND (summary LIKE ? OR user_name LIKE ?)");
            args.add(like);
            args.add(like);
        }
        long total = ds.current().queryForObject("SELECT COUNT(*) FROM activity_logs" + where, Long.class, args.toArray());
        args.add(size);
        args.add((long) (page - 1) * size);
        List<Map<String, Object>> items = ds.current().queryForList(
                "SELECT * FROM activity_logs" + where + " ORDER BY id DESC LIMIT ? OFFSET ?", args.toArray());
        items.forEach(row -> row.replaceAll((k, v) -> DataTypeUtility.getJsonValue(v)));
        return new PageResult<>(items, total, page, size);
    }
}
