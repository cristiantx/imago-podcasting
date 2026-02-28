import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, details?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(details ?? {}) }, { status });
}

export function parseJsonSafely<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}
