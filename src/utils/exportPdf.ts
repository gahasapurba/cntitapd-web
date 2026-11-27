import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportPresentationToPdf(
  elementId: string,
  filename: string | null = null,
  activeTenure: { code?: string } | null = null
): Promise<void> {
  const finalFilename = filename || (activeTenure?.code ? `Bagan_Organisasi_CNT_IT_APD_${activeTenure.code}.pdf` : 'Bagan_Organisasi_CNT_IT_APD.pdf');
  const targetElement = document.getElementById(elementId);
  
  if (!targetElement) {
    console.warn(`Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return;
  }

  // Ensure element is visible in viewport coordinate space
  targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });

  // Background = the page colour of the active theme (tokens are hex, which html2canvas can read)
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-page').trim() || (isDark ? '#0a101c' : '#f3f5f9');

  try {
    const canvas = await html2canvas(targetElement, {
      scale: 2, // High resolution crisp output
      useCORS: true,
      allowTaint: true,
      backgroundColor: bgColor,
      scrollX: 0,
      scrollY: 0,
      logging: false,
      onclone: (clonedDoc, clonedElement) => {
        // The clone must keep the same theme so the card and text tokens resolve identically
        clonedDoc.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        clonedDoc.documentElement.style.backgroundColor = bgColor;
        clonedElement.style.backgroundColor = bgColor;
      }
    });

    // One A4 page; orientation follows the chart's shape so a tall chart is not shrunk into landscape
    const portrait = canvas.height > canvas.width;
    const pdf = new jsPDF({
      orientation: portrait ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = portrait ? 210 : 297;
    const pageHeight = portrait ? 297 : 210;
    const margin = 8; // 8mm margin
    const maxW = pageWidth - margin * 2;
    const maxH = pageHeight - margin * 2;

    // Scale canvas image proportionally to fit completely on EXACTLY 1 page
    let renderW = maxW;
    let renderH = (canvas.height * renderW) / canvas.width;

    if (renderH > maxH) {
      renderH = maxH;
      renderW = (canvas.width * renderH) / canvas.height;
    }

    // Center image on the single page
    const posX = (pageWidth - renderW) / 2;
    const posY = (pageHeight - renderH) / 2;

    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
    pdf.save(finalFilename);
  } catch (error) {
    console.error('PDF generation error:', error);
    window.print();
  }
}
