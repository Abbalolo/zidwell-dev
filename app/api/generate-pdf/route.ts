import puppeteer from "puppeteer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { html } = await req.json();

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-api", "--disable-setuid-api"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();

    // Convert the buffer to a readable stream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(pdfBuffer);
        controller.close();
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=invoice.pdf",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
