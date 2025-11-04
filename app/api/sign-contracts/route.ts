import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

function generateContractHTML(contract: any, signeeName: string): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${contract.contract_title || 'Contract Agreement'}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #ffffff;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #C29307;
        }
        
        .company-name {
            font-size: 18px;
            font-weight: 700;
            color: #C29307;
            margin-bottom: 5px;
        }
        
        .document-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a365d;
            margin: 20px 0 10px 0;
        }
        
        .subtitle {
            font-size: 14px;
            color: #666;
            font-weight: 400;
        }
        
        .content-section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #C29307;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .contract-text {
            font-size: 14px;
            line-height: 1.8;
            color: #4a5568;
            white-space: pre-line;
            background: #fefcf5;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #C29307;
        }
        
        .signature-section {
            margin-top: 60px;
            padding: 30px;
            background: #fefcf5;
            border-radius: 10px;
            border: 1px solid #f0e6c3;
        }
        
        .signature-title {
            font-size: 16px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 25px;
            text-align: center;
        }
        
        .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .signature-box {
            padding: 20px;
        }
        
        .signature-line {
            border-top: 2px solid #C29307;
            margin-top: 60px;
            margin-bottom: 5px;
        }
        
        .signature-label {
            font-size: 12px;
            color: #C29307;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        
        .signature-name {
            font-size: 14px;
            font-weight: 500;
            color: #2d3748;
            margin: 5px 0;
        }
        
        .signature-date {
            font-size: 12px;
            color: #718096;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #718096;
            font-size: 12px;
        }
        
        .watermark {
            position: fixed;
            bottom: 20px;
            right: 20px;
            opacity: 0.1;
            font-size: 48px;
            color: #C29307;
            font-weight: bold;
            pointer-events: none;
        }
        
        .gold-accent {
            color: #C29307;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            .watermark {
                opacity: 0.05;
            }
        }
    </style>
</head>
<body>
    <div class="watermark">ZIDWELL</div>
    
    <div class="header">
        <div class="company-name">ZIDWELL CONTRACTS</div>
        <h1 class="document-title">${contract.contract_title || 'Contract Agreement'}</h1>
        <div class="subtitle">Legally Binding Agreement</div>
    </div>
    
    <div class="content-section">
        <div class="section-title">CONTRACT TERMS & CONDITIONS</div>
        <div class="contract-text">${contract.contract_text || 'No contract terms specified.'}</div>
    </div>
    
    <div class="signature-section">
        <div class="signature-title">IN WITNESS WHEREOF, the parties have executed this agreement:</div>
        
        <div class="signature-grid">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Signee Signature</div>
                <div class="signature-name">${signeeName}</div>
                <div class="signature-date">${currentDate}</div>
            </div>
            
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Company Representative</div>
                <div class="signature-name">${contract.initiator_name || 'Zidwell Contracts'}</div>
                <div class="signature-date">${currentDate}</div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <div style="font-size: 12px; color: #C29307; font-weight: 600;">
                Electronically signed via Zidwell Contracts Platform
            </div>
            <div style="font-size: 11px; color: #a0aec0; margin-top: 5px;">
                Document ID: ${contract.token || 'N/A'}
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>This document was generated electronically by Zidwell Contracts and is legally binding.</p>
        <p>Generated on ${currentDate}</p>
    </div>
