import type { WebBook } from '../types';

function getWebBookElement(): HTMLElement {
  const element = document.querySelector('.web-book-container') as HTMLElement | null;
  if (!element) {
    throw new Error('No rendered Web-book was found to export.');
  }
  return element;
}

function formatSourceLink(source: string | { title: string; url: string }): string {
  return typeof source === 'string' ? source : `${source.title} - ${source.url}`;
}


function prepareWordFooterForExport(root: HTMLElement): void {
  const footerSection = root.querySelector<HTMLElement>('[data-pdf-page-kind="footer"]');
  if (!footerSection) return;

  footerSection.style.padding = '40px 40px 28px';
  footerSection.style.minHeight = '170px';
  footerSection.style.display = 'flex';
  footerSection.style.flexDirection = 'column';
  footerSection.style.justifyContent = 'space-between';
  footerSection.style.gap = '16px';

  const footerRow = footerSection.firstElementChild as HTMLElement | null;
  const footerPageNumber = footerSection.lastElementChild as HTMLElement | null;
  const footerMeta = footerRow?.firstElementChild as HTMLElement | null;
  const footerLink = footerRow?.querySelector<HTMLElement>('a[href="#top"]');

  if (footerRow && footerMeta && footerLink) {
    const table = document.createElement('table');
    table.setAttribute('role', 'presentation');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.borderSpacing = '0';

    const row = document.createElement('tr');
    const leftCell = document.createElement('td');
    const rightCell = document.createElement('td');

    leftCell.style.padding = '0';
    leftCell.style.verticalAlign = 'bottom';
    rightCell.style.padding = '0';
    rightCell.style.verticalAlign = 'bottom';
    rightCell.style.textAlign = 'right';
    rightCell.style.whiteSpace = 'nowrap';

    footerLink.style.display = 'inline-block';
    footerLink.style.fontWeight = '700';
    footerLink.style.letterSpacing = '0.12em';
    footerLink.style.textTransform = 'uppercase';

    leftCell.appendChild(footerMeta);
    rightCell.appendChild(footerLink);
    row.append(leftCell, rightCell);
    table.appendChild(row);
    footerRow.replaceWith(table);
  }

  if (footerPageNumber) {
    footerPageNumber.style.marginTop = '0';
    footerPageNumber.style.textAlign = 'left';
  }
}


