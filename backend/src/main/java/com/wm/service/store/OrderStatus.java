package com.wm.service.store;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Order ka safar:  PENDING_PAYMENT → PLACED → CONFIRMED → PACKED → SHIPPED → DELIVERED (→ RETURNED)
 * Beech me kabhi bhi CANCELLED (ship hone se pehle). Galat jump (PLACED → DELIVERED) allowed nahi.
 */
public final class OrderStatus {
    public static final String PENDING_PAYMENT = "PENDING_PAYMENT";
    public static final String PLACED = "PLACED";
    public static final String CONFIRMED = "CONFIRMED";
    public static final String PACKED = "PACKED";
    public static final String SHIPPED = "SHIPPED";
    public static final String DELIVERED = "DELIVERED";
    public static final String CANCELLED = "CANCELLED";
    public static final String RETURNED = "RETURNED";

    public static final List<String> ALL = List.of(PENDING_PAYMENT, PLACED, CONFIRMED, PACKED, SHIPPED, DELIVERED, CANCELLED, RETURNED);

    public static final String PAY_PENDING = "PENDING";
    public static final String PAY_PAID = "PAID";
    public static final String PAY_FAILED = "FAILED";
    public static final String PAY_REFUNDED = "REFUNDED";

    public static final String COD = "COD";
    public static final String RAZORPAY = "RAZORPAY";

    private static final Map<String, Set<String>> NEXT = Map.of(
            PENDING_PAYMENT, Set.of(PLACED, CANCELLED),
            PLACED, Set.of(CONFIRMED, CANCELLED),
            CONFIRMED, Set.of(PACKED, CANCELLED),
            PACKED, Set.of(SHIPPED, CANCELLED),
            SHIPPED, Set.of(DELIVERED, RETURNED),
            DELIVERED, Set.of(RETURNED),
            CANCELLED, Set.of(),
            RETURNED, Set.of());

    /** Customer khud cancel kar sake (pack hone se pehle) */
    public static final Set<String> CUSTOMER_CANCELLABLE = Set.of(PENDING_PAYMENT, PLACED, CONFIRMED);

    /** Inme stock wapas (restock) */
    public static final Set<String> RESTOCK = Set.of(CANCELLED, RETURNED);

    private OrderStatus() {
    }

    public static boolean canMove(String from, String to) {
        return NEXT.getOrDefault(from, Set.of()).contains(to);
    }

    public static Set<String> nextOf(String from) {
        return NEXT.getOrDefault(from, Set.of());
    }

    public static String label(String status) {
        return switch (status) {
            case PENDING_PAYMENT -> "Awaiting payment";
            case PLACED -> "Order placed";
            case CONFIRMED -> "Confirmed";
            case PACKED -> "Packed";
            case SHIPPED -> "Shipped";
            case DELIVERED -> "Delivered";
            case CANCELLED -> "Cancelled";
            case RETURNED -> "Returned";
            default -> status;
        };
    }
}
