package com.wm.service.inbox;

import java.util.Map;

/** Website ke contact form aur newsletter — public sirf bhejta hai, admin "Enquiries" / "Newsletter Subscribers" me dekhta hai */
public interface InboxService {

    Map<String, Object> submitEnquiry(Map<String, Object> param, String ip);

    Map<String, Object> subscribe(Map<String, Object> param, String ip);
}