export async function exportWebBookToTxt(webBook: WebBook): Promise<void> {
  let text = `${webBook.topic.toUpperCase()}\n`;
  text += `Generated on: ${new Date(webBook.timestamp).toLocaleString()}\n\n`;

  webBook.chapters.forEach((chapter, index) => {
    text += `CHAPTER ${index + 1}: ${chapter.title}\n`;
    text += `${'='.repeat(chapter.title.length + 11)}\n\n`;
    text += `${chapter.content}\n\n`;
    text += `VISUAL CONCEPT: ${chapter.visualSeed}\n\n`;
    text += 'CORE CONCEPTS:\n';
    chapter.definitions.forEach((definition) => {
      text += `- ${definition.term}: ${definition.description}\n`;
    });
    text += '\nSUB-TOPICS:\n';
    chapter.subTopics.forEach((subTopic) => {
      text += `- ${subTopic.title}: ${subTopic.summary}\n`;
    });
    text += '\nSOURCES:\n';
    chapter.sourceUrls.forEach((sourceUrl) => {
      text += `- ${formatSourceLink(sourceUrl)}\n`;
    });
    text += '\n\n';
  });

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${webBook.topic.replace(/\s+/g, '_')}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportWebBookToHtml(webBook: WebBook): Promise<void> {
  const htmlContent = getWebBookElement().outerHTML;

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${webBook.topic}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
      <style>
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background: #E4E3E0; padding: 40px 16px; margin: 0; overflow-x: hidden; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        * { word-break: break-word; overflow-wrap: break-word; box-sizing: border-box; }
        a { color: inherit; }
        .web-book-container { width: 100%; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; }
        .web-book-page { background: white; border: 1px solid #141414; box-shadow: 12px 12px 0 rgba(20, 20, 20, 0.12); overflow: hidden; }
        @media print {
          body { background: white; padding: 0; overflow: visible !important; }
          .web-book-container { max-width: none; gap: 0; overflow: visible !important; }
          .web-book-page { box-shadow: none; break-after: page; page-break-after: always; overflow: visible !important; }
          .web-book-page:last-child { break-after: auto; page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${webBook.topic.replace(/\s+/g, '_')}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportWebBookToWord(webBook: WebBook): Promise<void> {
  const element = getWebBookElement();
  const clone = element.cloneNode(true) as HTMLElement;

  clone.querySelectorAll('button, .print\\:hidden, [data-html2canvas-ignore]').forEach((node) => node.remove());

  const images = clone.querySelectorAll('img');
  for (const image of Array.from(images)) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        tempImg.onload = resolve;
        tempImg.onerror = reject;
        tempImg.src = image.src;
      });

      canvas.width = tempImg.width;
      canvas.height = tempImg.height;
      ctx?.drawImage(tempImg, 0, 0);
      image.src = canvas.toDataURL('image/jpeg', 0.8);
      image.style.filter = 'none';
      image.className = image.className.replace(/grayscale|hover:grayscale-0/g, '');
    } catch (error) {
      console.error('Failed to convert image to base64 for Word export', error);
      try {
        const response = await fetch(image.src, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          image.src = base64;
        }
      } catch (fallbackError) {
        console.error('Fetch fallback also failed', fallbackError);
      }
    }

    image.style.maxWidth = '100%';
    image.style.height = 'auto';
    image.style.display = 'block';
    image.style.margin = '20px auto';
  }

  clone.querySelectorAll('[id]').forEach((node) => {
    const id = node.getAttribute('id');
    if (!id) return;

    const anchor = document.createElement('a');
    anchor.setAttribute('name', id);
    node.prepend(anchor);
  });

  if (!clone.querySelector('a[name="top"]')) {
    const topAnchor = document.createElement('a');
    topAnchor.setAttribute('name', 'top');
    clone.prepend(topAnchor);
  }

  prepareWordFooterForExport(clone);

  const htmlContent = clone.outerHTML;
  const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
    "xmlns:w='urn:schemas-microsoft-com:office:word' " +
    "xmlns='http://www.w3.org/TR/REC-html40'>" +
    "<head><meta charset='utf-8'><title>WebBook Export</title>" +
    "<style>" +
    "body { font-family: 'Arial', sans-serif; } " +
    "img { max-width: 100%; height: auto; display: block; margin: 20px auto; } " +
    "h2, h3, h4 { font-family: 'Georgia', serif; } " +
    "a { text-decoration: none; color: inherit; } " +
    ".font-mono { font-family: 'Courier New', monospace; } " +
    "</style></head><body>";
  const footer = '</body></html>';
  const sourceHtml = header + htmlContent + footer;

  const blob = new Blob(['\ufeff', sourceHtml], {
    type: 'application/msword',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${webBook.topic.replace(/\s+/g, '_')}.doc`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportWebBookToPdf(webBook: WebBook): Promise<void> {
  const element = document.querySelector('.web-book-container');

  if (!element) {
    throw new Error('No rendered Web-book was found to export.');
  }

  // Clone to avoid UI mutation
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove UI-only elements
  clone.querySelectorAll('button, .print\\:hidden, [data-html2canvas-ignore]')
    .forEach((el) => el.remove());

  const htmlContent = clone.outerHTML;

  // FULL HTML DOCUMENT (critical for Puppeteer)
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${webBook.topic}</title>

      <script src="https://cdn.tailwindcss.com"></script>

      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700&family=Playfair+Display&family=JetBrains+Mono&display=swap" rel="stylesheet">

      <style>
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          background: white;
        }

        * {
          box-sizing: border-box;
          overflow-wrap: break-word;
        }

        .web-book-container {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0;
        }

        .web-book-page {
          break-after: page;
          page-break-after: always;
          padding: 24mm;
        }

        .web-book-page:last-child {
          break-after: auto;
          page-break-after: auto;
        }

        /* Prevent ugly splits */
        h1, h2, h3, h4 {
          break-after: avoid;
        }

        p, li {
          break-inside: avoid;
        }

        img {
          max-width: 100%;
          break-inside: avoid;
        }

        @page {
          size: A4;
          margin: 0;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  const response = await fetch('/__pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html: fullHtml,
      fileName: webBook.topic.replace(/\s+/g, '_'),
    }),
  });

  if (!response.ok) {
    throw new Error('PDF export failed');
  }

  const blob = await response.blob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${webBook.topic.replace(/\s+/g, '_')}.pdf`;
  a.click();

  URL.revokeObjectURL(url);
}

export async function printWebBook(webBook: WebBook): Promise<void> {
  const htmlContent = getWebBookElement().outerHTML;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to use the print feature.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${webBook.topic}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
        <style>
          html { scroll-behavior: smooth; }
          body { font-family: 'Inter', sans-serif; background: white; padding: 24px 0; margin: 0; }
          .font-serif { font-family: 'Playfair Display', serif; }
          .print\\:hidden { display: none !important; }
          .web-book-container { width: 100%; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 0; }
          .web-book-page { background: white; width: 100%; min-height: 100vh; display: flex; flex-direction: column; position: relative; box-sizing: border-box; }
          @media print {
            body { padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: visible !important; }
            .no-print { display: none; }
            .web-book-page {
              break-after: page;
              page-break-after: always;
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 1.5cm !important;
              min-height: auto !important;
              height: auto !important;
              box-sizing: border-box !important;
              overflow: visible !important;
            }
            .web-book-page:last-child { break-after: auto; page-break-after: auto; }
            @page { size: A4; margin: 0; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 1000);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
