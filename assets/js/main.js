document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initCategoryTree();
  initPDFViewers();
  loadMastodonFeed();
});

/**
 * Mobile navigation menu (Fullscreen toggle).
 */
function initMobileMenu() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const closeBtn = document.getElementById('sidebar-close-btn');

  if (!hamburgerBtn || !sidebar || !overlay) return;

  function toggleMenu() {
    sidebar.classList.toggle('active');
    hamburgerBtn.classList.toggle('active');
    overlay.classList.toggle('active');
  }

  function closeMenu() {
    hamburgerBtn.classList.remove('active');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  }

  hamburgerBtn.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', closeMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  // Chiudi il menu mobile quando si clicca su un link
  sidebar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/**
 * Tree categories: stato persistito in localStorage.
 * Alla prima visita partono chiuse, poi ricordano lo stato.
 */
function initCategoryTree() {
  const storageKey = 'enri-open-categories';
  let openCategories = [];

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) openCategories = JSON.parse(saved);
  } catch (e) { /* ignora */ }

  function saveState() {
    try { localStorage.setItem(storageKey, JSON.stringify(openCategories)); }
    catch (e) { /* ignora */ }
  }

  const categories = document.querySelectorAll('.tree-category');

  categories.forEach(catDiv => {
    const categorySlug = catDiv.getAttribute('data-category');
    const folderBtn = catDiv.querySelector('.tree-folder-btn');
    const icon = folderBtn ? folderBtn.querySelector('.tree-icon') : null;

    if (!folderBtn || !categorySlug) return;

    const hasActiveItem = catDiv.querySelector('.tree-article-item.active') !== null;
    const wasSavedOpen = openCategories.includes(categorySlug);

    // Apri se era salvata aperta OPPURE se contiene l'articolo attivo
    if (wasSavedOpen || hasActiveItem) {
      catDiv.classList.add('open');
      if (icon) icon.textContent = 'v';
      if (!openCategories.includes(categorySlug)) {
        openCategories.push(categorySlug);
        saveState();
      }
    } else {
      catDiv.classList.remove('open');
      if (icon) icon.textContent = '>';
    }

    // Toggle click
    folderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = catDiv.classList.toggle('open');
      if (icon) icon.textContent = isOpen ? 'v' : '>';

      if (isOpen) {
        if (!openCategories.includes(categorySlug)) openCategories.push(categorySlug);
      } else {
        openCategories = openCategories.filter(s => s !== categorySlug);
      }
      saveState();
    });
  });
}

/**
 * Carica dinamicamente i post da Mastodon via API pubblica.
 * Renderizza direttamente gli iframe dei video (Vimeo, PeerTube, YouTube).
 */
