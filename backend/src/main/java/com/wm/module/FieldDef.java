package com.wm.module;

import java.util.List;

/**
 * Ek module ka ek column. name = DB column name (sirf registry se aata hai, user input se kabhi nahi).
 */
public record FieldDef(
        String name,
        String label,
        FieldType type,
        boolean required,
        boolean listed,
        boolean searchable,
        boolean unique,
        String ref,
        List<String> options,
        String help
) {
    public static Builder of(String name, String label, FieldType type) {
        return new Builder(name, label, type);
    }

    public static final class Builder {
        private final String name;
        private final String label;
        private final FieldType type;
        private boolean required;
        private boolean listed;
        private boolean searchable;
        private boolean unique;
        private String ref;
        private List<String> options = List.of();
        private String help;

        private Builder(String name, String label, FieldType type) {
            this.name = name;
            this.label = label;
            this.type = type;
        }

        public Builder required() { this.required = true; return this; }
        public Builder listed() { this.listed = true; return this; }
        public Builder searchable() { this.searchable = true; return this; }
        public Builder unique() { this.unique = true; return this; }
        public Builder ref(String module) { this.ref = module; return this; }
        public Builder options(String... opts) { this.options = List.of(opts); return this; }
        public Builder help(String text) { this.help = text; return this; }

        public FieldDef build() {
            return new FieldDef(name, label, type, required, listed, searchable, unique, ref, options, help);
        }
    }
}
