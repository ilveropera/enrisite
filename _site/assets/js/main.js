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
        dateEl.innerHTML = `<a href="${statusUrl}" target="_blank" rel="noopener">${dateStr}</a>`;
        postEl.appendChild(dateEl);

        // Contenuto testuale (HTML sanitizzato dal server)
        const content = status.content || '';
        if (content) {
          const textEl = document.createElement('div');
          textEl.className = 'mastodon-text';
          textEl.innerHTML = content;
          postEl.appendChild(textEl);
        }

        // Controlla se nel contenuto c'è un link PeerTube
        const peertubeMatch = content.match(/https?:\/\/[^"<\s]+\/(?:w|videos\/watch)\/[A-Za-z0-9_-]+/);

        if (peertubeMatch) {
          // Embed PeerTube
          const mediaEl = document.createElement('div');
          mediaEl.className = 'mastodon-media';
          const videoUrl = peertubeMatch[0];
          // Converti URL /w/ o /videos/watch/ in URL /videos/embed/
          let embedUrl = videoUrl;
          if (videoUrl.includes('/w/')) {
            embedUrl = videoUrl.replace(/\/w\//, '/videos/embed/');
          } else if (videoUrl.includes('/videos/watch/')) {
            embedUrl = videoUrl.replace(/\/videos\/watch\//, '/videos/embed/');
          }
          mediaEl.innerHTML = `
            <div class="peertube-embed">
              <iframe src="${embedUrl}" frameborder="0" allowfullscreen sandbox="allow-same-origin allow-scripts allow-popups"></iframe>
            </div>`;
          postEl.appendChild(mediaEl);
        } else if (status.media_attachments && status.media_attachments.length > 0) {
          // Allegati media Mastodon (Immagini, GIF, Video)
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