function loadMastodonFeed() {
  const container = document.getElementById('mastodon-feed');
  if (!container) return;

  const apiUrl = 'https://puntarella.party/api/v1/accounts/113990812722585031/statuses?limit=20&exclude_replies=true&exclude_reblogs=true';

  fetch(apiUrl)
    .then(res => {
      if (!res.ok) throw new Error('errore rete: ' + res.status);
      return res.json();
    })
    .then(statuses => {
      container.innerHTML = '';

      if (!statuses || statuses.length === 0) {
        container.innerHTML = '<p class="feed-loading">nessun post trovato.</p>';
        return;
      }

      statuses.forEach(status => {
        const postEl = document.createElement('article');
        postEl.className = 'mastodon-post';

        // Data come link al post originale
        const date = new Date(status.created_at);
        const dateStr = date.toLocaleDateString('it-IT', {
          day: '2-digit', month: 'long', year: 'numeric'
        });
        const statusUrl = status.url || status.uri;

        const dateEl = document.createElement('div');
        dateEl.className = 'mastodon-date';
        dateEl.innerHTML = `<a href="${statusUrl}" target="_blank" rel="noopener noreferrer">${dateStr}</a>`;
        postEl.appendChild(dateEl);

        // Contenuto testuale
        const content = status.content || '';
        if (content) {
          const textEl = document.createElement('div');
          textEl.className = 'mastodon-text';
          textEl.innerHTML = content;
          postEl.appendChild(textEl);
        }

        // Estrazione link video (Vimeo, PeerTube, YouTube)
        const embedUrl = extractVideoEmbedUrl(status);

        if (embedUrl) {
          const mediaEl = document.createElement('div');
          mediaEl.className = 'mastodon-media';
          mediaEl.innerHTML = `
            <div class="video-embed peertube-embed">
              <iframe src="${embedUrl}" frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
          `;
          postEl.appendChild(mediaEl);
        } else if (status.media_attachments && status.media_attachments.length > 0) {
          // Allegati media Mastodon (Immagini, GIF, Video diretti)
          const mediaEl = document.createElement('div');
          mediaEl.className = 'mastodon-media';
          status.media_attachments.forEach(att => {
            if (att.type === 'image') {
              const img = document.createElement('img');
              img.src = att.preview_url || att.url;
              img.alt = att.description || '';
              img.loading = 'lazy';
              mediaEl.appendChild(img);
            } else if (att.type === 'gifv' || att.type === 'video') {
              const video = document.createElement('video');
              video.src = att.url;
              video.poster = att.preview_url || '';
              video.autoplay = att.type === 'gifv';
              video.loop = att.type === 'gifv';
              video.muted = true;
              video.playsInline = true;
              video.controls = att.type === 'video';
              video.style.maxWidth = '100%';
              video.style.height = 'auto';
              video.style.display = 'block';
              video.style.marginTop = '0.75rem';
              video.style.border = '2px solid var(--border-color)';
              mediaEl.appendChild(video);
            }
          });
          postEl.appendChild(mediaEl);
        }

        container.appendChild(postEl);
      });
    })
    .catch(err => {
      console.error('Errore caricamento feed Mastodon:', err);
      container.innerHTML = '<p class="feed-loading">impossibile caricare il feed.</p>';
    });
}

/**
 * Estrae l'URL di embed per video Vimeo, PeerTube o YouTube (inclusi YouTube Live) da uno stato Mastodon.
 */
function extractVideoEmbedUrl(status) {
  if (!status) return null;

  // 1. Controlla prima il campo status.card se presente
  if (status.card) {
    if (status.card.embed_url) {
      const embed = resolveVideoEmbed(status.card.embed_url);
      if (embed) return embed;
    }
    if (status.card.url) {
      const embed = resolveVideoEmbed(status.card.url);
      if (embed) return embed;
    }
    if (status.card.html) {
      const iframeMatch = status.card.html.match(/src=["']([^"']+)["']/i);
      if (iframeMatch) {
        const embed = resolveVideoEmbed(iframeMatch[1]);
        if (embed) return embed;
      }
    }
  }

  // 2. Analizza gli elementi <a> presenti nel contenuto HTML
  if (status.content) {
    const tmp = document.createElement('div');
    tmp.innerHTML = status.content;
    const links = tmp.querySelectorAll('a');
    for (let a of links) {
      const embed = resolveVideoEmbed(a.href);
      if (embed) return embed;
    }

    // Fallback su ricerca grezza nel testo HTML
    const rawMatch = resolveVideoEmbed(status.content);
    if (rawMatch) return rawMatch;
  }

  return null;
}

/**
 * Converte qualsiasi URL Vimeo, PeerTube o YouTube (inclusi i live) nel corrispettivo URL di embed iframe.
 */
