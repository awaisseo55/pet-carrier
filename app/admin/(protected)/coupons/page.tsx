import { CouponList } from "@/components/admin/coupon-list";
import { NewCouponForm } from "@/components/admin/new-coupon-form";
import { getAllCoupons } from "@/lib/coupons";

export default async function AdminCouponsPage() {
  const coupons = await getAllCoupons();

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Coupons</h1>
      <p className="mt-1 text-gray-500">{coupons.length} coupon(s). Applied at cart or checkout.</p>

      <div className="mt-6">
        <NewCouponForm />
      </div>

      <div className="mt-6">
        <CouponList coupons={coupons} />
      </div>
    </div>
  );
}
