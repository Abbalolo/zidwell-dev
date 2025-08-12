import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

export async function GET() {
  try {
    const feed = await parser.parseURL("https://medium.com/feed/@coachattah");
    return NextResponse.json(feed.items); // You can customize what to return
  } catch (error) {
    console.error("❌ Failed to fetch Medium feed:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
