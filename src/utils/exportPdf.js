import html2pdf from 'html2pdf.js';

export async function exportPresentationToPdf(elementId, filename = null, activeTenure = null) {
  const finalFilename = filename || (activeTenure?.code ? `Presentasi_Kepengurusan_CNT_IT_APD_${activeTenure.code}.pdf` : 'Presentasi_Kepengurusan_CNT_IT_APD.pdf');
  const targetElement = document.getElementById(elementId);
  
  if (!targetElement) {
    console.warn(`Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return;
  }

  // Create temporary visible clone offscreen for html2pdf to measure exact dimensions
  const clone = targetElement.cloneNode(true);
  clone.id = 'temp-pdf-export-clone';
  clone.className = 'block'; // Make visible to DOM layout engine
  clone.style.position = 'absolute';
  clone.style.top = '0';
  clone.style.left = '-9999px';
  clone.style.width = '1100px';
  clone.style.zIndex = '-9999';
  clone.style.backgroundColor = '#040914';
  clone.style.color = '#f3f4f6';
  
  document.body.appendChild(clone);

  const opt = {
    margin: 0,
    filename: finalFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#040914',
      windowWidth: 1050,
      logging: false,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak: { mode: ['css', 'legacy'], after: '.pdf-page-break' },
  };

  try {
    await html2pdf().set(opt).from(clone).save();
  } catch (error) {
    console.error('html2pdf error, triggering window.print fallback', error);
    window.print();
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}
