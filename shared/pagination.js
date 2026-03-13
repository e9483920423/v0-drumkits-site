class Pagination {
  constructor(options) {
    this.containerId = options.containerId || 'paginationContainer';
    this.itemsPerPage = options.itemsPerPage || 6;
    this.paginationLimit = options.paginationLimit || 6;
    this.onPageChange = options.onPageChange;
    this.totalItems = options.totalItems || 0;
    
    this.currentPage = 1;
    this.expandLeft = false;
    this.expandRight = false;
  }

  setTotalItems(total) {
    this.totalItems = total;
    this.currentPage = 1;
    this.expandLeft = false;
    this.expandRight = false;
  }

  get totalPages() {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getPaginationRange() {
    if (this.totalPages <= this.paginationLimit) {
      const all = [];
      for (let i = 1; i <= this.totalPages; i++) all.push(i);
      return { pages: all, showLeftDots: false, showRightDots: false, showFirst: false, showLast: false };
    }

    const windowSize = Math.max(1, this.paginationLimit - 2);
    const half = Math.floor(windowSize / 2);

    let start = this.currentPage - half;
    let end = this.currentPage + (windowSize - half - 1);
    
    if (start < 2) {
      start = 2;
      end = start + windowSize - 1;
    }
    if (end > this.totalPages - 1) {
      end = this.totalPages - 1;
      start = end - windowSize + 1;
    }

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);

    return {
      pages,
      showFirst: true,
      showLast: true,
      showLeftDots: start > 2,
      showRightDots: end < this.totalPages - 1,
    };
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    
    const containerEl = document.getElementById(this.containerId);
    const y = containerEl ? (containerEl.getBoundingClientRect().top + window.scrollY) : window.scrollY;

    this.currentPage = page;
    this.expandLeft = false;
    this.expandRight = false;
    
    if (this.onPageChange) {
      this.onPageChange(this.currentPage);
    }
    this.render();

    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: "auto" });
    });
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    this.currentPage = Math.min(Math.max(this.currentPage, 1), this.totalPages);
    container.innerHTML = "";

    const makeBtn = (label, page, { active = false, disabled = false } = {}) => {
      const btn = document.createElement("button");
      btn.className = "pagination-btn";
      if (active) btn.classList.add("active");
      btn.textContent = label;
      btn.disabled = disabled;
      btn.onclick = () => this.goToPage(page);
      return btn;
    };

    const makeDotsBtn = (side, from, to) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pagination-btn pagination-dots-btn";
      btn.textContent = "…";
      btn.title = "Show more pages";

      btn.onclick = () => {
        if (side === "left") this.expandLeft = !this.expandLeft;
        if (side === "right") this.expandRight = !this.expandRight;
        this.render();
      };

      if (from > to) btn.disabled = true;
      return btn;
    };

    container.appendChild(
      makeBtn("← Previous", this.currentPage - 1, { disabled: this.currentPage === 1 })
    );

    const range = this.getPaginationRange();

    if (range.showFirst) {
      container.appendChild(makeBtn("1", 1, { active: this.currentPage === 1 }));
    }

    if (range.showLeftDots) {
      if (this.expandLeft) {
        const firstVisible = range.pages[0];
        for (let p = 2; p < firstVisible; p++) {
          container.appendChild(makeBtn(String(p), p, { active: p === this.currentPage }));
        }
        container.appendChild(makeDotsBtn("left", 2, range.pages[0] - 1));
      } else {
        container.appendChild(makeDotsBtn("left", 2, range.pages[0] - 1));
      }
    }

    range.pages.forEach((p) => {
      container.appendChild(makeBtn(String(p), p, { active: p === this.currentPage }));
    });

    if (range.showRightDots) {
      const lastVisible = range.pages[range.pages.length - 1];

      if (this.expandRight) {
        container.appendChild(makeDotsBtn("right", lastVisible + 1, this.totalPages - 1));

        for (let p = lastVisible + 1; p <= this.totalPages - 1; p++) {
          container.appendChild(makeBtn(String(p), p, { active: p === this.currentPage }));
        }
      } else {
        container.appendChild(makeDotsBtn("right", lastVisible + 1, this.totalPages - 1));
      }
    }

    if (range.showLast) {
      container.appendChild(
        makeBtn(String(this.totalPages), this.totalPages, { active: this.currentPage === this.totalPages })
      );
    }
    
    container.appendChild(
      makeBtn("Next →", this.currentPage + 1, { disabled: this.currentPage === this.totalPages })
    );
  }
}

window.Pagination = Pagination;
