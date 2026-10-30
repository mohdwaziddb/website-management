export type FieldType =
  | "TEXT"
  | "TEXTAREA"
  | "RICHTEXT"
  | "URL"
  | "IMAGE"
  | "FILE"
  | "NUMBER"
  | "DECIMAL"
  | "DATE"
  | "MONTH"
  | "BOOLEAN"
  | "REF"
  | "SELECT";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  listed: boolean;
  searchable: boolean;
  unique: boolean;
  ref: string | null;
  options: string[];
  help: string | null;
  /** NUMBER / DECIMAL ki minimum value (null = koi limit nahi) */
  min: number | null;
}

export interface ModuleDef {
  key: string;
  label: string;
  group: string;
  icon: string;
  titleField: string;
  publishable: boolean;
  sortable: boolean;
  fields: FieldDef[];
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export type Row = Record<string, unknown> & { id: number };

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "SUPER_ADMIN";
  scope: "TENANT" | "PLATFORM";
  tenant: string | null;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Tenant {
  id: number;
  code: string;
  subdomain: string | null;
  customDomain: string | null;
  name: string;
  dbName: string;
  contactEmail: string | null;
  active: boolean;
  createdOn: string;
}

export interface TenantInfo {
  code: string;
  subdomain: string | null;
  customDomain: string | null;
  name: string;
  logo: string | null;
  template: string;
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
