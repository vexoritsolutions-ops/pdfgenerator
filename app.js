/* =============================
   ABHINAV PDF GENERATOR - APP.JS
   ============================= */

(function () {
  'use strict';

  /* ---- DOM refs ---- */
  const dropzone      = document.getElementById('dropzone');
  const fileInput     = document.getElementById('fileInput');
  const browseBtn     = document.getElementById('browseBtn');
  const previewArea   = document.getElementById('previewArea');
  const imageGrid     = document.getElementById('imageGrid');
  const imageCount    = document.getElementById('imageCount');
  const addMoreBtn    = document.getElementById('addMoreBtn');
  const clearAllBtn   = document.getElementById('clearAllBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const generateArea  = document.getElementById('generateArea');
  const generateBtn   = document.getElementById('generateBtn');
  const progressWrap  = document.getElementById('progressWrap');
  const progressFill  = document.getElementById('progressFill');
  const downloadArea  = document.getElementById('downloadArea');
  const downloadBtn   = document.getElementById('downloadBtn');
  const newConvBtn    = document.getElementById('newConversionBtn');

  /* ---- Settings refs ---- */
  const pageSize      = document.getElementById('pageSize');
  const imageFit      = document.getElementById('imageFit');
  const marginRange   = document.getElementById('marginRange');
  const marginVal     = document.getElementById('marginVal');
  const pdfTitle      = document.getElementById('pdfTitle');
  const pdfAuthor     = document.getElementById('pdfAuthor');
  const bgColorPicker = document.getElementById('bgColor');
  const bgColorLabel  = document.getElementById('bgColorLabel');
  const addPageNums   = document.getElementById('addPageNumbers');
  const addWatermark  = document.getElementById('addWatermark');
  const watermarkGrp  = document.getElementById('watermarkGroup');
  const watermarkText = document.getElementById('watermarkText');

  /* ---- State ---- */
  let pdfBlob   = null;
  let sortable  = null;

  /* ---- Init drag sorter ---- */
  sortable = new DragSorter('#imageGrid');

  /* ---- Toggle groups ---- */
  document.querySelectorAll('.toggle-group').forEach(group => {
    group.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });

  /* ---- Watermark toggle ---- */
  addWatermark.addEventListener('change', () => {
    watermarkGrp.style.display = addWatermark.checked ? '' : 'none';
  });

  /* ---- Margin range ---- */
  marginRange.addEventListener('input', () => {
    marginVal.textContent = marginRange.value;
  });

  /* ---- BG color ---- */
  bgColorPicker.addEventListener('input', () => {
    bgColorLabel.textContent = bgColorPicker.value;
  });

  /* ---- Browse / Drop zone ---- */
  browseBtn.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('click', (e) => {
    if (e.target !== browseBtn) fileInput.click();
  });

  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    if (files.length) handleFiles(files);
  });

  /* ---- Add more ---- */
  addMoreBtn.addEventListener('click', () => fileInput.click());

  /* ---- Clear all ---- */
  clearAllBtn.addEventListener('click', () => {
    imageGrid.innerHTML = '';
    updateUI();
  });

  /* ---- Handle files ---- */
  function handleFiles(files) {
    const arr = [...files].filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;

    arr.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        addImageCard(e.target.result, file.name);
      };
      reader.readAsDataURL(file);
    });

    setTimeout(updateUI, 100);
  }

  /* ---- Add image card ---- */
  function addImageCard(src, name) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.setAttribute('draggable', 'true');
    card.dataset.src = src;

    const pageNum = imageGrid.children.length + 1;

    card.innerHTML = `
      <img src="${src}" alt="${name}" loading="lazy" />
      <div class="card-overlay">
        <span class="card-page-num">Page ${pageNum}</span>
        <button class="card-remove" title="Remove">✕</button>
      </div>
    `;

    card.querySelector('.card-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      card.remove();
      updatePageNumbers();
      updateUI();
    });

    imageGrid.appendChild(card);
    sortable.enableCard(card);
    updatePageNumbers();
    updateUI();
  }

  /* ---- Update page numbers ---- */
  function updatePageNumbers() {
    document.querySelectorAll('.card-page-num').forEach((el, i) => {
      el.textContent = `Page ${i + 1}`;
    });
  }

  /* ---- Update UI visibility ---- */
  function updateUI() {
    const count = imageGrid.children.length;
    imageCount.textContent = count;

    if (count > 0) {
      previewArea.style.display   = '';
      settingsPanel.style.display = '';
      generateArea.style.display  = '';
      downloadArea.style.display  = 'none';
      pdfBlob = null;
    } else {
      previewArea.style.display   = 'none';
      settingsPanel.style.display = 'none';
      generateArea.style.display  = 'none';
    }
  }

  /* ---- Get settings ---- */
  function getSettings() {
    const orient  = document.querySelector('#orientToggle .toggle-btn.active')?.dataset.val || 'portrait';
    const quality = document.querySelector('#qualityToggle .toggle-btn.active')?.dataset.val || 'high';

    const qualityMap = { high: 1.0, medium: 0.75, low: 0.5 };

    return {
      pageSize:    pageSize.value,
      orientation: orient,
      imageFit:    imageFit.value,
      margin:      parseInt(marginRange.value, 10),
      title:       pdfTitle.value.trim() || 'Vexor PDF',
      author:      pdfAuthor.value.trim() || 'VExoe PDF Generator',
      bgColor:     bgColorPicker.value,
      pageNumbers: addPageNums.checked,
      watermark:   addWatermark.checked,
      watermarkTxt: watermarkText.value.trim() || 'CONFIDENTIAL',
      quality:     qualityMap[quality],
    };
  }

  /* ---- Page dimensions (in mm) ---- */
  const PAGE_SIZES = {
    a4:     [210, 297],
    letter: [215.9, 279.4],
    a3:     [297, 420],
    a5:     [148, 210],
    legal:  [215.9, 355.6],
  };

  /* ---- Generate PDF ---- */
  generateBtn.addEventListener('click', async () => {
    const cards = [...imageGrid.querySelectorAll('.image-card')];
    if (!cards.length) return;

    const cfg = getSettings();

    generateArea.style.display  = 'none';
    progressWrap.style.display  = '';
    setProgress(5);

    const { jsPDF } = window.jspdf;

    let [pw, ph] = PAGE_SIZES[cfg.pageSize] || PAGE_SIZES.a4;
    if (cfg.orientation === 'landscape') [pw, ph] = [ph, pw];

    const doc = new jsPDF({
      orientation: cfg.orientation,
      unit: 'mm',
      format: [pw, ph],
    });

    doc.setProperties({
      title:  cfg.title,
      author: cfg.author,
      creator: 'VEXOR PDF Generator',
    });

    const margin = cfg.margin;
    const drawW  = pw - margin * 2;
    const drawH  = ph - margin * 2;

    for (let i = 0; i < cards.length; i++) {
      setProgress(5 + ((i + 1) / cards.length) * 80);

      if (i > 0) doc.addPage([pw, ph], cfg.orientation);

      // Background color
      const hex = cfg.bgColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      doc.setFillColor(r, g, b);
      doc.rect(0, 0, pw, ph, 'F');

      // Image
      const src = cards[i].dataset.src;
      const ext = getImgExt(src);
      const { iw, ih } = await getImgDimensions(src);

      let x = margin, y = margin, w = drawW, h = drawH;

      if (cfg.imageFit === 'contain') {
        const ratio = Math.min(drawW / iw, drawH / ih);
        w = iw * ratio;
        h = ih * ratio;
        x = margin + (drawW - w) / 2;
        y = margin + (drawH - h) / 2;
      } else if (cfg.imageFit === 'original') {
        const mmPerPx = 25.4 / 96;
        w = Math.min(iw * mmPerPx, drawW);
        h = Math.min(ih * mmPerPx, drawH);
        x = margin + (drawW - w) / 2;
        y = margin + (drawH - h) / 2;
      }

      try {
        doc.addImage(src, ext, x, y, w, h, undefined, 'FAST');
      } catch {
        doc.addImage(src, 'JPEG', x, y, w, h, undefined, 'FAST');
      }

      // Watermark
      if (cfg.watermark && cfg.watermarkTxt) {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.12 }));
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(52);
        doc.setTextColor(100, 100, 100);
        doc.text(cfg.watermarkTxt, pw / 2, ph / 2, {
          angle: 45,
          align: 'center',
        });
        doc.restoreGraphicsState();
      }

      // Page number
      if (cfg.pageNumbers) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`${i + 1} / ${cards.length}`, pw / 2, ph - 6, { align: 'center' });
      }
    }

    setProgress(95);
    await delay(300);

    pdfBlob = doc.output('blob');
    const filename = (cfg.title || 'document').replace(/\s+/g, '_') + '.pdf';

    setProgress(100);
    await delay(300);

    progressWrap.style.display = 'none';
    downloadArea.style.display = '';
    downloadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });

    downloadBtn.onclick = () => {
      const url = URL.createObjectURL(pdfBlob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };
  });

  /* ---- New conversion ---- */
  newConvBtn.addEventListener('click', () => {
    imageGrid.innerHTML = '';
    fileInput.value     = '';
    pdfBlob             = null;
    downloadArea.style.display = 'none';
    generateArea.style.display = 'none';
    previewArea.style.display  = 'none';
    settingsPanel.style.display= 'none';
    updateUI();
    document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
  });

  /* ---- Helpers ---- */
  function setProgress(val) {
    progressFill.style.width = val + '%';
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function getImgExt(src) {
    if (src.includes('data:image/png'))  return 'PNG';
    if (src.includes('data:image/webp')) return 'WEBP';
    if (src.includes('data:image/gif'))  return 'GIF';
    return 'JPEG';
  }

  function getImgDimensions(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ iw: img.naturalWidth, ih: img.naturalHeight });
      img.onerror = () => resolve({ iw: 800, ih: 600 });
      img.src = src;
    });
  }

})();
