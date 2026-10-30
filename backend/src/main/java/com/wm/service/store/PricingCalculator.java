package com.wm.service.store;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Order ka hisaab — ek hi jagah (cart quote, checkout, tests). Koi DB nahi, sirf maths.
 * <ul>
 *   <li>subtotal = Σ price × qty</li>
 *   <li>discount = coupon (Percent: max_discount tak, Flat: subtotal se zyada nahi), lines me proportion se baanta</li>
 *   <li>GST har line par (discount ke baad): inclusive = price ke andar se nikala, exclusive = upar se joda</li>
 *   <li>shipping = flat, (subtotal − discount) ≥ free-above ho to 0</li>
 *   <li>total = subtotal − discount + (exclusive GST) + shipping + COD charge</li>
 * </ul>
 */
public final class PricingCalculator {
    static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private PricingCalculator() {
    }

    public record Line(long productId, Long variantId, String title, String variantTitle, String sku, String image,
                       BigDecimal unitPrice, int qty, int gstRate) {
    }

    /** type = "Percent" / "Flat" */
    public record Coupon(String code, String type, BigDecimal value, BigDecimal maxDiscount) {
    }

    public record Rules(boolean pricesIncludeTax, BigDecimal shippingFee, BigDecimal freeShippingAbove, BigDecimal codFee) {
    }

    public record PricedLine(Line line, BigDecimal lineTotal, BigDecimal discount, BigDecimal tax) {
    }

    public record Quote(List<PricedLine> lines, BigDecimal subtotal, BigDecimal discount, String couponCode, BigDecimal tax,
                        BigDecimal shipping, BigDecimal codFee, BigDecimal total, boolean pricesIncludeTax) {
    }

    public static Quote compute(List<Line> lines, Coupon coupon, Rules rules, boolean cod) {
        BigDecimal subtotal = BigDecimal.ZERO;
        for (Line l : lines) subtotal = subtotal.add(lineTotal(l));
        BigDecimal discount = discountFor(coupon, subtotal);

        // discount ko lines me baanto (aakhri line ko bacha hua, taaki jod exact rahe)
        List<PricedLine> priced = new ArrayList<>();
        BigDecimal left = discount;
        BigDecimal tax = BigDecimal.ZERO;
        for (int i = 0; i < lines.size(); i++) {
            Line l = lines.get(i);
            BigDecimal total = lineTotal(l);
            BigDecimal share = i == lines.size() - 1 ? left
                    : subtotal.signum() == 0 ? BigDecimal.ZERO : discount.multiply(total).divide(subtotal, 2, RoundingMode.HALF_UP);
            share = share.min(left).min(total);
            left = left.subtract(share);
            BigDecimal t = taxOn(total.subtract(share), l.gstRate(), rules.pricesIncludeTax());
            tax = tax.add(t);
            priced.add(new PricedLine(l, total, share, t));
        }

        BigDecimal items = subtotal.subtract(discount);
        boolean free = lines.isEmpty() || (rules.freeShippingAbove() != null && items.compareTo(rules.freeShippingAbove()) >= 0);
        BigDecimal shipping = free ? money(null) : money(rules.shippingFee());
        BigDecimal codFee = cod && !lines.isEmpty() ? money(rules.codFee()) : money(null);
        BigDecimal total = items.add(rules.pricesIncludeTax() ? BigDecimal.ZERO : tax).add(shipping).add(codFee);
        return new Quote(priced, money(subtotal), money(discount), discount.signum() > 0 ? coupon.code() : null, money(tax),
                shipping, codFee, money(total), rules.pricesIncludeTax());
    }

    public static BigDecimal discountFor(Coupon c, BigDecimal subtotal) {
        if (c == null || subtotal.signum() <= 0) return BigDecimal.ZERO.setScale(2);
        BigDecimal d;
        if ("Percent".equalsIgnoreCase(c.type())) {
            d = subtotal.multiply(c.value()).divide(HUNDRED, 2, RoundingMode.HALF_UP);
            if (c.maxDiscount() != null && c.maxDiscount().signum() > 0) d = d.min(c.maxDiscount());
        } else {
            d = c.value();
        }
        return money(d.min(subtotal).max(BigDecimal.ZERO));
    }

    /** inclusive: amount × r / (100 + r) · exclusive: amount × r / 100 */
    public static BigDecimal taxOn(BigDecimal amount, int rate, boolean inclusive) {
        if (rate <= 0 || amount.signum() <= 0) return BigDecimal.ZERO.setScale(2);
        BigDecimal r = BigDecimal.valueOf(rate);
        return inclusive ? amount.multiply(r).divide(HUNDRED.add(r), 2, RoundingMode.HALF_UP)
                : amount.multiply(r).divide(HUNDRED, 2, RoundingMode.HALF_UP);
    }

    /** Razorpay paise me leta hai */
    public static long toPaise(BigDecimal rupees) {
        return rupees.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
    }

    private static BigDecimal lineTotal(Line l) {
        return money(l.unitPrice().multiply(BigDecimal.valueOf(l.qty())));
    }

    static BigDecimal money(BigDecimal v) {
        return (v == null ? BigDecimal.ZERO : v).setScale(2, RoundingMode.HALF_UP);
    }
}
