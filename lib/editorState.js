"use client";

import { getSupabase } from "./supabase";
import { readSessionRaw, readLocalMirror, writeTransfer } from "./transfer";

// Resolve transfers and bookmarked /v2?id= links before the editor starts
// autosaving. Never replace another character's draft with a blank sheet.
export async function prepareEditorState() {
  const id = new URLSearchParams(window.location.search).get("id");
  let draft = null;
  for (const raw of [readSessionRaw(), readLocalMirror()]) {
    try {
      const data = JSON.parse(raw);
      if (data && typeof data === "object" && !Array.isArray(data) &&
          (!id || data.currentCharacterId === id)) {
        draft = data;
        break;
      }
    } catch {}
  }
  if (draft) {
    writeTransfer(draft);
    return;
  }
  if (!id) return;

  const db = getSupabase();
  if (!db) throw new Error("Supabase не настроен: невозможно загрузить анкету по ссылке");
  const { data, error } = await db.from("characters")
    .select("data, is_duo, duo_partner_data")
    .eq("id", id).single();
  if (error) throw error;
  const parse = (value) => typeof value === "string" ? JSON.parse(value) : value;
  const payload = { ...parse(data.data), currentCharacterId: id };
  if (data.is_duo && data.duo_partner_data) {
    const partner = parse(data.duo_partner_data);
    Object.assign(payload, {
      dualMode: true,
      fields2: partner.fields || {},
      customFields2: partner.customFields || [],
      hidden2: partner.hidden || [],
      fieldOrder2: partner.fieldOrder || [],
    });
  }
  writeTransfer(payload);
}