function resolveVideoEmbed(url) {
  if (!url || typeof url !== 'string') return null;

  // 1. Vimeo (supporta vimeo.com/ID, player.vimeo.com/video/ID, canali, live, ecc.)
  const vimeoMatch = url.match(/vimeo\.com\/(?:[a-zA-Z0-9_\/]*\/)?([0-9]{6,12})/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // 2. PeerTube (supporta /w/, /videos/watch/, /videos/embed/)
  const ptMatch = url.match(/^(https?:\/\/[^\/]+)\/(?:w|videos\/watch|videos\/embed)\/([A-Za-z0-9_-]+)/i);
  if (ptMatch) {
    let embed = `${ptMatch[1]}/videos/embed/${ptMatch[2]}`;
    embed = embed.replace(/grey/gi, 'gray');
    if (!embed.includes('color=')) {
      embed += (embed.includes('?') ? '&' : '?') + 'color=808080';
    }
    return embed;
  }

  // 3. YouTube (supporta watch?v=, embed/, youtu.be/ e live/)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  return null;
}

/**
 * PDF.js Viewer — singola pagina con fullscreen nativo.
 */
function initPDFViewers() {
  const viewers = document.querySelectorAll('.pdf-viewer');
  if (viewers.length === 0) return;

  if (typeof pdfjsLib === 'undefined') {
    console.error('PDF.js library is not loaded.');
    viewers.forEach(v => {
      v.innerHTML = '<p style="color:#ff0000; padding:1rem; border:2px solid #ff0000; text-align:center; font-weight:bold;">libreria pdf.js non caricata.</p>';
    });
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  viewers.forEach(container => {
    const url = container.getAttribute('data-pdf-url');
    if (!url) return;

    const canvas = container.querySelector('.pdf-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const prevBtn = container.querySelector('.pdf-prev-btn');
    const nextBtn = container.querySelector('.pdf-next-btn');
    const fullscreenBtn = container.querySelector('.pdf-fullscreen-btn');
    const curPageEl = container.querySelector('.pdf-current-page');
    const totalPagesEl = container.querySelector('.pdf-total-pages');

    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    let currentRenderTask = null;

    function renderPage(num) {
      pageRendering = true;

      pdfDoc.getPage(num).then(page => {
        const canvasContainer = container.querySelector('.pdf-canvas-container');
        const targetWidth = canvasContainer.clientWidth - 32;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale: Math.min(scale, 1.5) });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (currentRenderTask) currentRenderTask.cancel();

        currentRenderTask = page.render({
          canvasContext: ctx,
          viewport: viewport
        });

        currentRenderTask.promise.then(() => {
          pageRendering = false;
          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }
        }).catch(err => {
          if (err.name !== 'RenderingCancelledException') {
            console.error('Errore render pagina:', err);
          }
        });
      });

      // Aggiorna UI
      curPageEl.textContent = num;
      prevBtn.disabled = num <= 1;
      nextBtn.disabled = num >= pdfDoc.numPages;
    }

    function queueRenderPage(num) {
      if (pageRendering) {
        pageNumPending = num;
      } else {
        renderPage(num);
      }
    }

    prevBtn.addEventListener('click', () => {
      if (pageNum <= 1) return;
      pageNum--;
      queueRenderPage(pageNum);
    });

    nextBtn.addEventListener('click', () => {
      if (pageNum >= pdfDoc.numPages) return;
      pageNum++;
      queueRenderPage(pageNum);
    });

    // Fullscreen nativo
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        }
      });

      // Ri-renderizza quando si entra/esce dal fullscreen
      document.addEventListener('fullscreenchange', () => {
        if (pdfDoc) {
          setTimeout(() => renderPage(pageNum), 100);
        }
      });
    }

    // Ricalcola al resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (pdfDoc) renderPage(pageNum);
      }, 250);
    });

    // Carica il PDF
    pdfjsLib.getDocument(url).promise.then(pdfDoc_ => {
      pdfDoc = pdfDoc_;
      totalPagesEl.textContent = pdfDoc.numPages;
      renderPage(pageNum);
    }).catch(err => {
      console.error('Errore caricamento PDF:', err);
      container.innerHTML = `
        <div style="color:#ff0000; border:2px solid #ff0000; padding:1rem; font-weight:bold; width:100%;">
          <p>impossibile caricare il pdf.</p>
          <a href="${url}" download style="margin-top:0.5rem; display:inline-block;">scarica pdf</a>
        </div>`;
    });
  });

  // Navigazione da tastiera per PDF in fullscreen
  document.addEventListener('keydown', (e) => {
    const activeViewer = document.fullscreenElement || document.webkitFullscreenElement;
    if (activeViewer && activeViewer.classList.contains('pdf-viewer')) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        const nextBtn = activeViewer.querySelector('.pdf-next-btn');
        if (nextBtn && !nextBtn.disabled) nextBtn.click();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        const prevBtn = activeViewer.querySelector('.pdf-prev-btn');
        if (prevBtn && !prevBtn.disabled) prevBtn.click();
      }
    }
  });
}