</body>
</html>`;
}

async function generatePdfBuffer(contract: any, signeeName: string): Promise<Buffer> {
  let browser = null;
  
  try {
    let executablePath: string;
    let browserArgs: string[];

    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      // Use @sparticuz/chromium for production (Vercel)
      console.log('Using @sparticuz/chromium for production');
      executablePath = await chromium.executablePath();
      browserArgs = [...chromium.args, '--hide-scrollbars', '--disable-web-security'];
    } else {
      // Use local Chrome for development
      console.log('Using local Chrome for development');
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

    console.log('Launching browser with executable path:', executablePath);

    browser = await puppeteer.launch({
      executablePath,
      args: browserArgs,
      headless: true, // Always use headless mode
    });

    const page = await browser.newPage();
    
    // Generate HTML content
    const htmlContent = generateContractHTML(contract, signeeName);
    
    // Set the HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    console.log('PDF generated successfully, size:', pdf.length, 'bytes');

    return Buffer.from(pdf);

  } catch (error) {
    console.error('Error generating PDF with puppeteer:', error);
    
    // Fallback to external PDF service if puppeteer fails
    try {
      console.log('Trying external PDF service as fallback...');
      return await generatePdfWithExternalService(contract, signeeName);
    } catch (fallbackError) {
      console.error('External PDF service also failed:', fallbackError);
      throw new Error('PDF generation failed: ' + (error as Error).message);
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Fallback PDF generation using external service
async function generatePdfWithExternalService(contract: any, signeeName: string): Promise<Buffer> {
  const htmlContent = generateContractHTML(contract, signeeName);
  
  try {
    // Try HTML2PDF.app (free tier available)
    const response = await fetch('https://api.html2pdf.app/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        apiKey: process.env.HTML2PDF_API_KEY || 'demo',
      }),
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      console.log('PDF generated successfully with external service');
      return Buffer.from(arrayBuffer);
    } else {
      throw new Error(`External service returned ${response.status}`);
    }
  } catch (error) {
    console.error('External PDF service failed:', error);
    // Ultimate fallback - return HTML as text
    return Buffer.from(htmlContent);
  }
}

export async function POST(request: Request) {
  try {
    const { token, signeeEmail, signeeName, verificationCode } = await request.json();

    if (!token || !signeeEmail || !verificationCode) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get contract from Supabase
    const { data: contract, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !contract) {
      console.error("Contract not found:", error);
      return NextResponse.json(
        { message: "Contract not found" },
        { status: 404 }
      );
    }

    if (contract.signee_email !== signeeEmail) {
      return NextResponse.json(
        { message: "Email does not match the contract signee" },
        { status: 403 }
      );
    }

    if (contract.verification_code !== verificationCode) {
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 401 }
      );
    }

    // Update contract status
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        signee_name: signeeName,
        status: "signed",
        signed_at: new Date().toISOString(),
      })
      .eq("token", token);

    if (updateError) {
      console.error("Error updating contract:", updateError);
      return NextResponse.json(
        { message: "Failed to update contract status" },
        { status: 500 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generatePdfBuffer(contract, signeeName);

    // Determine file type and name
    const isPdf = pdfBuffer.toString('utf8', 0, 4) === '%PDF';
    const fileExtension = isPdf ? 'pdf' : 'html';
    const fileName = `signed-contract-${contract.contract_title ? contract.contract_title.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'contract'}.${fileExtension}`;

    // Send email with the signed contract
    await transporter.sendMail({
      from: `Zidwell Contracts <${process.env.EMAIL_USER}>`,
      to: `${contract.initiator_email}, ${signeeEmail}`,
      subject: `✓ Contract Signed: ${contract.contract_title || 'Contract Agreement'}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #C29307, #a57c06); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">✓ Contract Signed</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your contract has been successfully executed</p>
          </div>
          
          <div style="padding: 30px;">
            <div style="background: #fefcf5; padding: 20px; border-radius: 10px; border-left: 4px solid #C29307; margin-bottom: 25px;">
              <h2 style="color: #a57c06; margin: 0 0 10px 0;">${contract.contract_title || 'Contract Agreement'}</h2>
              <p style="margin: 0; color: #4a5568;">This contract has been officially signed and is now legally binding.</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
              <div style="background: #fefcf5; padding: 15px; border-radius: 8px; border: 1px solid #f0e6c3;">
                <div style="font-size: 12px; color: #C29307; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Signee</div>
                <div style="font-size: 16px; font-weight: 600; color: #2d3748;">${signeeName}</div>
              </div>
              
              <div style="background: #fefcf5; padding: 15px; border-radius: 8px; border: 1px solid #f0e6c3;">
                <div style="font-size: 12px; color: #C29307; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Date Signed</div>
                <div style="font-size: 16px; font-weight: 600; color: #2d3748;">${new Date().toLocaleDateString()}</div>
              </div>
            </div>
            
            <div style="background: #fefcf5; padding: 15px; border-radius: 8px; border: 1px solid #f0e6c3; margin-bottom: 25px;">
              <div style="font-size: 12px; color: #C29307; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Contract ID</div>
              <div style="font-size: 14px; font-family: monospace; color: #2d3748;">${contract.token}</div>
            </div>
            
            <div style="background: #f0fff4; padding: 15px; border-radius: 8px; border-left: 4px solid #38a169;">
              <p style="margin: 0; color: #2f855a; font-weight: 500;">
                📎 The signed contract ${isPdf ? 'PDF' : 'document'} is attached to this email. Please keep it for your records.
              </p>
            </div>
          </div>
          
          <div style="background: #fefcf5; padding: 20px; text-align: center; border-top: 1px solid #f0e6c3;">
            <p style="margin: 0; color: #C29307; font-size: 14px; font-weight: 600;">
              This is an automated message from Zidwell Contracts.
            </p>
            <p style="margin: 5px 0 0 0; color: #a57c06; font-size: 12px;">
              © ${new Date().getFullYear()} Zidwell Contracts. All rights reserved.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: isPdf ? "application/pdf" : "text/html",
        },
      ],
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Contract signed and emailed successfully",
        data: {
          contractTitle: contract.contract_title,
          signeeName: signeeName,
          signedAt: new Date().toISOString(),
          contractId: contract.token,
          documentType: isPdf ? 'PDF' : 'HTML'
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in sign-contracts:", error);
    
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to process contract signing",
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}