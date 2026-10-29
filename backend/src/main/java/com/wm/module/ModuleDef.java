package com.wm.module;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Ek website module (Sliders, Pages, Gallery ...). Table + fields yahin se generate hote hain.
 * publishable = is_publish column (website par dikhe ya nahi), sortable = sort_order column.
 */
public record ModuleDef(
        String key,
        String label,
        String group,
        String icon,
        @JsonIgnore String table,
        String titleField,
        boolean publishable,
        boolean sortable,
        List<FieldDef> fields
) {
    /** Website type ke hisaab se naya naam (Services -> Courses) */
    public ModuleDef withLabel(String newLabel) {
        return new ModuleDef(key, newLabel, group, icon, table, titleField, publishable, sortable, fields);
    }

    public Optional<FieldDef> field(String name) {
        return fields.stream().filter(f -> f.name().equals(name)).findFirst();
    }

    public static Builder of(String key, String label, String group, String icon) {
        return new Builder(key, label, group, icon);
    }

    public static final class Builder {
        private final String key;
        private final String label;
        private final String group;
        private final String icon;
        private String table;
        private String titleField = "title";
        private boolean publishable;
        private boolean sortable;
        private final List<FieldDef> fields = new ArrayList<>();

        private Builder(String key, String label, String group, String icon) {
            this.key = key;
            this.label = label;
            this.group = group;
            this.icon = icon;
            this.table = key;
        }

        public Builder table(String table) { this.table = table; return this; }
        public Builder titleField(String f) { this.titleField = f; return this; }
        public Builder publishable() { this.publishable = true; return this; }
        public Builder sortable() { this.sortable = true; return this; }
        public Builder field(FieldDef.Builder f) { this.fields.add(f.build()); return this; }

        public ModuleDef build() {
            return new ModuleDef(key, label, group, icon, table, titleField, publishable, sortable, List.copyOf(fields));
        }
    }
}
