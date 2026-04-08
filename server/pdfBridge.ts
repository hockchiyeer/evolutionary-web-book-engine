import puppeteer from 'puppeteer';

export async function generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // needed for many environments
    });

    const page = await browser.newPage();

    await page.setContent(html, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
    });

    // Wait for fonts/images
    await page.evaluateHandle('document.fonts.ready');

    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
    });

    await browser.close();

    return pdf;
}