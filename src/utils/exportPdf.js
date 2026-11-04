import html2pdf from 'html2pdf.js';

export async function exportPresentationToPdf(elementId, filename = null, activeTenure = null) {
  const finalFilename = filename || (activeTenure?.code ? `Presentasi_Kepengurusan_CNT_IT_APD_${activeTenure.code}.pdf` : 'Presentasi_Kepengurusan_CNT_IT_APD.pdf');
  const targetElement = document.getElementById(elementId);
  
  if (!targetElement) {
    console.warn(`Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return;
  }

  // Scroll target element into view so html2canvas captures its active coordinates accurately
  targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });

  const opt = {
    margin: [8, 8, 8, 8],
    filename: finalFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#040914',
      scrollX: 0,
      scrollY: 0,
      logging: false,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  try {
    await html2pdf().set(opt).from(targetElement).save();
  } catch (error) {
    console.error('html2pdf error, triggering window.print fallback', error);
    window.print();
  }
}
