import QRCode from 'qrcode';
import { formatDeadlineWib } from './dateUtils';
import { getPublicBaseUrl } from './urlUtils';

/**
 * Generate a high-resolution, professionally styled Printable Poster Card (PNG)
 * for a Form with QR Code, Mandiri & CNT branding, title, subtitle, and URL.
 */
export async function generateFormQrPoster(options = {}) {
  // Gracefully handle both { form, event, baseUrl } and direct { title, description, formUrl, ... }
  const form = options.form || {
    id: options.id || options.formId || '',
    title: options.title || 'Formulir Pendaftaran',
    subtitle: options.subtitle || options.description || '',
    category: options.category || 'FORMULIR PENDAFTARAN RESMI',
    deadline: options.deadline || '',
    isEventConnected: Boolean(options.event || options.isEventConnected)
  };

  const event = options.event || null;
  const baseUrl = options.baseUrl || getPublicBaseUrl();
  const directUrl = options.formUrl || (form.id ? `${baseUrl.replace(/\/+$/, '')}/?form=${encodeURIComponent(form.id)}#form` : baseUrl);

  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 1700;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Deep Cosmic Mandiri Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#030814');
  bgGrad.addColorStop(0.35, '#001c3d');
  bgGrad.addColorStop(0.75, '#002f6c');
  bgGrad.addColorStop(1, '#051329');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Decorative Gold Glow Orbs
  const topGoldGlow = ctx.createRadialGradient(1000, 180, 20, 1000, 180, 420);
  topGoldGlow.addColorStop(0, 'rgba(255, 184, 0, 0.28)');
  topGoldGlow.addColorStop(1, 'rgba(255, 184, 0, 0)');
  ctx.fillStyle = topGoldGlow;
  ctx.fillRect(0, 0, width, height);

  const bottomCyanGlow = ctx.createRadialGradient(200, 1550, 20, 200, 1550, 400);
  bottomCyanGlow.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
  bottomCyanGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = bottomCyanGlow;
  ctx.fillRect(0, 0, width, height);

  // 3. Double Outer Frame (Mandiri Gold & Cyan)
  ctx.strokeStyle = '#FFB800';
  ctx.lineWidth = 5;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Corner Accent Dots
  ctx.fillStyle = '#FFB800';
  const corners = [
    [36, 36], [width - 36, 36], [36, height - 36], [width - 36, height - 36]
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. Header Top Brand Typography
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFB800';
  ctx.font = 'bold 22px "Montserrat", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('BANK MANDIRI • DIREKTORAT INFORMATION TECHNOLOGY', width / 2, 105);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillText('CULTURE NETWORK TEAM (CNT) • GROUP IT APPLICATION DELIVERY', width / 2, 138);

  // Divider Line under Header
  const headerDivGrad = ctx.createLinearGradient(width / 2 - 260, 0, width / 2 + 260, 0);
  headerDivGrad.addColorStop(0, 'rgba(255, 184, 0, 0)');
  headerDivGrad.addColorStop(0.5, '#FFB800');
  headerDivGrad.addColorStop(1, 'rgba(255, 184, 0, 0)');
  ctx.fillStyle = headerDivGrad;
  ctx.fillRect(width / 2 - 260, 158, 520, 2);

  // 5. Category Badge Pill
  const categoryText = (form.category || 'FORMULIR PENDAFTARAN RESMI').toUpperCase();
  ctx.font = 'bold 16px sans-serif';
  const catWidth = ctx.measureText(categoryText).width + 36;
  const pillY = 190;
  
  ctx.fillStyle = 'rgba(255, 184, 0, 0.15)';
  ctx.strokeStyle = '#FFB800';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(width / 2 - catWidth / 2, pillY, catWidth, 34, 17);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFB800';
  ctx.fillText(categoryText, width / 2, pillY + 23);

  // 6. Form Title (Multi-line Word Wrap, Centered)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 46px sans-serif';
  const titleWords = (form.title || 'Formulir Pendaftaran').split(' ');
  const titleLines = [];
  let currentTitleLine = '';
  for (const word of titleWords) {
    const testLine = currentTitleLine ? `${currentTitleLine} ${word}` : word;
    if (ctx.measureText(testLine).width > 960) {
      titleLines.push(currentTitleLine);
      currentTitleLine = word;
    } else {
      currentTitleLine = testLine;
    }
  }
  if (currentTitleLine) titleLines.push(currentTitleLine);

  let titleStartY = 280;
  titleLines.slice(0, 3).forEach((line, idx) => {
    ctx.fillText(line, width / 2, titleStartY + idx * 56);
  });

  // 7. Subtitle / Description (Wrapped)
  const subY = titleStartY + titleLines.slice(0, 3).length * 56 + 10;
  ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
  ctx.font = 'italic 22px sans-serif';
  const subWords = (form.subtitle || form.description || 'Silakan scan QR Code di bawah untuk mengakses dan melengkapi formulir.').split(' ');
  const subLines = [];
  let curSubLine = '';
  for (const w of subWords) {
    const test = curSubLine ? `${curSubLine} ${w}` : w;
    if (ctx.measureText(test).width > 920) {
      subLines.push(curSubLine);
      curSubLine = w;
    } else {
      curSubLine = test;
    }
  }
  if (curSubLine) subLines.push(curSubLine);

  subLines.slice(0, 2).forEach((line, idx) => {
    ctx.fillText(line, width / 2, subY + idx * 32);
  });

  // 8. Event Connection Banner (if connected)
  let qrContainerY = 470;
  if (event || form.isEventConnected) {
    const eventName = event?.title || 'Agenda Acara CNT IT APD';
    const eventBannerY = subY + subLines.slice(0, 2).length * 32 + 16;
    
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(140, eventBannerY, width - 280, 48, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`📅 Terhubung ke Acara: ${eventName.slice(0, 50)}`, width / 2, eventBannerY + 31);
    qrContainerY = eventBannerY + 70;
  } else {
    qrContainerY = Math.max(460, subY + subLines.slice(0, 2).length * 32 + 20);
  }

  // 9. QR Code Centerpiece Card (Crisp White Card with Gold Border)
  const qrBoxSize = 580;
  const qrBoxX = width / 2 - qrBoxSize / 2;
  const qrBoxY = qrContainerY;

  // Outer glow for the QR box
  ctx.shadowColor = 'rgba(255, 184, 0, 0.45)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#FFB800';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Generate QR Code with high error correction
  const formUrl = directUrl;
  const qrDataUrl = await QRCode.toDataURL(formUrl, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#040d21',
      light: '#ffffff'
    }
  });

  const qrImg = new Image();
  await new Promise((resolve, reject) => {
    qrImg.onload = resolve;
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  // Draw QR centered inside the white box
  const qrDrawSize = 480;
  const qrDrawX = width / 2 - qrDrawSize / 2;
  const qrDrawY = qrBoxY + (qrBoxSize - qrDrawSize) / 2;
  ctx.drawImage(qrImg, qrDrawX, qrDrawY, qrDrawSize, qrDrawSize);

  // 10. Scan Instruction under QR Code
  const instructY = qrBoxY + qrBoxSize + 48;
  ctx.fillStyle = '#FFB800';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('📷 ARAHKAN KAMERA HP ANDA KE QR CODE DI ATAS', width / 2, instructY);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 20px sans-serif';
  ctx.fillText('Untuk membuka dan mengisi formulir pendaftaran secara langsung', width / 2, instructY + 34);

  // 11. Direct URL Pill Container
  const urlBoxY = instructY + 80;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(140, urlBoxY, width - 280, 52, 26);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px monospace';
  const displayUrl = formUrl.length > 60 ? formUrl.slice(0, 58) + '...' : formUrl;
  ctx.fillText(`🔗 ${displayUrl}`, width / 2, urlBoxY + 33);

  // 12. Deadline & Status Banner
  const deadlineY = urlBoxY + 85;
  if (form.deadline) {
    ctx.fillStyle = 'rgba(255, 184, 0, 0.14)';
    ctx.strokeStyle = 'rgba(255, 184, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(220, deadlineY, width - 440, 44, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFB800';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(`⏳ Batas Waktu Pengisian: ${formatDeadlineWib(form.deadline)}`, width / 2, deadlineY + 28);
  }

  // 13. Official Footer Watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '16px sans-serif';
  ctx.fillText('Dokumen Resmi Publikasi • Culture Network Team (CNT) IT APD • PT Bank Mandiri (Persero) Tbk.', width / 2, height - 70);

  // Return DataUrl & Blob
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const safeTitle = (form.title || 'form')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  const fileName = `poster-qr-${safeTitle}.png`;

  return {
    dataUrl,
    blob,
    fileName,
    filename: fileName,
    formUrl
  };
}
