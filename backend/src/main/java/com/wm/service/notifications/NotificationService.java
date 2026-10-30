package com.wm.service.notifications;

import java.util.Map;

/** Admin top bar ki bell: nayi enquiries, ship karne wale orders, pending reviews, low stock */
public interface NotificationService {

    Map<String, Object> getNotifications();
}
