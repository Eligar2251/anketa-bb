import { redirect } from "next/navigation";

// Query-dependent redirects must not be frozen during static generation.
export const dynamic = "force-dynamic";

// Keep old bookmarks working, but never render the retired coat-of-arms editor.
export default function LegacyEditorPage({ searchParams }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams || {})) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item != null) query.append(key, item);
    }
  }
  redirect(`/editor${query.size ? `?${query}` : ""}`);
}
