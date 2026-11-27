const SUPABASE_URL = "https://xarcxbfgeoetyhpqsick.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhcmN4YmZnZW9ldHlocHFzaWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MTM1MjMsImV4cCI6MjEwOTE4OTUyM30.xQzKu3bL9Pzp3OeL6s2s9sEtTBQukr1y0XQSf21bzWI";

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(request, context) {
  const url = new URL(request.url);
  const galleryId = url.searchParams.get("gallery") || url.searchParams.get("galleryId");
  const eventId = url.searchParams.get("event") || url.searchParams.get("eventId");
  const formId = url.searchParams.get("form") || url.searchParams.get("formId");

  // Only intercept if gallery, event, or form query param is present
  if (!galleryId && !eventId && !formId) {
    return context.next();
  }

  const userAgent = request.headers.get("user-agent") || "";
  const isCrawler = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|SkypeUriPreview|Google-Structured-Data-Testing-Tool|bingbot|crawler|spider/i.test(userAgent);

  // If normal browser user (not a preview crawler bot), continue to React SPA app
  if (!isCrawler) {
    return context.next();
  }

  try {
    // 1. Handle Gallery Preview for WhatsApp / Social Crawlers
    if (galleryId) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/galleries?id=eq.${encodeURIComponent(galleryId)}&select=*`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const gal = data[0];
          const rawPhotos = Array.isArray(gal.photos) ? gal.photos : [];
          let firstPhoto = rawPhotos[0] || `${url.origin}/assets/CNT_IT_APD_LOGO_SUITE/01-APD%20Master%20Brand%20Logo.png`;
          if (firstPhoto.startsWith("/")) {
            firstPhoto = `${url.origin}${firstPhoto}`;
          }

          const rawDesc = gal.description || "Dokumentasi kegiatan insan IT Application Delivery Bank Mandiri";
          const snippetDesc = rawDesc.length > 200 ? rawDesc.slice(0, 197) + "..." : rawDesc;
          const metaTitle = `${gal.title} — Galeri Dokumentasi CNT IT APD`;
          const canonicalUrl = `${url.origin}/?gallery=${encodeURIComponent(gal.id)}#galeri`;

          const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(snippetDesc)}" />
  
  <!-- Open Graph / WhatsApp Preview Meta Tags -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Culture Network Team · IT APD Bank Mandiri" />
  <meta property="og:title" content="${escapeHtml(gal.title)}" />
  <meta property="og:description" content="${escapeHtml(snippetDesc)}" />
  <meta property="og:image" content="${escapeHtml(firstPhoto)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(firstPhoto)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(gal.title)}" />
  <meta name="twitter:description" content="${escapeHtml(snippetDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(firstPhoto)}" />

  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" />
</head>
<body>
  <script>window.location.replace("${escapeHtml(canonicalUrl)}");</script>
  <p>Membuka <a href="${escapeHtml(canonicalUrl)}">${escapeHtml(gal.title)}</a>...</p>
</body>
</html>`;

          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=300"
            }
          });
        }
      }
    }

    // 2. Handle Event Preview for WhatsApp / Social Crawlers
    if (eventId) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(eventId)}&select=*`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const evt = data[0];
          let eventImg = evt.banner_image || evt.image || evt.poster_url || `${url.origin}/assets/CNT_IT_APD_LOGO_SUITE/01-APD%20Master%20Brand%20Logo.png`;
          if (eventImg.startsWith("/")) {
            eventImg = `${url.origin}${eventImg}`;
          }

          const rawDesc = evt.description || "Agenda kegiatan dan program kerja insan IT Application Delivery Bank Mandiri";
          const snippetDesc = rawDesc.length > 200 ? rawDesc.slice(0, 197) + "..." : rawDesc;
          const canonicalUrl = `${url.origin}/?event=${encodeURIComponent(evt.id)}#event`;

          const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(evt.title)} — Event CNT IT APD</title>
  <meta name="description" content="${escapeHtml(snippetDesc)}" />
  
  <!-- Open Graph / WhatsApp Preview Meta Tags -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Culture Network Team · IT APD Bank Mandiri" />
  <meta property="og:title" content="${escapeHtml(evt.title)}" />
  <meta property="og:description" content="${escapeHtml(snippetDesc)}" />
  <meta property="og:image" content="${escapeHtml(eventImg)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(eventImg)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(evt.title)}" />
  <meta name="twitter:description" content="${escapeHtml(snippetDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(eventImg)}" />

  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" />
</head>
<body>
  <script>window.location.replace("${escapeHtml(canonicalUrl)}");</script>
  <p>Membuka <a href="${escapeHtml(canonicalUrl)}">${escapeHtml(evt.title)}</a>...</p>
</body>
</html>`;

          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=300"
            }
          });
        }
      }
    }

    // 3. Handle Form Preview for WhatsApp / Social Crawlers
    if (formId) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/forms?id=eq.${encodeURIComponent(formId)}&select=*`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const frm = data[0];
          let formImg = frm.banner_image || frm.poster_url || frm.image || `${url.origin}/assets/CNT_IT_APD_LOGO_SUITE/01-APD%20Master%20Brand%20Logo.png`;
          if (formImg.startsWith("/")) {
            formImg = `${url.origin}${formImg}`;
          }

          const rawDesc = frm.subtitle || frm.description || "Formulir pendaftaran dan registrasi resmi Culture Network Team IT APD Bank Mandiri";
          const snippetDesc = rawDesc.length > 200 ? rawDesc.slice(0, 197) + "..." : rawDesc;
          const canonicalUrl = `${url.origin}/?form=${encodeURIComponent(frm.id)}#form`;

          const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(frm.title)} — Formulir Registrasi CNT IT APD</title>
  <meta name="description" content="${escapeHtml(snippetDesc)}" />
  
  <!-- Open Graph / WhatsApp Preview Meta Tags -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Culture Network Team · IT APD Bank Mandiri" />
  <meta property="og:title" content="${escapeHtml(frm.title)}" />
  <meta property="og:description" content="${escapeHtml(snippetDesc)}" />
  <meta property="og:image" content="${escapeHtml(formImg)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(formImg)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(frm.title)}" />
  <meta name="twitter:description" content="${escapeHtml(snippetDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(formImg)}" />

  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" />
</head>
<body>
  <script>window.location.replace("${escapeHtml(canonicalUrl)}");</script>
  <p>Membuka <a href="${escapeHtml(canonicalUrl)}">${escapeHtml(frm.title)}</a>...</p>
</body>
</html>`;

          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=300"
            }
          });
        }
      }
    }
  } catch (err) {
    console.error("OG Preview Edge Function error:", err);
  }

  // Fallback to normal SPA handling
  return context.next();
}

export const config = {
  path: "/*"
};
