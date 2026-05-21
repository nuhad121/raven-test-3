/**
 * RAVEN - Admin panel logic
 */
const RavenAdmin = {
  init(page) {
    if (!RavenAuth.requireAdmin()) return false;
    this.injectSidebar();
    this.updateTopbar();
    document.querySelector('[data-admin-logout]')?.addEventListener('click', (e) => {
      e.preventDefault();
      RavenAuth.adminLogout();
    });
    RavenUI.initTheme();
    switch (page) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'products':
        this.renderProducts();
        break;
      case 'orders':
        this.renderOrders();
        break;
      case 'users':
        document.getElementById('btn-refresh-users')?.addEventListener('click', () => this.renderUsers());
        this.renderUsers();
        break;
      case 'analytics':
        this.renderAnalytics();
        break;
      case 'categories':
        this.renderCategories();
        break;
      case 'reviews':
        this.renderReviews();
        break;
      case 'coupons':
        this.renderCoupons();
        break;
      case 'banners':
        this.renderBanners();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }
    return true;
  },

  sidebarLinks() {
    const base = '';
    return [
      { href: 'dashboard.html', icon: 'bi-speedometer2', label: 'Dashboard' },
      { href: 'products.html', icon: 'bi-box-seam', label: 'Products' },
      { href: 'categories.html', icon: 'bi-tags', label: 'Categories' },
      { href: 'orders.html', icon: 'bi-receipt', label: 'Orders' },
      { href: 'users.html', icon: 'bi-people', label: 'Customers' },
      { href: 'reviews.html', icon: 'bi-chat-quote', label: 'Reviews' },
      { href: 'coupons.html', icon: 'bi-ticket-perforated', label: 'Coupons' },
      { href: 'banners.html', icon: 'bi-images', label: 'Banners' },
      { href: 'analytics.html', icon: 'bi-graph-up', label: 'Analytics' },
      { href: 'settings.html', icon: 'bi-gear', label: 'Settings' },
    ];
  },

  injectSidebar() {
    const el = document.getElementById('admin-sidebar');
    if (!el) return;
    const current = window.location.pathname.split('/').pop();
    el.innerHTML = `
      <div class="admin-brand">RAVEN <span>Admin</span></div>
      <nav class="admin-nav">
        ${this.sidebarLinks()
          .map(
            (l) =>
              `<a href="${l.href}" class="admin-nav-link ${current === l.href ? 'active' : ''}"><i class="bi ${l.icon}"></i> ${l.label}</a>`
          )
          .join('')}
      </nav>
      <a href="../index.html" class="admin-nav-link mt-auto"><i class="bi bi-shop"></i> View Store</a>
      <a href="#" data-admin-logout class="admin-nav-link text-danger"><i class="bi bi-box-arrow-right"></i> Logout</a>`;
  },

  updateTopbar() {
    const session = RavenAuth.getAdminSession();
    const el = document.getElementById('admin-user');
    if (el && session) el.textContent = session.email;
  },

  renderDashboard() {
    const a = RavenDB.getAnalytics();
    document.getElementById('stat-revenue').textContent = RavenDB.formatPrice(a.revenue);
    document.getElementById('stat-orders').textContent = a.totalOrders;
    document.getElementById('stat-products').textContent = a.totalProducts;
    document.getElementById('stat-users').textContent = a.totalUsers;

    const orders = RavenDB.getOrders().slice(0, 8);
    document.getElementById('recent-orders').innerHTML =
      orders.length === 0
        ? '<tr><td colspan="5" class="text-muted">No orders yet</td></tr>'
        : orders
            .map(
              (o) => `<tr>
          <td>${o.id}</td>
          <td>${o.customerName || '-'}</td>
          <td>${RavenDB.formatPrice(o.total)}</td>
          <td><span class="badge-status ${o.status}">${o.status}</span></td>
          <td>${RavenUI.formatDate(o.createdAt)}</td>
        </tr>`
            )
            .join('');

    const activity = [...RavenDB.getUsers(), ...orders.map((o) => ({ type: 'order', ...o }))].slice(0, 6);
    document.getElementById('user-activity').innerHTML =
      activity.length === 0
        ? '<tr><td colspan="3" class="text-muted">No activity</td></tr>'
        : activity
            .map((item) => {
              if (item.type === 'order')
                return `<tr><td>Order ${item.id}</td><td>${item.customerName}</td><td>${RavenUI.formatDate(item.createdAt)}</td></tr>`;
              return `<tr><td>New user</td><td>${item.name}</td><td>${RavenUI.formatDate(item.createdAt)}</td></tr>`;
            })
            .join('');
  },

  renderProducts() {
    const tbody = document.getElementById('products-table');
    const products = RavenDB.init().products;
    tbody.innerHTML = products
      .map(
        (p) => `<tr>
        <td><img src="${p.images[0]}" class="admin-thumb" alt="" /></td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${RavenDB.formatPrice(RavenDB.getSalePrice(p))}</td>
        <td>${p.stock}</td>
        <td><span class="badge ${p.status === 'active' ? 'bg-success' : 'bg-secondary'}">${p.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-dark" data-edit="${p.id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-del="${p.id}">Delete</button>
        </td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => this.openProductModal(btn.dataset.edit));
    });
    tbody.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this product?')) {
          RavenDB.deleteProduct(btn.dataset.del);
          this.renderProducts();
          RavenUI.toast('Product deleted', 'info');
        }
      });
    });

    document.getElementById('btn-add-product')?.addEventListener('click', () => this.openProductModal());
    document.getElementById('product-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const product = {
        id: fd.get('id') || undefined,
        name: fd.get('name'),
        slug: fd.get('name').toLowerCase().replace(/\s+/g, '-'),
        category: fd.get('category'),
        price: parseInt(fd.get('price'), 10),
        discount: parseInt(fd.get('discount'), 10) || 0,
        stock: parseInt(fd.get('stock'), 10),
        status: fd.get('status'),
        badge: fd.get('badge') || null,
        rating: parseFloat(fd.get('rating')) || 4,
        reviewCount: parseInt(fd.get('reviewCount'), 10) || 0,
        featured: fd.get('featured') === 'on',
        flashSale: fd.get('flashSale') === 'on',
        trending: fd.get('trending') === 'on',
        isNew: fd.get('isNew') === 'on',
        colors: fd.get('colors').split(',').map((c) => c.trim()),
        sizes: fd.get('sizes').split(',').map((s) => s.trim()),
        images: [fd.get('image')],
        description: fd.get('description'),
      };
      RavenDB.saveProduct(product);
      bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
      this.renderProducts();
      RavenUI.toast('Product saved', 'success');
    });
  },

  openProductModal(id) {
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    const form = document.getElementById('product-form');
    form.reset();
    if (id) {
      const p = RavenDB.getProductById(id);
      if (p) {
        form.querySelector('[name="id"]').value = p.id;
        form.querySelector('[name="name"]').value = p.name;
        form.querySelector('[name="category"]').value = p.category;
        form.querySelector('[name="price"]').value = p.price;
        form.querySelector('[name="discount"]').value = p.discount;
        form.querySelector('[name="stock"]').value = p.stock;
        form.querySelector('[name="status"]').value = p.status;
        form.querySelector('[name="badge"]').value = p.badge || '';
        form.querySelector('[name="image"]').value = p.images[0];
        form.querySelector('[name="description"]').value = p.description;
        form.querySelector('[name="colors"]').value = p.colors.join(', ');
        form.querySelector('[name="sizes"]').value = p.sizes.join(', ');
        form.featured.checked = p.featured;
        form.flashSale.checked = p.flashSale;
        form.trending.checked = p.trending;
        form.isNew.checked = p.isNew;
      }
    } else form.querySelector('[name="id"]').value = '';
    modal.show();
  },

  renderOrders() {
    const tbody = document.getElementById('orders-table');
    const orders = RavenDB.getOrders();
    tbody.innerHTML = orders
      .map(
        (o) => `<tr>
        <td>${o.id}</td>
        <td>${o.customerName}<br><small>${o.phone}</small></td>
        <td>${RavenDB.formatPrice(o.total)}</td>
        <td>
          <select class="form-select form-select-sm order-status" data-id="${o.id}">
            ${['pending', 'processing', 'shipped', 'delivered', 'cancelled']
              .map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`)
              .join('')}
          </select>
        </td>
        <td>${RavenUI.formatDate(o.createdAt)}</td>
      </tr>`
      )
      .join('') || '<tr><td colspan="5">No orders</td></tr>';

    tbody.querySelectorAll('.order-status').forEach((sel) => {
      sel.addEventListener('change', () => {
        RavenDB.updateOrderStatus(sel.dataset.id, sel.value);
        RavenUI.toast('Order status updated', 'success');
      });
    });
  },

  async renderUsers() {
    const tbody = document.getElementById('users-table');
    const notice = document.getElementById('users-sync-notice');
    if (!tbody) return;

    tbody.innerHTML =
      '<tr><td colspan="7" class="text-muted">Loading customers…</td></tr>';

    let users = RavenDB.getUsers();
    let syncMsg = '';

    if (typeof RavenCloudUsers !== 'undefined' && RavenCloudUsers.isEnabled()) {
      const remote = await RavenCloudUsers.fetchAll();
      if (remote.ok) {
        users = RavenCloudUsers.mergeUserLists(users, remote.users);
        RavenCloudUsers.persistToLocalDb(users);
        syncMsg =
          '<span class="text-success"><i class="bi bi-cloud-check"></i> সব ডিভাইস — ' +
          users.length +
          ' customers (cloud sync ON)</span>';
      } else {
        syncMsg =
          '<span class="text-danger"><i class="bi bi-x-circle"></i> Cloud error: ' +
          RavenUI.escapeHtml(remote.message || 'unavailable') +
          ' — check <code>js/cloud-config.js</code> + <code>SUPABASE-SETUP.md</code></span>';
      }
    } else {
      syncMsg =
        '<div class="alert alert-warning py-2 mb-0"><strong>শুধু এই ব্রাউজার/ডিভাইসের user দেখা যাচ্ছে।</strong><br>অন্য ফোনের account admin-এ দেখতে <code>js/cloud-config.js</code>-এ Supabase URL + key বসান (<a href="../SUPABASE-SETUP.md" target="_blank">SUPABASE-SETUP.md</a>).</div>';
    }

    if (notice) notice.innerHTML = syncMsg;

    tbody.innerHTML =
      users
        .map(
          (u) => `<tr>
        <td>${RavenUI.escapeHtml(u.name)}</td>
        <td>${RavenUI.escapeHtml(u.email)}</td>
        <td>${RavenUI.escapeHtml(u.phone || '-')}</td>
        <td><code class="user-password-cell">${RavenUI.escapeHtml(u.password || '—')}</code></td>
        <td>${u.verified ? '<span class="text-success">Yes</span>' : '<span class="text-warning">No</span>'}</td>
        <td>${(u.orders && u.orders.length) || 0}</td>
        <td>${RavenUI.formatDate(u.createdAt)}</td>
      </tr>`
        )
        .join('') || '<tr><td colspan="7">No customers yet</td></tr>';

  },

  renderAnalytics() {
    const a = RavenDB.getAnalytics();
    document.getElementById('an-revenue').textContent = RavenDB.formatPrice(a.revenue);
    document.getElementById('an-orders').textContent = a.totalOrders;
    document.getElementById('an-pending').textContent = a.pending;
    document.getElementById('an-lowstock').textContent = a.lowStock;
    document.getElementById('an-oos').textContent = a.outOfStock;

    const canvas = document.getElementById('sales-chart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const orders = RavenDB.getOrders();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const data = months.map((_, i) => orders.filter((o) => new Date(o.createdAt).getMonth() === i).length * 500 + 200);
      const max = Math.max(...data, 1);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width / data.length;
      data.forEach((v, i) => {
        const h = (v / max) * (canvas.height - 30);
        ctx.fillStyle = '#111';
        ctx.fillRect(i * w + 10, canvas.height - h - 10, w - 20, h);
      });
    }
  },

  renderCategories() {
    const list = document.getElementById('categories-list');
    list.innerHTML = RavenDB.getCategories()
      .map(
        (c) => `<div class="d-flex justify-content-between align-items-center border-bottom py-2">
        <span><i class="bi ${c.icon}"></i> ${c.name} (${c.slug})</span>
        <button class="btn btn-sm btn-outline-danger" data-del-cat="${c.id}">Delete</button>
      </div>`
      )
      .join('');
    list.querySelectorAll('[data-del-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        RavenDB.deleteCategory(btn.dataset.delCat);
        this.renderCategories();
      });
    });
    document.getElementById('category-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      RavenDB.saveCategory({
        id: 'cat-' + Date.now(),
        name: fd.get('name'),
        slug: fd.get('slug'),
        icon: fd.get('icon') || 'bi-tag',
      });
      e.target.reset();
      this.renderCategories();
      RavenUI.toast('Category added', 'success');
    });
  },

  renderReviews() {
    const tbody = document.getElementById('reviews-table');
    const reviews = RavenDB.init().reviews;
    tbody.innerHTML = reviews
      .map((r) => {
        const p = RavenDB.getProductById(r.productId);
        return `<tr><td>${p?.name || r.productId}</td><td>${r.userName}</td><td>${r.rating}★</td><td>${r.text}</td><td>${r.date}</td></tr>`;
      })
      .join('');
  },

  renderCoupons() {
    const tbody = document.getElementById('coupons-table');
    tbody.innerHTML = RavenDB.getCoupons()
      .map(
        (c) => `<tr>
        <td>${c.code}</td>
        <td>${c.type === 'percent' ? c.discount + '%' : RavenDB.formatPrice(c.discount)}</td>
        <td>${RavenDB.formatPrice(c.minOrder)}</td>
        <td>${c.active ? 'Active' : 'Inactive'}</td>
        <td><button class="btn btn-sm btn-outline-danger" data-del-cp="${c.id}">Delete</button></td>
      </tr>`
      )
      .join('');
    tbody.querySelectorAll('[data-del-cp]').forEach((btn) => {
      btn.addEventListener('click', () => {
        RavenDB.deleteCoupon(btn.dataset.delCp);
        this.renderCoupons();
      });
    });
    document.getElementById('coupon-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      RavenDB.saveCoupon({
        code: fd.get('code').toUpperCase(),
        discount: parseInt(fd.get('discount'), 10),
        type: fd.get('type'),
        minOrder: parseInt(fd.get('minOrder'), 10),
        active: true,
      });
      e.target.reset();
      this.renderCoupons();
    });
  },

  renderBanners() {
    const grid = document.getElementById('banners-grid');
    grid.innerHTML = RavenDB.getBanners(false)
      .map(
        (b) => `<div class="banner-admin-card">
        <img src="${b.image}" alt="" />
        <div class="p-2">
          <strong>${b.title}</strong>
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" data-banner-active="${b.id}" ${b.active ? 'checked' : ''} />
            <label>Active</label>
          </div>
          <button class="btn btn-sm btn-outline-danger" data-del-banner="${b.id}">Delete</button>
        </div>
      </div>`
      )
      .join('');

    grid.querySelectorAll('[data-banner-active]').forEach((inp) => {
      inp.addEventListener('change', () => {
        const banners = RavenDB.init().banners;
        const b = banners.find((x) => x.id === inp.dataset.bannerActive);
        if (b) {
          b.active = inp.checked;
          RavenDB.saveBanner(b);
        }
      });
    });
    grid.querySelectorAll('[data-del-banner]').forEach((btn) => {
      btn.addEventListener('click', () => {
        RavenDB.deleteBanner(btn.dataset.delBanner);
        this.renderBanners();
      });
    });

    document.getElementById('banner-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      RavenDB.saveBanner({
        title: fd.get('title'),
        subtitle: fd.get('subtitle'),
        image: fd.get('image'),
        link: fd.get('link'),
        active: true,
        order: RavenDB.getBanners(false).length + 1,
      });
      e.target.reset();
      this.renderBanners();
      RavenUI.toast('Banner added', 'success');
    });
  },

  renderSettings() {
    const s = RavenDB.getSettings();
    const form = document.getElementById('settings-form');
    form.querySelector('[name="siteName"]').value = s.siteName;
    form.querySelector('[name="shippingFee"]').value = s.shippingFee;
    form.querySelector('[name="freeShippingMin"]').value = s.freeShippingMin;
    form.querySelector('[name="newsletterText"]').value = s.newsletterText;

    const feat = document.getElementById('featured-select');
    const products = RavenDB.init().products;
    const ids = RavenDB.getFeaturedIds();
    feat.innerHTML = products
      .map((p) => `<option value="${p.id}" ${ids.includes(p.id) ? 'selected' : ''}>${p.name}</option>`)
      .join('');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      RavenDB.saveSettings({
        siteName: fd.get('siteName'),
        shippingFee: parseInt(fd.get('shippingFee'), 10),
        freeShippingMin: parseInt(fd.get('freeShippingMin'), 10),
        newsletterText: fd.get('newsletterText'),
      });
      const selected = Array.from(feat.selectedOptions).map((o) => o.value);
      RavenDB.setFeaturedProductIds(selected);
      RavenUI.toast('Settings saved', 'success');
    });
  },
};

function initAdminLogin() {
  document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = RavenAuth.adminLogin(fd.get('email'), fd.get('password'));
    if (res.ok) window.location.href = 'dashboard.html';
    else RavenUI.toast(res.message, 'error');
  });
}
