-- Websites ki list. code = permanent id, db_name = website ka DB (koi prefix nahi, aam taur par code jaisa).
-- subdomain / custom_domain dono optional, kam se kam ek zaroori.
-- admin_username / admin_password = us website ka Super Admin login (website ke /admin par; client ko users list me nahi dikhta).
-- Nayi website: yahan row daalo + app restart -> DB, tables, super admin apne aap (TenantSchemaService.provision).
CREATE TABLE IF NOT EXISTS tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    subdomain VARCHAR(40) NULL UNIQUE,
    custom_domain VARCHAR(253) NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    db_name VARCHAR(64) NOT NULL UNIQUE,
    contact_email VARCHAR(200),
    admin_username VARCHAR(200) NULL,
    admin_password VARCHAR(100) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- super admin (platform admin) hata diya gaya
DROP TABLE IF EXISTS super_admins;
