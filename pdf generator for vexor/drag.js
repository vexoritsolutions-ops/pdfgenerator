/* =============================
   DRAG & DROP REORDERING
   ============================= */

class DragSorter {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.dragSrc = null;
    this._init();
  }

  _init() {
    if (!this.container) return;
    this.container.addEventListener('dragstart', (e) => this._onDragStart(e));
    this.container.addEventListener('dragover',  (e) => this._onDragOver(e));
    this.container.addEventListener('dragleave', (e) => this._onDragLeave(e));
    this.container.addEventListener('drop',      (e) => this._onDrop(e));
    this.container.addEventListener('dragend',   (e) => this._onDragEnd(e));
  }

  _getCard(el) {
    return el.closest('.image-card');
  }

  _onDragStart(e) {
    const card = this._getCard(e.target);
    if (!card) return;
    this.dragSrc = card;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  }

  _onDragOver(e) {
    e.preventDefault();
    const card = this._getCard(e.target);
    if (!card || card === this.dragSrc) return;
    document.querySelectorAll('.image-card').forEach(c => c.classList.remove('drag-target'));
    card.classList.add('drag-target');
    e.dataTransfer.dropEffect = 'move';
  }

  _onDragLeave(e) {
    const card = this._getCard(e.target);
    if (card) card.classList.remove('drag-target');
  }

  _onDrop(e) {
    e.preventDefault();
    const card = this._getCard(e.target);
    if (!card || card === this.dragSrc) return;

    // Swap positions
    const cards = [...this.container.children];
    const srcIdx = cards.indexOf(this.dragSrc);
    const tgtIdx = cards.indexOf(card);

    if (srcIdx < tgtIdx) {
      this.container.insertBefore(this.dragSrc, card.nextSibling);
    } else {
      this.container.insertBefore(this.dragSrc, card);
    }

    card.classList.remove('drag-target');
    this._updatePageNumbers();
  }

  _onDragEnd() {
    document.querySelectorAll('.image-card').forEach(c => {
      c.classList.remove('dragging', 'drag-target');
    });
    this.dragSrc = null;
  }

  _updatePageNumbers() {
    document.querySelectorAll('.card-page-num').forEach((el, i) => {
      el.textContent = `Page ${i + 1}`;
    });
  }

  enableCard(card) {
    card.setAttribute('draggable', 'true');
  }
}

window.DragSorter = DragSorter;
