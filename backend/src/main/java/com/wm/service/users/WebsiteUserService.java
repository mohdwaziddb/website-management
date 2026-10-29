package com.wm.service.users;

import java.util.List;
import java.util.Map;

/** Website admin panel ke users (sirf ADMIN role manage kar sakta hai). */
public interface WebsiteUserService {

    List<Map<String, Object>> getUsers();

    Map<String, Object> addUser(Map<String, Object> param);

    Map<String, Object> updateUser(long id, Map<String, Object> param);

    void deleteUser(long id);
}
