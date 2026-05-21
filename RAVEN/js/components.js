/**
 * RAVEN - Shared header, footer, mega menu (Rokomari-inspired)
 */
const RavenComponents = {
  isAdminPage() {
    return window.location.pathname.includes('/admin/');
  },

  headerHtml() {
    const user = RavenAuth.getSession();
    const categories = RavenDB.getCategories();
    const megaCols = categories
      .map(
        (c) =>
          `<a href="shop.html?category=${c.slug}" class="mega-link"><i class="bi ${c.icon}"></i> ${c.name}</a>`
      )
      .join('');

    return `
    <div class="top-bar">
      <div class="container-fluid px-lg-4">
        <div class="d-flex justify-content-between align-items-center">
          <span><i class="bi bi-truck"></i> Free shipping on orders over ৳2,500</span>
          <span class="d-none d-md-inline">Bangladesh's premium streetwear destination</span>
          <span><i class="bi bi-headset"></i> 09678-RAVEN-00</span>
        </div>
      </div>
    </div>
    <header class="site-header sticky-top">
      <nav class="navbar navbar-expand-lg">
        <div class="container-fluid px-lg-4">
          <button class="navbar-toggler border-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileMenu">
            <i class="bi bi-list fs-4"></i>
          </button>
          <a class="navbar-brand raven-logo" href="index.html">RAVEN</a>
          <div class="search-wrap d-none d-lg-flex flex-grow-1 mx-4 position-relative">
            <form class="search-form w-100" action="search.html" method="get">
              <input type="search" name="q" id="global-search" class="form-control" placeholder="Search hoodies, sneakers, jackets..." autocomplete="off" />
              <button type="submit"><i class="bi bi-search"></i></button>
            </form>
            <div id="search-suggestions" class="search-suggestions"></div>
          </div>
          <div class="header-actions d-flex align-items-center gap-2">
            <button class="btn-icon d-lg-none" type="button" data-bs-toggle="modal" data-bs-target="#searchModal"><i class="bi bi-search"></i></button>
            <button class="btn-icon" data-theme-toggle type="button" aria-label="Toggle theme"><i class="bi bi-moon-stars"></i></button>
            <a href="wishlist.html" class="btn-icon position-relative"><i class="bi bi-heart"></i><span class="badge-count" data-wishlist-count>0</span></a>
            <a href="cart.html" class="btn-icon position-relative"><i class="bi bi-bag"></i><span class="badge-count" data-cart-count>0</span></a>
            ${
              user
                ? `<div class="dropdown">
              <button class="btn btn-sm btn-outline-dark dropdown-toggle" data-bs-toggle="dropdown">${user.name?.split(' ')[0] || 'Account'}</button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="dashboard.html">Dashboard</a></li>
                <li><a class="dropdown-item" href="orders.html">Orders</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" id="btn-logout">Logout</a></li>
              </ul>
            </div>`
                : `<a href="login.html" class="btn btn-sm btn-dark d-none d-md-inline">Login</a>`
            }
          </div>
        </div>
        <div class="mega-nav d-none d-lg-block border-top">
          <div class="container-fluid px-lg-4">
            <ul class="mega-menu-list">
              <li class="mega-item has-dropdown">
                <a href="shop.html"><i class="bi bi-grid"></i> Categories <i class="bi bi-chevron-down small"></i></a>
                <div class="mega-dropdown">${megaCols}</div>
              </li>
              <li><a href="shop.html?sort=newest">New Arrivals</a></li>
              <li><a href="shop.html?flash=1">Flash Sale</a></li>
              <li><a href="shop.html?category=hoodies">Hoodies</a></li>
              <li><a href="shop.html?category=sneakers">Sneakers</a></li>
              <li><a href="shop.html?category=streetwear">Streetwear</a></li>
              <li><a href="about.html">About</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
    <div class="offcanvas offcanvas-start" id="mobileMenu">
      <div class="offcanvas-header">
        <h5 class="raven-logo">RAVEN</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <form action="search.html" class="mb-3"><input name="q" class="form-control" placeholder="Search..." /></form>
        ${categories.map((c) => `<a href="shop.html?category=${c.slug}" class="mobile-nav-link">${c.name}</a>`).join('')}
        <hr />
        <a href="shop.html" class="mobile-nav-link">Shop All</a>
        <a href="wishlist.html" class="mobile-nav-link">Wishlist</a>
        <a href="cart.html" class="mobile-nav-link">Cart</a>
        <a href="login.html" class="mobile-nav-link">Login</a>
        <a href="register.html" class="mobile-nav-link">Create Account</a>
      </div>
    </div>
    <div class="modal fade" id="searchModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body">
            <form action="search.html"><input name="q" class="form-control form-control-lg" placeholder="Search products..." autofocus /></form>
          </div>
        </div>
      </div>
    </div>`;
  },

  footerHtml() {
    return `
    <footer class="site-footer">
      <div class="newsletter-section">
        <div class="container">
          <div class="row align-items-center g-4">
            <div class="col-lg-6">
              <h3>Stay in the loop</h3>
              <p>${RavenDB.getSettings().newsletterText}</p>
            </div>
            <div class="col-lg-6">
              <form id="newsletter-form" class="newsletter-form">
                <input type="email" class="form-control" placeholder="Your email address" required />
                <button type="submit" class="btn btn-light">Subscribe</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-main">
        <div class="container">
          <div class="row g-4">
            <div class="col-md-4">
              <h4 class="raven-logo mb-3">RAVEN</h4>
              <p class="text-muted">Premium fashion for Bangladesh. Streetwear, essentials & limited drops.</p>
              <div class="social-links">
                <a href="#" aria-label="Facebook"><i class="bi bi-facebook"></i></a>
                <a href="#" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
                <a href="#" aria-label="YouTube"><i class="bi bi-youtube"></i></a>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <h6>Shop</h6>
              <a href="shop.html">All Products</a>
              <a href="shop.html?category=hoodies">Hoodies</a>
              <a href="shop.html?category=sneakers">Sneakers</a>
              <a href="shop.html?flash=1">Flash Sale</a>
            </div>
            <div class="col-6 col-md-2">
              <h6>Account</h6>
              <a href="login.html">Login</a>
              <a href="register.html">Register</a>
              <a href="dashboard.html">Dashboard</a>
              <a href="orders.html">Order History</a>
            </div>
            <div class="col-6 col-md-2">
              <h6>Support</h6>
              <a href="contact.html">Contact</a>
              <a href="about.html">About Us</a>
              <a href="#">Shipping Info</a>
              <a href="#">Returns</a>
            </div>
            <div class="col-6 col-md-2">
              <h6>Payment</h6>
              <p class="small text-muted mb-0">bKash · Nagad · Card · COD</p>
            </div>
          </div>
          <hr />
          <p class="text-center small text-muted mb-0">&copy; ${new Date().getFullYear()} RAVEN. All rights reserved. Demo static store.</p>
        </div>
      </div>
    </footer>`;
  },

  inject() {
    if (this.isAdminPage()) return;
    const headerEl = document.getElementById('site-header');
    const footerEl = document.getElementById('site-footer');
    if (headerEl) headerEl.innerHTML = this.headerHtml();
    if (footerEl) footerEl.innerHTML = this.footerHtml();

    document.getElementById('btn-logout')?.addEventListener('click', (e) => {
      e.preventDefault();
      RavenAuth.logout();
    });
    document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      RavenUI.toast('Thanks for subscribing!', 'success');
      e.target.reset();
    });
    RavenProducts.initSearch('#global-search', '#search-suggestions');
    RavenCart.updateBadge();
  },
};
