"use client";

import { PageHeader } from "@/components/admin/primitives";
import { useAdmin } from "@/components/admin/session";
import { SettingsForm } from "@/components/admin/settings-form";

export default function SettingsPage() {
  const { data } = useAdmin();
  if (!data) return null;
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Store settings"
        description="The current order run and its code, payment instructions, the store name, and whether ordering is open. The admin login is set in the Apps Script project."
      />
      <SettingsForm settings={data.settings} runs={data.runs} orders={data.orders} />
    </>
  );
}
