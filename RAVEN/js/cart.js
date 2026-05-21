/**
 * RAVEN - Cart & Wishlist (LocalStorage)
 */
const RavenCart = {
  getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
    } catch {
      return [];
    }
  },

  saveCart(items) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
    this.updateBadge();
  },

  add(productId, qty = 1, options = {}) {
    const product = RavenDB.getProductById(productId);
    if (!product || product.stock === 0) {
      RavenUI.toast('Product is out of stock', 'error');
      return false;
    }
    const cart = this.getCart();
    const key = this.itemKey(productId, options);
    const existing = cart.find((i) => this.itemKey(i.productId, i) === key);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, product.stock);
    } else {
      cart.push({
        productId,
        qty: Math.min(qty, product.stock),
        size: options.size || product.sizes[0],
        color: options.color || product.colors[0],
      });
    }
    this.saveCart(cart);
    RavenUI.toast('Added to cart', 'success');
    return true;
  },

  itemKey(productId, opts) {
    return `${productId}|${opts.size || ''}|${opts.color || ''}`;
  },

  updateQty(productId, qty, options = {}) {
    const cart = this.getCart();
    const key = this.itemKey(productId, options);
    const item = cart.find((i) => this.itemKey(i.productId, i) === key);
    if (item) {
      const product = RavenDB.getProductById(productId);
      item.qty = Math.max(1, Math.min(qty, product?.stock || qty));
      this.saveCart(cart);
    }
  },

  remove(productId, options = {}) {
    const key = this.itemKey(productId, options);
    const cart = this.getCart().filter((i) => this.itemKey(i.productId, i) !== key);
    this.saveCart(cart);
    RavenUI.toast('Removed from cart', 'info');
  },

  clear() {
    this.saveCart([]);
  },

  getCartDetails() {
    return this.getCart().map((item) => {
      const product = RavenDB.getProductById(item.productId);
      if (!product) return null;
      const price = RavenDB.getSalePrice(product);
      return { ...item, product, price, lineTotal: price * item.qty };
    }).filter(Boolean);
  },

  getSubtotal() {
    return this.getCartDetails().reduce((s, i) => s + i.lineTotal, 0);
  },

  getCount() {
    return this.getCart().reduce((s, i) => s + i.qty, 0);
  },

  updateBadge() {
    const el = document.querySelector('[data-cart-count]');
    if (el) el.textContent = this.getCount();
    const wl = document.querySelector('[data-wishlist-count]');
    if (wl) wl.textContent = this.getWishlist().length;
  },

  /* Wishlist */
  getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST)) || [];
    } catch {
      return [];
    }
  },

  toggleWishlist(productId) {
    let list = this.getWishlist();
    if (list.includes(productId)) {
      list = list.filter((id) => id !== productId);
      RavenUI.toast('Removed from wishlist', 'info');
    } else {
      list.push(productId);
      RavenUI.toast('Added to wishlist', 'success');
    }
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(list));
    this.updateBadge();
    return list.includes(productId);
  },

  isInWishlist(productId) {
    return this.getWishlist().includes(productId);
  },
};
