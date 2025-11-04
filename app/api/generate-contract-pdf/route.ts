import { NextRequest, NextResponse } from "next/server";
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import path from "path";
import fs from "fs";

function getLogoBase64() {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const imageBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error loading logo:", error);
    return "";
  }
}

function getWatermarkBase64() {
  try {
    const watermarkPath = path.join(
      process.cwd(),
      "public",
      "zidwell-watermark.png"
    );
    const imageBuffer = fs.readFileSync(watermarkPath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error loading watermark:", error);
    return "";
  }
}

function generateContractHTML(
  contract: any,
  base64Logo: string,
  base64Watermark: string
) {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12pt;
            color: #333;
            padding: 20px;
            margin: 0;
            background-image: url('${base64Watermark}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }
          .logo {
            display: block;
            max-width: 70px;
            margin: 0 auto 30px;
          }
          h1 {
            font-size: 24px;
            text-align: center;
            margin-bottom: 20px;
            color: #1a237e;
          }
          .content {
            line-height: 1.6;
            white-space: pre-wrap;
          }
          .signatures {
            margin-top: 10px;  
            display: flex;
            gap: 20px;
            justify-content: start;
            align-items: center;
            font-size: 16px;
          }
          footer {
            font-size: 10pt;
            color: #999;
            text-align: center;
            margin-top: 50px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="logo" src="${base64Logo}" alt="Zidwell Logo" />
          <h1>${contract.contract_title || "Contract Agreement"}</h1>
          <div class="content">${(contract.contract_text || "").replace(
            /\n/g,
            "<br>"
          )}</div>

          <div class="signatures">
            <p class="">Signee Signature:  ${
              contract.signee_name || "Contract Signature"
            }</p>
            <p class="">
              Signee Date: ${new Date(contract.signed_at).toLocaleDateString()}
            </p>
          </div>
          <footer>
            Zidwell Contracts &copy; ${new Date().getFullYear()} – Confidential
          </footer>
        </div>
      </body>
    </html>
  `;
}

async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  let browser = null;
  
  try {
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

    console.log('Launching browser for PDF generation with executable path:', executablePath);

    browser = await puppeteer.launch({
      executablePath,
      args: browserArgs,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    console.log('PDF generated successfully, size:', pdf.length, 'bytes');
    return Buffer.from(pdf);

  } catch (error) {
    console.error('Error generating PDF with puppeteer:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const contract = await request.json();
    console.log("Generating PDF for contract:", contract.contract_title);
    
    const base64Logo = getLogoBase64();
    const base64Watermark = getWatermarkBase64();

    const html = generateContractHTML(contract, base64Logo, base64Watermark);
    const pdfBuffer = await generatePdfBufferFromHtml(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=contract.pdf",
      },
    });
  } catch (error) {
    console.error("Error generating contract PDF:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}