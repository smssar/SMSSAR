"use client";

import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/locales";
import { Search, X } from "lucide-react";
import { useState } from "react";

type RefundFiltersProps = {
  locale: Locale;
};

export function RefundFilters({ locale }: RefundFiltersProps) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [paymentId, setPaymentId] = useState(
    searchParams.get("paymentId") || "",
  );
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (email) params.append("email", email);
    if (paymentId) params.append("paymentId", paymentId);
    if (status) params.append("status", status);
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    window.location.href = `?${params.toString()}`;
  };

  const handleClear = () => {
    window.location.href = "?";
  };

  const hasFilters = email || paymentId || status || dateFrom || dateTo;

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Email Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {locale === "ar"
                  ? "البريد الإلكتروني"
                  : locale === "fr"
                    ? "Email"
                    : "Email"}
              </label>
              <Input
                type="email"
                placeholder={
                  locale === "ar"
                    ? "ابحث بالبريد"
                    : locale === "fr"
                      ? "Rechercher par email"
                      : "Search by email"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Payment ID Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {locale === "ar"
                  ? "رقم الدفعة"
                  : locale === "fr"
                    ? "ID de paiement"
                    : "Payment ID"}
              </label>
              <Input
                placeholder={
                  locale === "ar"
                    ? "ابحث برقم الدفعة"
                    : locale === "fr"
                      ? "Rechercher par ID"
                      : "Search by ID"
                }
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {locale === "ar"
                  ? "الحالة"
                  : locale === "fr"
                    ? "Statut"
                    : "Status"}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">
                  {locale === "ar" ? "الكل" : locale === "fr" ? "Tous" : "All"}
                </option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="DISABLED">DISABLED</option>
                <option value="SCHEDULED">SCHEDULED</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {locale === "ar"
                  ? "من التاريخ"
                  : locale === "fr"
                    ? "À partir du"
                    : "From date"}
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {locale === "ar"
                  ? "إلى التاريخ"
                  : locale === "fr"
                    ? "Jusqu'au"
                    : "To date"}
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="gap-2">
              <Search className="h-4 w-4" />
              {locale === "ar"
                ? "بحث"
                : locale === "fr"
                  ? "Rechercher"
                  : "Search"}
            </Button>
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                {locale === "ar"
                  ? "مسح"
                  : locale === "fr"
                    ? "Effacer"
                    : "Clear"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
