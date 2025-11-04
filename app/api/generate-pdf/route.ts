import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let browser = null;
  
  try {
    const { html } = await req.json();

    let executablePath: string;
    let browserArgs: string[];

    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      // Use @sparticuz/chromium for production (Vercel)
      console.log('Using @sparticuz/chromium for production PDF generation');
      executablePath = await chromium.executablePath();
      browserArgs = [...chromium.args, '--hide-scrollbars', '--disable-web-security'];
    } else {
      // Use local Chrome for development
      console.log('Using local Chrome for development PDF generation');
      executablePath = process.env.CHROME_PATH || 
        (process.platform === 'win32' 
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : '/usr/bin/google-chrome');
      
      browserArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ];
    }

    console.log('Launching browser for PDF generation');

    browser = await puppeteer.launch({
      executablePath,
      args: browserArgs,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ 
      format: "A4", 
      printBackground: true 
    });

    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

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
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}