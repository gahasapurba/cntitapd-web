import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportPresentationToPdf(elementId, filename = null, activeTenure = null) {
  const finalFilename = filename || (activeTenure?.code ? `Bagan_Organisasi_CNT_IT_APD_${activeTenure.code}.pdf` : 'Bagan_Organisasi_CNT_IT_APD.pdf');
  const targetElement = document.getElementById(elementId);
  
  if (!targetElement) {
    console.warn(`Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return;
  }

  // Ensure element is visible in viewport coordinate space
  targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });

  // Adapt background to active theme
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bgColor = isDark ? '#040914' : '#f8fafc';

  try {
    const canvas = await html2canvas(targetElement, {
      scale: 2, // High resolution crisp output
      useCORS: true,
      allowTaint: true,
      backgroundColor: bgColor,
      scrollX: 0,
      scrollY: -window.scrollY,
      logging: false,
    });

    // Create 1-page Landscape A4 PDF (297 mm x 210 mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 8; // 8mm margin
    const maxW = pageWidth - margin * 2; // 281mm
    const maxH = pageHeight - margin * 2; // 194mm

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
