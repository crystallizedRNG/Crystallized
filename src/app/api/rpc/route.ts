import { NextResponse, type NextRequest } from "next/server";
import { executeRpc, hasHandler } from "@/server/rpc";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COOKIE = "crystallized_session";
const MAX_AGE = 60 * 60 * 24 * 60;

/** Простейшая защита от подбора паролей: не более 12 попыток входа/регистрации в минуту с одного адреса */
const attempts = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const list = (attempts.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  attempts.set(ip, list);
  if (attempts.size > 5000) for (const [k, v] of attempts) if (!v.some((t) => now - t < 60_000)) attempts.delete(k);
  return list.length > 12;
}

export async function POST(req: NextRequest) {
  let body: { fn?: unknown; args?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }
  if (!hasHandler(body.fn)) return NextResponse.json({ error: "Неизвестное действие." }, { status: 400 });
  const args = Array.isArray(body.args) ? body.args : [];

  if (body.fn === "login" || body.fn === "register") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (tooMany(ip)) {
      return NextResponse.json({ result: { ok: false, error: "Слишком много попыток. Подождите минуту." } });
    }
  }

  try {
    const token = req.cookies.get(COOKIE)?.value ?? null;
    const out = await executeRpc(body.fn, args, token);
    const res = NextResponse.json({ result: out.result === undefined ? null : out.result });
    if (typeof out.token === "string") {
      res.cookies.set(COOKIE, out.token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE });
    } else if (out.token === null) {
      res.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
    }
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    console.error("[rpc]", body.fn, e);
    return NextResponse.json({ error: "Ошибка сервера. Попробуйте ещё раз." }, { status: 500 });
  }
}
