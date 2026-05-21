/**
 * RAVEN - Product rendering & filters
 */
const RavenProducts = {
  cardHtml(product, options = {}) {
    const salePrice = RavenDB.getSalePrice(product);
    const outOfStock = product.stock === 0;
    const inWishlist = RavenCart.isInWishlist(product.id);
    const discountBadge =
      product.discount > 0
        ? `<span class="badge-discount">-${product.discount}%</span>`
        : '';
    const badge = product.badge
      ? `<span class="badge-product">${product.badge}</span>`
      : '';
    const img = product.images[0] || '';
    const listView = options.listView ? ' product-card-list' : '';

    return `
    <article class="product-card${listView}" data-product-id="${product.id}">
      <div class="product-card-img-wrap">
        ${discountBadge}${badge}
        ${outOfStock ? '<span class="badge-oos">Out of Stock</span>' : ''}
        <a href="product.html?id=${product.id}">
          <img src="${img}" alt="${product.name}" loading="lazy" />
        </a>
        <div class="product-card-actions">
          <button type="button" class="btn-icon wishlist-btn ${inWishlist ? 'active' : ''}" data-wishlist="${product.id}" aria-label="Wishlist">
            <i class="bi bi-heart${inWishlist ? '-fill' : ''}"></i>
          </button>
          <button type="button" class="btn-icon quick-add-btn" data-add-cart="${product.id}" ${outOfStock ? 'disabled' : ''} aria-label="Add to cart">
            <i class="bi bi-bag-plus"></i>
          </button>
        </div>
      </div>
      <div class="product-card-body">
        <span class="product-category">${product.category.replace('-', ' ')}</span>
        <h3 class="product-title"><a href="product.html?id=${product.id}">${product.name}</a></h3>
        ${RavenUI.starsHtml(product.rating, true)}
        <span class="review-count">(${product.reviewCount})</span>
        <div class="product-price">
          <span class="price-current">${RavenDB.formatPrice(salePrice)}</span>
          ${product.discount > 0 ? `<span class="price-old">${RavenDB.formatPrice(product.price)}</span>` : ''}
        </div>
      </div>
    </article>`;
  },

  renderGrid(container, products) {
    if (!container) return;
    if (!products.length) {
      container.innerHTML = '<p class="text-center py-5 text-muted">No products found.</p>';
      return;
    }
    container.innerHTML = products.map((p) => this.cardHtml(p)).join('');
    this.bindCardEvents(container);
  },

  bindCardEvents(container) {
    container.querySelectorAll('[data-wishlist]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.wishlist;
        const active = RavenCart.toggleWishlist(id);
        btn.classList.toggle('active', active);
        btn.querySelector('i').className = active ? 'bi bi-heart-fill' : 'bi bi-heart';
      });
    });
    container.querySelectorAll('[data-add-cart]').forEach((btn) => {
      btn.addEventListener('click', () => RavenCart.add(btn.dataset.addCart, 1));
    });
  },

  initSearch(inputSelector, suggestionsSelector) {
    const input = document.querySelector(inputSelector);
    const box = document.querySelector(suggestionsSelector);
    if (!input || !box) return;

    const render = (q) => {
      if (!q || q.length < 2) {
        const recent = RavenUI.getRecentSearches();
        box.innerHTML =
          recent.length > 0
            ? `<div class="search-suggest-label">Recent</div>${recent.map((r) => `<a href="search.html?q=${encodeURIComponent(r)}" class="suggest-item">${r}</a>`).join('')}`
            : '';
        box.classList.toggle('show', recent.length > 0);
        return;
      }
      const products = RavenDB.getProducts({ search: q }).slice(0, 6);
      box.innerHTML = products
        .map(
          (p) =>
            `<a href="product.html?id=${p.id}" class="suggest-item"><img src="${p.images[0]}" alt="" /><span>${p.name}</span><strong>${RavenDB.formatPrice(RavenDB.getSalePrice(p))}</strong></a>`
        )
        .join('');
      box.classList.toggle('show', products.length > 0);
    };

    input.addEventListener('input', () => render(input.value.trim()));
    input.addEventListener('focus', () => render(input.value.trim()));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) {
          RavenUI.saveRecentSearch(q);
          window.location.href = `search.html?q=${encodeURIComponent(q)}`;
        }
      }
    });
    document.addEventListener('click', (e) => {
      if (!box.contains(e.target) && e.target !== input) box.classList.remove('show');
    });
  },

  initShopFilters() {
    const params = RavenUI.getQueryParams();
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    const apply = () => {
      const category = document.getElementById('filter-category')?.value || params.category || '';
      const sort = document.getElementById('filter-sort')?.value || params.sort || '';
      const minPrice = parseInt(document.getElementById('filter-min')?.value, 10) || null;
      const maxPrice = parseInt(document.getElementById('filter-max')?.value, 10) || null;
      const flash = document.getElementById('filter-flash')?.checked;
      const filters = { category: category || undefined, sort, minPrice, maxPrice };
      if (flash) filters.flashSale = true;
      let products = RavenDB.getProducts(filters);
      RavenProducts.renderGrid(grid, products);
      const countEl = document.getElementById('shop-count');
      if (countEl) countEl.textContent = `${products.length} products`;
    };

    ['filter-category', 'filter-sort', 'filter-min', 'filter-max', 'filter-flash'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', apply);
    });

    if (params.category) {
      const cat = document.getElementById('filter-category');
      if (cat) cat.value = params.category;
    }
    if (params.sort) {
      const sort = document.getElementById('filter-sort');
      if (sort) sort.value = params.sort;
    }
    if (params.flash === '1') {
      const flash = document.getElementById('filter-flash');
      if (flash) flash.checked = true;
    }
    apply();
  },
};
