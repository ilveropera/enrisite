# guida: come aggiungere contenuti al sito

## struttura cartelle

```
antygravity/
├── _articles/          <-- i tuoi articoli vanno qui
│   ├── 2026-07-01-benvenuto.md
│   ├── 2026-07-02-video-peertube.md
│   └── ...
├── assets/
│   ├── images/         <-- le tue foto vanno qui
│   ├── docs/           <-- i tuoi pdf vanno qui
│   ├── css/
│   └── js/
├── _config.yml
├── _layouts/
├── _includes/
└── index.html
```

---

## come creare un articolo

crea un file `.md` nella cartella `_articles/`. il nome del file deve seguire questo formato:

```
ANNO-MESE-GIORNO-titolo-breve.md
```

esempio: `2026-08-15-progetto-casa.md`

> [!IMPORTANT]
> la data nel nome del file determina l'**ordine** nel menu: i più recenti appaiono prima.

---

## frontmatter (l'intestazione del file)

ogni file `.md` inizia con un blocco `---` che contiene i metadati:

```yaml
---
title: "titolo del mio articolo"
category: "nome-sezione"
date: 2026-08-15 10:00:00 +0200
---
```

| campo | cosa fa | obbligatorio |
|-------|---------|:---:|
| `title` | il titolo mostrato nel menu e nella pagina | sì |
| `category` | la **sezione** del menu dove appare l'articolo | sì |
| `date` | data e ora, usata per l'ordinamento | sì |

### come funzionano le sezioni (categorie)

la `category` nel frontmatter **crea automaticamente** le sezioni nel menu laterale. non devi configurare nulla altrove.

- se scrivi `category: "fotografia"` → appare la sezione "fotografia"
- se scrivi `category: "video"` → appare la sezione "video"  
- se scrivi `category: "progetti"` → appare la sezione "progetti"

puoi inventare qualsiasi nome. per **spostare** un articolo in un'altra sezione, cambia semplicemente il valore di `category`.

per **cambiare l'ordine** degli articoli dentro una sezione, cambia la `date`: i più recenti appaiono prima.

---

## tipi di contenuto

### 1. solo testo

```markdown
---
title: "il mio testo"
category: "scritti"
date: 2026-08-15 10:00:00 +0200
---
questo è un paragrafo normale.

questo è un altro paragrafo. puoi usare **grassetto**, *corsivo*, 
e [link](https://esempio.com).

> questo è un blocco citazione

## questo è un sottotitolo

- lista
- di
- elementi
```

---

### 2. articolo con foto

metti le immagini in `assets/images/` e poi referenziale nel markdown:

```markdown
---
title: "le mie foto di viaggio"
category: "fotografia"
date: 2026-08-20 14:00:00 +0200
---
ecco alcune foto del viaggio.

![descrizione foto](/assets/images/nome-foto.jpg)

testo dopo la foto.

![altra foto](/assets/images/altra-foto.jpg)
```

> [!TIP]
> puoi mettere quante foto vuoi in un singolo articolo, alternate al testo.

---

### 3. articolo con video peertube

per incorporare un video peertube, copia l'url del video e usa questo html:

```markdown
---
title: "il mio video"
category: "video"
date: 2026-09-01 12:00:00 +0200
---
ecco il video del progetto.

<div class="peertube-embed">
  <iframe src="https://ISTANZA/videos/embed/ID-VIDEO" 
          frameborder="0" allowfullscreen 
          sandbox="allow-same-origin allow-scripts allow-popups"></iframe>
</div>

testo dopo il video.
```

**come trovare l'url embed:**
1. vai al video su peertube
2. l'url sarà tipo `https://tubocatodico.bida.im/w/ofj9oxHkBCXhjQoLxweRg2`
3. sostituisci `/w/` con `/videos/embed/` → `https://tubocatodico.bida.im/videos/embed/ofj9oxHkBCXhjQoLxweRg2`

---

### 4. articolo con pdf sfogliabile

metti il pdf in `assets/docs/` e usa questo blocco html:

```markdown
---
title: "documento progetto"
category: "documenti"
date: 2026-09-05 16:00:00 +0200
---
descrizione del documento.

<div class="pdf-viewer" data-pdf-url="/assets/docs/nome-documento.pdf">
  <div class="pdf-controls">
    <button class="pdf-btn pdf-prev-btn" aria-label="pagina precedente">&lt;</button>
    <button class="pdf-btn pdf-fullscreen-btn" aria-label="schermo intero">fullscreen</button>
    <button class="pdf-btn pdf-next-btn" aria-label="pagina successiva">&gt;</button>
  </div>
  <div class="pdf-canvas-container">
    <canvas class="pdf-canvas"></canvas>
  </div>
  <div class="pdf-footer">
    <span class="pdf-page-info">pagina <span class="pdf-current-page">1</span> di <span class="pdf-total-pages">0</span></span>
    <a href="/assets/docs/nome-documento.pdf" class="pdf-download-link" download>scarica pdf</a>
  </div>
</div>
```

