import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://panel.vgcadvisors.com/api/v1/banners",
      { cache: "no-store" }
    );

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Banner fetch failed" },
      { status: 500 }
    );
  }
}