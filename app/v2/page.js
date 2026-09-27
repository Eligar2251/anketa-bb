import { redirect } from "next/navigation";

// Старые ссылки не должны открывать снятую версию. Остаётся обычная анкета.
export const dynamic = "force-dynamic";

export default function LegacyEditorPage({ searchParams }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams || {})) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item != null) query.append(key, item);
    }
  }
  redirect(`/editor${query.size ? `?${query}` : ""}`);
}
