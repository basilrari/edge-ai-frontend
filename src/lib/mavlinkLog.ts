import type { MavlinkLogEntry } from "../components/types";

type RawMavlink = MavlinkLogEntry & {
  name?: string;
  fields?: string;
  sys_id?: number;
  comp_id?: number;
};

export function normalizeMavlinkEntry(raw: RawMavlink): MavlinkLogEntry {
  if (raw.msg_name != null && raw.value != null && raw.msg_id != null) {
    return {
      ts_ms: raw.ts_ms,
      msg_id: raw.msg_id,
      msg_name: raw.msg_name,
      value: String(raw.value),
    };
  }
  const msg_name = raw.msg_name ?? raw.name ?? "UNKNOWN";
  let msg_id = raw.msg_id ?? 0;
  let value = raw.value ?? "";
  if (!value && raw.fields) {
    try {
      const fields = JSON.parse(raw.fields) as Record<string, unknown>;
      const mid = fields.message_id ?? fields.msg_id;
      if (mid != null) msg_id = Number(mid);
      const parts: string[] = [];
      for (const [k, v] of Object.entries(fields)) {
        if (k === "message_id" || k === "message_name" || k === "msg_id") continue;
        parts.push(`${k}=${v}`);
      }
      value = parts.length ? parts.join(" ") : raw.fields;
    } catch {
      value = raw.fields;
    }
  }
  return { ts_ms: raw.ts_ms, msg_id, msg_name, value: String(value) };
}

export function normalizeMavlinkList(entries: RawMavlink[]): MavlinkLogEntry[] {
  return entries.map(normalizeMavlinkEntry);
}
