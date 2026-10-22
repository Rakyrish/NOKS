import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const expected = process.env.INTERNAL_API_TOKEN;
  const actual = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !actual || Buffer.byteLength(expected) !== Buffer.byteLength(actual)
      || !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  revalidateTag("cms");
  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: true });
}
