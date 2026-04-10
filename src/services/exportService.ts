import type { WebBook } from '../types';
import { buildWebBookDocx, type DocxChapterImageAsset } from './docxExport';

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

function getExportFileName(topic: string, extension: string): string {
  return `${topic.replace(/\s+/g, '_')}.${extension}`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseDataUrlImage(src: string): DocxChapterImageAsset | null {
  const match = /^data:(image\/(?:jpeg|png|gif));base64,(.+)$/i.exec(src);
  if (!match) return null;

  const [, rawContentType, base64Payload] = match;
  const contentType = rawContentType.toLowerCase() as DocxChapterImageAsset['contentType'];
  const extension = contentType === 'image/png'
    ? 'png'
    : contentType === 'image/gif'
      ? 'gif'
      : 'jpeg';

  const binary = window.atob(base64Payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return {
    altText: '',
    bytes,
    contentType,
    extension,
    widthPx: 1,
    heightPx: 1,
  };
}

function collectWordChapterImages(root: HTMLElement): Array<DocxChapterImageAsset | null> {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-pdf-page-kind="chapter"]'))
    .map((chapterSection) => {
      const image = chapterSection.querySelector<HTMLImageElement>('img');
      if (!image?.src) return null;

      const parsed = parseDataUrlImage(image.src);
      if (!parsed) return null;

      const exportedWidth = Number(image.dataset.exportWidth || image.dataset.exportOriginalWidth || image.naturalWidth || image.width || 0);
      const exportedHeight = Number(image.dataset.exportHeight || image.dataset.exportOriginalHeight || image.naturalHeight || image.height || 0);

      return {
        ...parsed,
        altText: image.alt || 'Chapter image',
        widthPx: Math.max(1, Math.round(exportedWidth || 1)),
        heightPx: Math.max(1, Math.round(exportedHeight || 1)),
      };
    });
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
      image.dataset.exportOriginalWidth = String(tempImg.naturalWidth || tempImg.width || 1);
      image.dataset.exportOriginalHeight = String(tempImg.naturalHeight || tempImg.height || 1);
      image.dataset.exportWidth = String(canvas.width || 1);
      image.dataset.exportHeight = String(canvas.height || 1);
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
          image.dataset.exportOriginalWidth = String(image.naturalWidth || image.width || 1);
          image.dataset.exportOriginalHeight = String(image.naturalHeight || image.height || 1);
          image.dataset.exportWidth = String(image.naturalWidth || image.width || 1);
          image.dataset.exportHeight = String(image.naturalHeight || image.height || 1);
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

  const chapterImages = collectWordChapterImages(clone);
  const blob = new Blob([buildWebBookDocx(webBook, chapterImages)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  downloadBlob(blob, getExportFileName(webBook.topic, 'docx'));
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
