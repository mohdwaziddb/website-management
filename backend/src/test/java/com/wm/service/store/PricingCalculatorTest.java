package com.wm.service.store;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PricingCalculatorTest {
    private static final PricingCalculator.Rules INCLUSIVE = new PricingCalculator.Rules(true, bd("49"), bd("999"), bd("30"));
    private static final PricingCalculator.Rules EXCLUSIVE = new PricingCalculator.Rules(false, bd("0"), null, bd("0"));

    private static BigDecimal bd(String s) {
        return new BigDecimal(s);
    }

    private static PricingCalculator.Line line(String price, int qty, int gst) {
        return new PricingCalculator.Line(1, null, "Item", null, null, null, bd(price), qty, gst);
    }

    @Test
    void inclusiveGstAndShipping() {
        PricingCalculator.Quote q = PricingCalculator.compute(List.of(line("499", 2, 5)), null, INCLUSIVE, false);
        assertEquals(bd("998.00"), q.subtotal());
        assertEquals(bd("47.52"), q.tax()); // 998 × 5 / 105
        assertEquals(bd("49.00"), q.shipping()); // 998 < 999
        assertEquals(bd("1047.00"), q.total()); // GST price ke andar hai, upar nahi juda
    }

    @Test
    void freeShippingAboveThresholdAndCodFee() {
        PricingCalculator.Quote q = PricingCalculator.compute(List.of(line("500", 2, 18)), null, INCLUSIVE, true);
        assertEquals(bd("0.00"), q.shipping());
        assertEquals(bd("30.00"), q.codFee());
        assertEquals(bd("152.54"), q.tax()); // 1000 × 18 / 118
        assertEquals(bd("1030.00"), q.total());
    }

    @Test
    void exclusiveGstIsAdded() {
        PricingCalculator.Quote q = PricingCalculator.compute(List.of(line("1000", 1, 18)), null, EXCLUSIVE, false);
        assertEquals(bd("180.00"), q.tax());
        assertEquals(bd("1180.00"), q.total());
    }

    @Test
    void percentCouponIsCappedAndShippingUsesDiscountedAmount() {
        PricingCalculator.Coupon c = new PricingCalculator.Coupon("WELCOME10", "Percent", bd("10"), bd("300"));
        PricingCalculator.Quote big = PricingCalculator.compute(List.of(line("5000", 1, 0)), c, INCLUSIVE, false);
        assertEquals(bd("300.00"), big.discount());
        assertEquals("WELCOME10", big.couponCode());

        // 1050 − 105 = 945 < 999 => shipping lagega
        PricingCalculator.Quote q = PricingCalculator.compute(List.of(line("1050", 1, 0)), c, INCLUSIVE, false);
        assertEquals(bd("105.00"), q.discount());
        assertEquals(bd("49.00"), q.shipping());
        assertEquals(bd("994.00"), q.total());
    }

    @Test
    void flatCouponNeverMoreThanSubtotal() {
        PricingCalculator.Coupon c = new PricingCalculator.Coupon("FLAT500", "Flat", bd("500"), null);
        PricingCalculator.Quote q = PricingCalculator.compute(List.of(line("300", 1, 0)), c, EXCLUSIVE, false);
        assertEquals(bd("300.00"), q.discount());
        assertEquals(bd("0.00"), q.total());
    }

    @Test
    void discountSharesAddUpExactly() {
        PricingCalculator.Coupon c = new PricingCalculator.Coupon("X", "Flat", bd("100"), null);
        PricingCalculator.Quote q = PricingCalculator.compute(List.of(line("333.33", 1, 5), line("333.33", 1, 12), line("333.34", 1, 18)), c, INCLUSIVE, false);
        BigDecimal shares = q.lines().stream().map(PricingCalculator.PricedLine::discount).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(bd("100.00"), shares);
        BigDecimal tax = q.lines().stream().map(PricingCalculator.PricedLine::tax).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(q.tax(), tax);
    }

    @Test
    void emptyCartIsZero() {
        PricingCalculator.Quote q = PricingCalculator.compute(List.of(), null, INCLUSIVE, true);
        assertEquals(bd("0.00"), q.total());
        assertEquals(bd("0.00"), q.shipping());
    }

    @Test
    void paise() {
        assertEquals(104750, PricingCalculator.toPaise(bd("1047.5")));
        assertEquals(1, PricingCalculator.toPaise(bd("0.01")));
    }
}
