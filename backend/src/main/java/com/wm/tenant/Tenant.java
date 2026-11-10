package com.wm.tenant;

/**
 * code = permanent id (DB naam + JWT me), subdomain = code.yourdomain.com (optional),
 * customDomain = client ka apna domain jaise xyz.com (optional, bina "www.").
 * adminUsername / adminPassword = website ka Super Admin login (master DB se; JSON me kabhi nahi bhejna).
 */
public record Tenant(long id, String code, String subdomain, String customDomain, String name, String dbName,
                     String contactEmail, boolean active, String createdOn, String adminUsername, String adminPassword) {

    /** Login value super admin ka username hai? */
    public boolean isSuperAdmin(String login) {
        return adminUsername != null && adminUsername.trim().equalsIgnoreCase(login == null ? "" : login.trim());
    }

    /** users.email me super admin isi roop me save hota hai */
    public String superAdminLogin() {
        return adminUsername == null ? null : adminUsername.trim().toLowerCase(java.util.Locale.ROOT);
    }
}
