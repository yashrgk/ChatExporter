/**
 * SaafPDF - Formula & Table Auto-Scaler
 * Ensures ultra-wide formulas & tables dynamically scale down to fit container/A4 printable width
 * without clipping, truncation, horizontal scrollbars, or artificial linebreaks.
 */

(function(global) {
  'use strict';

  let resizeTimeout = null;

  /**
   * Auto-scale display math formulas to fit container or printable width
   * @param {HTMLElement} rootElement 
   * @param {number|null} targetWidth - Optional forced target width (e.g. 680px for A4 print)
   */
  function autoScaleFormulas(rootElement, targetWidth = null) {
    const root = rootElement || document.getElementById('preview-document');
    if (!root) return;

    const formulaBlocks = root.querySelectorAll('.formula-block');
    formulaBlocks.forEach(block => {
      const innerContainer = block.querySelector('.formula-container');
      if (!innerContainer) return;

      // 1. Reset any previous scaling to measure natural rendered width
      innerContainer.style.transform = 'none';
      innerContainer.style.transformOrigin = 'left center';
      innerContainer.style.width = 'auto';
      innerContainer.style.display = 'inline-block';
      block.style.height = 'auto';
      block.style.overflow = 'visible';

      // 2. Measure widths
      const availableWidth = targetWidth || block.clientWidth || root.clientWidth || 700;
      const naturalWidth = innerContainer.scrollWidth;

      // 3. If formula exceeds printable/available width, scale down proportionally
      if (naturalWidth > availableWidth && availableWidth > 50) {
        // Safety margin of 8px, allow scale down to 0.32 on ultra-narrow mobile viewports
        const scale = Math.max(0.32, Math.min(1, (availableWidth - 8) / naturalWidth));
        
        innerContainer.style.transform = `scale(${scale})`;
        innerContainer.style.transformOrigin = 'left center';
        innerContainer.style.width = `${(100 / scale).toFixed(2)}%`;
        
        // Adjust vertical height compensation because CSS scale maintains layout box
        const naturalHeight = innerContainer.offsetHeight;
        const scaledHeight = naturalHeight * scale;
        const heightReduction = naturalHeight - scaledHeight;
        
        // Prevent excess white-space gap below scaled formula
        innerContainer.style.marginBottom = `-${heightReduction.toFixed(1)}px`;
        block.setAttribute('data-scaled', scale.toFixed(3));
      } else {
        innerContainer.style.transform = 'none';
        innerContainer.style.marginBottom = '0px';
        block.removeAttribute('data-scaled');
      }
    });
  }

  /**
   * Auto-fit tables: adjusts cell padding & typography for dense multi-column tables
   */
  function autoFitTables(rootElement, targetWidth = null) {
    const root = rootElement || document.getElementById('preview-document');
    if (!root) return;

    const tables = root.querySelectorAll('.saaf-table');
    tables.forEach(table => {
      const container = table.closest('.table-container') || table.parentElement;
      const availableWidth = targetWidth || container.clientWidth || root.clientWidth || 700;
      const headerCells = table.querySelectorAll('thead th');
      const numCols = headerCells.length || (table.querySelector('tr')?.children.length) || 1;

      // If table has many columns or viewport is very narrow
      if (numCols >= 5 || availableWidth < 600) {
        table.classList.add('table-compact');
      } else {
        table.classList.remove('table-compact');
      }

      // If still overflowing after compact class, calculate smart column fitting
      if (table.scrollWidth > availableWidth && numCols >= 4) {
        table.classList.add('table-ultra-compact');
      } else {
        table.classList.remove('table-ultra-compact');
      }
    });
  }

  /**
   * Fit all document elements (formulas + tables)
   */
  function autoFitAll(rootElement, targetWidth = null) {
    autoFitTables(rootElement, targetWidth);
    autoScaleFormulas(rootElement, targetWidth);
  }

  /**
   * Setup window resize & print media listeners
   */
  function initAutoScaler() {
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        autoFitAll();
      }, 120);
    });

    // Handle Print event: scale for standard A4 printable width (~680px)
    if (window.matchMedia) {
      const mediaQueryList = window.matchMedia('print');
      const printHandler = (mql) => {
        if (mql.matches) {
          // Entering print mode: enforce A4 width 680px
          autoFitAll(null, 680);
        } else {
          // Leaving print mode: restore screen sizing
          autoFitAll();
        }
      };

      try {
        mediaQueryList.addEventListener('change', printHandler);
      } catch (e) {
        mediaQueryList.addListener(printHandler);
      }
    }

    window.addEventListener('beforeprint', () => {
      autoFitAll(null, 680);
    });

    window.addEventListener('afterprint', () => {
      autoFitAll();
    });
  }

  const SaafScaler = {
    autoScaleFormulas,
    autoFitTables,
    autoFitAll,
    initAutoScaler
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaafScaler;
  } else {
    global.SaafScaler = SaafScaler;
  }
})(typeof window !== 'undefined' ? window : global);