> [!IMPORTANT]
> cambia `nome-documento.pdf` in entrambi i posti (in `data-pdf-url` e nel link `href` di download).

---

### 5. articolo misto (testo + foto + video + pdf)

puoi mischiare tutto nello stesso articolo:

```markdown
---
title: "progetto completo"
category: "progetti"
date: 2026-10-01 10:00:00 +0200
---
## introduzione

testo introduttivo del progetto.

![foto del progetto](/assets/images/progetto-foto.jpg)

## video di presentazione

<div class="peertube-embed">
  <iframe src="https://tubocatodico.bida.im/videos/embed/ID-VIDEO" 
          frameborder="0" allowfullscreen 
          sandbox="allow-same-origin allow-scripts allow-popups"></iframe>
</div>

## documentazione

<div class="pdf-viewer" data-pdf-url="/assets/docs/progetto-doc.pdf">
  <div class="pdf-controls">
    <button class="pdf-btn pdf-prev-btn">&lt;</button>
    <button class="pdf-btn pdf-fullscreen-btn">fullscreen</button>
    <button class="pdf-btn pdf-next-btn">&gt;</button>
  </div>
  <div class="pdf-canvas-container">
    <canvas class="pdf-canvas"></canvas>
  </div>
  <div class="pdf-footer">
    <span class="pdf-page-info">pagina <span class="pdf-current-page">1</span> di <span class="pdf-total-pages">0</span></span>
    <a href="/assets/docs/progetto-doc.pdf" class="pdf-download-link" download>scarica pdf</a>
  </div>
</div>
```

---

## cheat sheet rapido

| cosa vuoi fare | come |
|----------------|------|
| aggiungere un articolo | crea un `.md` in `_articles/` |
| creare una nuova sezione | scrivi un nuovo `category:` nel frontmatter |
| cambiare l'ordine | modifica la `date:` nel frontmatter |
| spostare un articolo | cambia `category:` |
| aggiungere un'immagine | mettila in `assets/images/`, usala con `![](/assets/images/file.jpg)` |
| aggiungere un pdf | mettilo in `assets/docs/`, copia il blocco html del viewer |
| aggiungere un video | copia il blocco `peertube-embed` con l'url corretto |

## come vedere le modifiche

```bash
bundle exec jekyll serve
```

poi apri **http://localhost:4000** — il sito si aggiorna automaticamente quando salvi un file.

---

## integrazione feed mastodon e rss

il feed mastodon sulla homepage è caricato in modo **completamente dinamico via client-side javascript** dal browser dell'utente (senza bisogno di ri-compilare il sito statico jekyll).

1. **funzionamento**: all'avvio della pagina, uno script in `assets/js/main.js` invia una richiesta all'api pubblica dell'istanza mastodon `https://puntarella.party` per estrarre gli ultimi 20 stati pubblici di `@enri`.
2. **rendering**: il browser formatta il testo ed esegue il parsing degli allegati:
   - le immagini statiche vengono visualizzate inline.
   - i video e le gif animate (GIFV) vengono incorporati in un player `<video>` nativo (con autoplay e loop per le gif).
   - i link a peertube (sia nel formato `/w/` che `/videos/watch/`) vengono rilevati e convertiti automaticamente in un player `iframe` responsive incorporato direttamente nella card del post.
3. **feed rss**: nella sezione **info** del menu laterale è fornito il link diretto al feed rss nativo di mastodon: `https://puntarella.party/@enri.rss`. questo feed xml standard può essere usato da lettori di feed, aggregatori esterni o per automatizzare notifiche.

---

## ordinamento fisso delle categorie nel menu

per impostazione predefinita, le categorie estratte dal frontmatter degli articoli vengono ordinate alfabeticamente. se vuoi definire un **ordine fisso e personalizzato** per le sezioni del menu:

1. apri il file di configurazione del progetto `_config.yml`.
2. aggiungi o modifica la lista `category_order` inserendo i nomi esatti delle tue categorie nell'ordine desiderato:

```yaml
category_order:
  - "Generale"
  - "documenti"
  - "video"
  - "fotografia"
```

*se un articolo ha una categoria non inclusa in questa lista, essa verrà automaticamente aggiunta in fondo al menu.*
