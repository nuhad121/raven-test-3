/**
 * RAVEN - LocalStorage database layer
 */
const STORAGE_KEYS = {
  DB: 'raven_db_v1',
  CART: 'raven_cart_v1',
  WISHLIST: 'raven_wishlist_v1',
  SESSION: 'raven_session_v1',
  ADMIN_SESSION: 'raven_admin_session_v1',
  OTP: 'raven_otp_temp',
  OTP_META: 'raven_otp_meta',
  THEME: 'raven_theme',
  RECENT_SEARCH: 'raven_recent_search',
};

const RavenDB = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.DB)) {
      const db = {
        products: [...RAVEN_SEED.products],
        categories: [...RAVEN_SEED.categories],
        banners: [...RAVEN_SEED.banners],
        coupons: [...RAVEN_SEED.coupons],
        reviews: [...RAVEN_SEED.reviews],
        orders: [],
        users: [],
        settings: { ...RAVEN_SEED.settings },
        featuredProductIds: ['p-001', 'p-003', 'p-006', 'p-010'],
      };
      localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(db));
    }
    return this.getDB();
  },

  getDB() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DB)) || null;
    } catch {
      return null;
    }
  },

  saveDB(db) {
    localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(db));
  },

  getProducts(filters = {}) {
    const db = this.init();
    let list = [...db.products];

    if (filters.category) {
      list = list.filter((p) => p.category === filters.category);
    }
    if (filters.status) {
      list = list.filter((p) => p.status === filters.status);
    } else {
      list = list.filter((p) => p.status === 'active');
    }
    if (filters.flashSale) list = list.filter((p) => p.flashSale);
    if (filters.trending) list = list.filter((p) => p.trending);
    if (filters.isNew) list = list.filter((p) => p.isNew);
    if (filters.featured) {
      const ids = db.featuredProductIds || [];
      list = list.filter((p) => ids.includes(p.id));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (filters.minPrice != null) list = list.filter((p) => this.getSalePrice(p) >= filters.minPrice);
    if (filters.maxPrice != null) list = list.filter((p) => this.getSalePrice(p) <= filters.maxPrice);

    switch (filters.sort) {
      case 'price-asc':
        list.sort((a, b) => this.getSalePrice(a) - this.getSalePrice(b));
        break;
      case 'price-desc':
        list.sort((a, b) => this.getSalePrice(b) - this.getSalePrice(a));
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        list.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
    }
    return list;
  },

  getProductById(id) {
    const db = this.init();
    return db.products.find((p) => p.id === id) || null;
  },

  getProductBySlug(slug) {
    const db = this.init();
    return db.products.find((p) => p.slug === slug) || null;
  },

  getSalePrice(product) {
    if (!product.discount) return product.price;
    return Math.round(product.price * (1 - product.discount / 100));
  },

  formatPrice(amount) {
    const db = this.init();
    return `${db.settings.currency}${Number(amount).toLocaleString('en-BD')}`;
  },

  getCategories() {
    return this.init().categories;
  },

  getBanners(activeOnly = true) {
    const banners = [...this.init().banners];
    let list = banners.sort((a, b) => a.order - b.order);
    if (activeOnly) list = list.filter((b) => b.active);
    return list;
  },

  getFeaturedIds() {
    return this.init().featuredProductIds || [];
  },

  getReviews(productId) {
    return this.init().reviews.filter((r) => r.productId === productId);
  },

  addReview(review) {
    const db = this.init();
    review.id = 'rv-' + Date.now();
    review.date = new Date().toISOString().slice(0, 10);
    db.reviews.push(review);
    const product = db.products.find((p) => p.id === review.productId);
    if (product) {
      const revs = db.reviews.filter((r) => r.productId === review.productId);
      product.reviewCount = revs.length;
      product.rating = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
    }
    this.saveDB(db);
  },

  /* CRUD for admin */
  saveProduct(product) {
    const db = this.init();
    const idx = db.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) db.products[idx] = product;
    else {
      product.id = product.id || 'p-' + Date.now();
      db.products.push(product);
    }
    this.saveDB(db);
    return product;
  },

  deleteProduct(id) {
    const db = this.init();
    db.products = db.products.filter((p) => p.id !== id);
    this.saveDB(db);
  },

  saveCategory(cat) {
    const db = this.init();
    const idx = db.categories.findIndex((c) => c.id === cat.id);
    if (idx >= 0) db.categories[idx] = cat;
    else db.categories.push(cat);
    this.saveDB(db);
  },

  deleteCategory(id) {
    const db = this.init();
    db.categories = db.categories.filter((c) => c.id !== id);
    this.saveDB(db);
  },

  saveBanner(banner) {
    const db = this.init();
    const idx = db.banners.findIndex((b) => b.id === banner.id);
    if (idx >= 0) db.banners[idx] = banner;
    else {
      banner.id = banner.id || 'bn-' + Date.now();
      db.banners.push(banner);
    }
    this.saveDB(db);
  },

  deleteBanner(id) {
    const db = this.init();
    db.banners = db.banners.filter((b) => b.id !== id);
    this.saveDB(db);
  },

  saveCoupon(coupon) {
    const db = this.init();
    const idx = db.coupons.findIndex((c) => c.id === coupon.id);
    if (idx >= 0) db.coupons[idx] = coupon;
    else {
      coupon.id = coupon.id || 'cp-' + Date.now();
      db.coupons.push(coupon);
    }
    this.saveDB(db);
  },

  deleteCoupon(id) {
    const db = this.init();
    db.coupons = db.coupons.filter((c) => c.id !== id);
    this.saveDB(db);
  },

  getCoupons() {
    return this.init().coupons;
  },

  validateCoupon(code, subtotal) {
    const coupon = this.getCoupons().find((c) => c.code.toUpperCase() === code.toUpperCase() && c.active);
    if (!coupon || subtotal < coupon.minOrder) return null;
    const discount =
      coupon.type === 'percent' ? Math.round(subtotal * (coupon.discount / 100)) : coupon.discount;
    return { ...coupon, amount: discount };
  },

  getUsers() {
    return this.init().users;
  },

  saveUser(user) {
    const db = this.init();
    const idx = db.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) db.users[idx] = user;
    else db.users.push(user);
    this.saveDB(db);
  },

  getOrders(userId = null) {
    const orders = this.init().orders;
    if (userId) return orders.filter((o) => o.userId === userId);
    return orders;
  },

  saveOrder(order) {
    const db = this.init();
    order.id = order.id || 'ord-' + Date.now();
    order.createdAt = order.createdAt || new Date().toISOString();
    db.orders.unshift(order);
    db.products.forEach((p) => {
      order.items.forEach((item) => {
        if (item.productId === p.id) p.stock = Math.max(0, p.stock - item.qty);
      });
    });
    this.saveDB(db);
    return order;
  },

  updateOrderStatus(orderId, status) {
    const db = this.init();
    const order = db.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      this.saveDB(db);
    }
    return order;
  },

  getSettings() {
    return this.init().settings;
  },

  saveSettings(settings) {
    const db = this.init();
    db.settings = { ...db.settings, ...settings };
    this.saveDB(db);
  },

  setFeaturedProductIds(ids) {
    const db = this.init();
    db.featuredProductIds = ids;
    this.saveDB(db);
  },

  getAnalytics() {
    const db = this.init();
    const orders = db.orders;
    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const pending = orders.filter((o) => o.status === 'pending').length;
    const lowStock = db.products.filter((p) => p.stock > 0 && p.stock < 10).length;
    const outOfStock = db.products.filter((p) => p.stock === 0).length;
    return {
      totalOrders: orders.length,
      revenue,
      totalProducts: db.products.length,
      totalUsers: db.users.length,
      pending,
      lowStock,
      outOfStock,
    };
  },
};
