-- code = tenant ki permanent id (DB naam wm_t_<code>). subdomain / custom_domain dono optional, kam se kam ek zaroori.
CREATE TABLE IF NOT EXISTS tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    subdomain VARCHAR(40) NULL UNIQUE,
    custom_domain VARCHAR(253) NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    db_name VARCHAR(64) NOT NULL UNIQUE,
    contact_email VARCHAR(200),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS super_admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    token_version INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
