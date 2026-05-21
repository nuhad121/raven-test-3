/**
 * RAVEN - Main app bootstrap & page handlers
 */
function getFormSubmitButton(form, event) {
  return event?.submitter || form.querySelector('button[type="submit"]') || form.querySelector('button');
}

function setButtonLoading(btn, loading, defaultText) {
  if (!btn) return;
  btn.disabled = loading;
  if (defaultText) btn.textContent = loading ? 'Please wait...' : defaultText;
}

document.addEventListener('DOMContentLoaded', () => {
  RavenDB.init();
  RavenAuth.init();
  RavenUI.initTheme();
  RavenUI.pageLoader();
  RavenUI.smoothScroll();
  RavenComponents.inject();

  const page = document.body.dataset.page;
  switch (page) {
    case 'home':
      initHome();
      break;
    case 'shop':
      RavenProducts.initShopFilters();
      break;
    case 'product':
      initProductPage();
      break;
    case 'cart':
      initCartPage();
      break;
    case 'checkout':
      initCheckoutPage();
      break;
    case 'wishlist':
      initWishlistPage();
      break;
    case 'search':
      initSearchPage();
      break;
    case 'login':
      initLoginPage();
      break;
    case 'register':
      initRegisterPage();
      break;
    case 'otp':
      initOtpPage();
      break;
    case 'forgot':
      initForgotPage();
      break;
    case 'dashboard':
      initUserDashboard();
      break;
    case 'orders':
      initOrdersPage();
      break;
    case 'contact':
      initContactPage();
      break;
  }
});

function initHome() {
  const banners = RavenDB.getBanners();
  const carousel = document.getElementById('hero-carousel-inner');
  if (carousel) {
    carousel.innerHTML = banners
      .map(
        (b, i) => `
      <div class="carousel-item ${i === 0 ? 'active' : ''}">
        <div class="hero-slide" style="background-image:url('${b.image}')">
          <div class="hero-content">
            <h1>${b.title}</h1>
            <p>${b.subtitle}</p>
            <a href="${b.link}" class="btn btn-light btn-lg">Shop Now</a>
          </div>
        </div>
      </div>`
      )
      .join('');
  }

  const flashGrid = document.getElementById('flash-products');
  if (flashGrid) {
    RavenUI.showLoader(flashGrid, 4);
    setTimeout(() => {
      RavenProducts.renderGrid(flashGrid, RavenDB.getProducts({ flashSale: true }).slice(0, 8));
    }, 500);
  }

  const trendGrid = document.getElementById('trending-products');
  if (trendGrid) {
    RavenProducts.renderGrid(trendGrid, RavenDB.getProducts({ trending: true }).slice(0, 8));
  }

  const newGrid = document.getElementById('new-arrivals');
  if (newGrid) {
    RavenProducts.renderGrid(newGrid, RavenDB.getProducts({ isNew: true }).slice(0, 4));
  }

  const featGrid = document.getElementById('featured-products');
  if (featGrid) {
    RavenProducts.renderGrid(featGrid, RavenDB.getProducts({ featured: true }).slice(0, 4));
  }

  const cats = document.getElementById('category-icons');
  if (cats) {
    cats.innerHTML = RavenDB.getCategories()
      .map(
        (c) => `
      <a href="shop.html?category=${c.slug}" class="category-icon-card">
        <span class="cat-icon"><i class="bi ${c.icon}"></i></span>
        <span>${c.name}</span>
      </a>`
      )
      .join('');
  }

  initFlashCountdown();
}

function initFlashCountdown() {
  const el = document.getElementById('flash-countdown');
  if (!el) return;
  let end = Date.now() + 8 * 3600 * 1000;
  const tick = () => {
    const diff = Math.max(0, end - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  tick();
  setInterval(tick, 1000);
}

function initProductPage() {
  const params = RavenUI.getQueryParams();
  const product = RavenDB.getProductById(params.id) || RavenDB.getProductBySlug(params.slug);
  if (!product) {
    document.getElementById('product-root').innerHTML = '<p class="text-center py-5">Product not found.</p>';
    return;
  }

  const salePrice = RavenDB.getSalePrice(product);
  const outOfStock = product.stock === 0;
  document.title = `${product.name} | RAVEN`;

  document.getElementById('product-root').innerHTML = `
    <nav class="breadcrumb-nav container py-2">
      <a href="index.html">Home</a> / <a href="shop.html">Shop</a> / <span>${product.name}</span>
    </nav>
    <section class="container py-4 product-detail">
      <div class="row g-4">
        <div class="col-lg-6">
          <div class="product-gallery">
            <img id="main-product-img" src="${product.images[0]}" alt="${product.name}" class="main-img" />
            <div class="thumb-row">${product.images.map((img, i) => `<img src="${img}" class="thumb ${i === 0 ? 'active' : ''}" data-img="${img}" alt="" />`).join('')}</div>
          </div>
        </div>
        <div class="col-lg-6">
          ${product.badge ? `<span class="badge-product mb-2">${product.badge}</span>` : ''}
          <h1>${product.name}</h1>
          ${RavenUI.starsHtml(product.rating)} <span class="text-muted">(${product.reviewCount} reviews)</span>
          <div class="product-price-lg my-3">
            <span class="price-current">${RavenDB.formatPrice(salePrice)}</span>
            ${product.discount ? `<span class="price-old">${RavenDB.formatPrice(product.price)}</span><span class="save-badge">Save ${product.discount}%</span>` : ''}
          </div>
          <p class="text-muted">${product.description}</p>
          <div class="variant-group">
            <label>Color</label>
            <div class="color-swatches" id="color-swatches">
              ${product.colors.map((c, i) => `<button type="button" class="color-swatch ${i === 0 ? 'active' : ''}" style="background:${c}" data-color="${c}"></button>`).join('')}
            </div>
          </div>
          <div class="variant-group">
            <label>Size</label>
            <div class="size-btns" id="size-btns">
              ${product.sizes.map((s, i) => `<button type="button" class="size-btn ${i === 0 ? 'active' : ''}" data-size="${s}">${s}</button>`).join('')}
            </div>
          </div>
          <p class="stock-info ${outOfStock ? 'text-danger' : 'text-success'}">${outOfStock ? 'Out of Stock' : `${product.stock} in stock`}</p>
          <div class="d-flex gap-2 flex-wrap mt-3">
            <button class="btn btn-dark btn-lg" id="btn-add-cart" ${outOfStock ? 'disabled' : ''}>Add to Cart</button>
            <button class="btn btn-outline-dark btn-lg" id="btn-wishlist"><i class="bi bi-heart"></i></button>
            <button class="btn btn-outline-dark btn-lg" id="btn-buy-now" ${outOfStock ? 'disabled' : ''}>Buy Now</button>
          </div>
        </div>
      </div>
      <div class="row mt-5">
        <div class="col-lg-8">
          <h4>Reviews</h4>
          <div id="reviews-list"></div>
          <form id="review-form" class="review-form mt-4">
            <h5>Write a review</h5>
            <select name="rating" class="form-select mb-2" required>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
            </select>
            <textarea name="text" class="form-control mb-2" placeholder="Your review..." required></textarea>
            <button type="submit" class="btn btn-dark">Submit Review</button>
          </form>
        </div>
      </div>
      <h4 class="mt-5 mb-3">Related Products</h4>
      <div class="product-grid" id="related-products"></div>
    </section>`;

  document.querySelectorAll('.thumb').forEach((t) => {
    t.addEventListener('click', () => {
      document.getElementById('main-product-img').src = t.dataset.img;
      document.querySelectorAll('.thumb').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
    });
  });

  let selectedColor = product.colors[0];
  let selectedSize = product.sizes[0];
  document.querySelectorAll('.color-swatch').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      selectedColor = b.dataset.color;
    })
  );
  document.querySelectorAll('.size-btn').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      selectedSize = b.dataset.size;
    })
  );

  document.getElementById('btn-add-cart')?.addEventListener('click', () => {
    RavenCart.add(product.id, 1, { size: selectedSize, color: selectedColor });
  });
  document.getElementById('btn-buy-now')?.addEventListener('click', () => {
    RavenCart.add(product.id, 1, { size: selectedSize, color: selectedColor });
    window.location.href = 'checkout.html';
  });
  const wlBtn = document.getElementById('btn-wishlist');
  if (wlBtn) {
    const active = RavenCart.isInWishlist(product.id);
    wlBtn.querySelector('i').className = active ? 'bi bi-heart-fill' : 'bi bi-heart';
    wlBtn.addEventListener('click', () => {
      const a = RavenCart.toggleWishlist(product.id);
      wlBtn.querySelector('i').className = a ? 'bi bi-heart-fill' : 'bi bi-heart';
    });
  }

  const reviews = RavenDB.getReviews(product.id);
  document.getElementById('reviews-list').innerHTML =
    reviews.length > 0
      ? reviews.map((r) => `<div class="review-card"><strong>${r.userName}</strong> ${RavenUI.starsHtml(r.rating, true)}<p>${r.text}</p><small class="text-muted">${r.date}</small></div>`).join('')
      : '<p class="text-muted">No reviews yet.</p>';

  document.getElementById('review-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = RavenAuth.getCurrentUser();
    if (!user) {
      RavenUI.toast('Please login to review', 'warning');
      return;
    }
    const fd = new FormData(e.target);
    RavenDB.addReview({
      productId: product.id,
      userId: user.id,
      userName: user.name,
      rating: parseInt(fd.get('rating'), 10),
      text: fd.get('text'),
    });
    RavenUI.toast('Review submitted', 'success');
    location.reload();
  });

  const related = RavenDB.getProducts({ category: product.category }).filter((p) => p.id !== product.id).slice(0, 4);
  RavenProducts.renderGrid(document.getElementById('related-products'), related);
}

function initCartPage() {
  const root = document.getElementById('cart-root');
  const items = RavenCart.getCartDetails();
  if (!items.length) {
    root.innerHTML = `<div class="empty-state text-center py-5"><i class="bi bi-bag display-1"></i><h3>Your cart is empty</h3><a href="shop.html" class="btn btn-dark">Continue Shopping</a></div>`;
    return;
  }
  let subtotal = 0;
  root.innerHTML = `
    <div class="row g-4">
      <div class="col-lg-8">
        <table class="table cart-table">
          <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead>
          <tbody>
            ${items
              .map((item) => {
                subtotal += item.lineTotal;
                return `<tr data-id="${item.productId}" data-size="${item.size}" data-color="${item.color}">
                  <td><img src="${item.product.images[0]}" alt="" class="cart-thumb" />
                    <div><strong>${item.product.name}</strong><br><small>${item.size} · ${item.color}</small></div></td>
                  <td>${RavenDB.formatPrice(item.price)}</td>
                  <td><input type="number" class="form-control form-control-sm qty-input" value="${item.qty}" min="1" max="${item.product.stock}" /></td>
                  <td>${RavenDB.formatPrice(item.lineTotal)}</td>
                  <td><button class="btn btn-sm btn-outline-danger remove-item">&times;</button></td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
      <div class="col-lg-4">
        <div class="cart-summary">
          <h5>Order Summary</h5>
          <div class="d-flex justify-content-between"><span>Subtotal</span><span id="cart-subtotal">${RavenDB.formatPrice(subtotal)}</span></div>
          <a href="checkout.html" class="btn btn-dark w-100 mt-3">Proceed to Checkout</a>
        </div>
      </div>
    </div>`;

  root.querySelectorAll('.qty-input').forEach((input) => {
    input.addEventListener('change', () => {
      const row = input.closest('tr');
      RavenCart.updateQty(row.dataset.id, parseInt(input.value, 10), { size: row.dataset.size, color: row.dataset.color });
      initCartPage();
    });
  });
  root.querySelectorAll('.remove-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      RavenCart.remove(row.dataset.id, { size: row.dataset.size, color: row.dataset.color });
      initCartPage();
    });
  });
}

function initCheckoutPage() {
  if (!RavenCart.getCart().length) {
    window.location.href = 'cart.html';
    return;
  }
  const user = RavenAuth.getCurrentUser();
  const form = document.getElementById('checkout-form');
  if (user && form) {
    form.querySelector('[name="name"]').value = user.name || '';
    form.querySelector('[name="email"]').value = user.email || '';
    form.querySelector('[name="phone"]').value = user.phone || '';
  }

  const summary = document.getElementById('checkout-summary');
  const items = RavenCart.getCartDetails();
  let subtotal = RavenCart.getSubtotal();
  const settings = RavenDB.getSettings();
  const shipping = subtotal >= settings.freeShippingMin ? 0 : settings.shippingFee;

  const renderTotal = () => {
    let discount = 0;
    const code = document.getElementById('coupon-code')?.value;
    if (code) {
      const c = RavenDB.validateCoupon(code, subtotal);
      if (c) discount = c.amount;
    }
    const total = Math.max(0, subtotal + shipping - discount);
    summary.innerHTML = `
      ${items.map((i) => `<div class="d-flex justify-content-between small mb-1"><span>${i.product.name} x${i.qty}</span><span>${RavenDB.formatPrice(i.lineTotal)}</span></div>`).join('')}
      <hr />
      <div class="d-flex justify-content-between"><span>Subtotal</span><span>${RavenDB.formatPrice(subtotal)}</span></div>
      <div class="d-flex justify-content-between"><span>Shipping</span><span>${shipping ? RavenDB.formatPrice(shipping) : 'Free'}</span></div>
      ${discount ? `<div class="d-flex justify-content-between text-success"><span>Discount</span><span>-${RavenDB.formatPrice(discount)}</span></div>` : ''}
      <div class="d-flex justify-content-between fw-bold fs-5 mt-2"><span>Total</span><span>${RavenDB.formatPrice(total)}</span></div>`;
    return { total, discount, shipping };
  };
  renderTotal();

  document.getElementById('apply-coupon')?.addEventListener('click', () => {
    const code = document.getElementById('coupon-code').value;
    if (!RavenDB.validateCoupon(code, subtotal)) RavenUI.toast('Invalid coupon', 'error');
    else {
      RavenUI.toast('Coupon applied', 'success');
      renderTotal();
    }
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const { total, discount, shipping: ship } = renderTotal();
    const session = RavenAuth.getSession();
    const order = {
      userId: session?.id || 'guest',
      customerName: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      address: fd.get('address'),
      city: fd.get('city'),
      payment: fd.get('payment'),
      items: RavenCart.getCart(),
      subtotal,
      shipping: ship,
      discount,
      total,
      status: 'pending',
    };
    RavenDB.saveOrder(order);
    RavenCart.clear();
    document.getElementById('checkout-success').classList.remove('d-none');
    form.classList.add('d-none');
    RavenUI.toast('Order placed successfully!', 'success');
  });
}

function initWishlistPage() {
  const grid = document.getElementById('wishlist-grid');
  const ids = RavenCart.getWishlist();
  const products = ids.map((id) => RavenDB.getProductById(id)).filter(Boolean);
  RavenProducts.renderGrid(grid, products);
}

function initSearchPage() {
  const q = RavenUI.getQueryParams().q || '';
  document.getElementById('search-query').textContent = q ? `Results for "${q}"` : 'Search';
  if (q) RavenUI.saveRecentSearch(q);
  const input = document.getElementById('search-input');
  if (input) input.value = q;
  RavenProducts.renderGrid(document.getElementById('search-grid'), RavenDB.getProducts({ search: q }));
}

function initLoginPage() {
  const params = RavenUI.getQueryParams();
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = getFormSubmitButton(form, e);
    setButtonLoading(btn, true);
    const fd = new FormData(form);
    try {
      const res = await RavenAuth.login(fd.get('email'), fd.get('password'));
      if (res.ok) {
        RavenUI.toast('Welcome back!', 'success');
        window.location.href = params.redirect || 'dashboard.html';
      } else if (res.needsOtp) {
        RavenUI.toast(res.message || 'Check your email for OTP', res.emailSent ? 'success' : 'info');
        window.location.href = 'otp.html';
      } else RavenUI.toast(res.message, 'error');
    } catch (err) {
      console.error(err);
      RavenUI.toast(err.message || 'Login failed', 'error');
    } finally {
      setButtonLoading(btn, false, 'Login');
    }
  });
}

function initRegisterPage() {
  RavenUI.initPasswordToggles(document.getElementById('register-form') || document);
  RavenUI.initPasswordStrength('reg-password', 'password-strength-bar');
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = getFormSubmitButton(form, e);
    setButtonLoading(btn, true, 'Sign Up');
    if (btn) btn.textContent = 'Sending OTP...';

    const fd = new FormData(form);
    if (fd.get('password') !== fd.get('confirm')) {
      RavenUI.toast('Passwords do not match', 'error');
      if (btn) btn.textContent = 'Sign Up';
      setButtonLoading(btn, false);
      return;
    }

    try {
      const res = await RavenAuth.register({
        name: fd.get('name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        password: fd.get('password'),
      });
      if (res.ok) {
        if (res.cloudSynced === false && typeof RavenCloudUsers !== 'undefined' && RavenCloudUsers.isEnabled()) {
          RavenUI.toast('Account saved locally; cloud sync failed — check Supabase config', 'warning');
        }
        RavenUI.toast(
          res.emailSent ? 'OTP sent to your email!' : 'Continue — your code is on the next page',
          res.emailSent ? 'success' : 'warning'
        );
        window.location.href = 'otp.html';
        return;
      }
      RavenUI.toast(res.message || 'Registration failed', 'error');
    } catch (err) {
      console.error('[RAVEN Register]', err);
      RavenUI.toast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      if (btn) btn.textContent = 'Sign Up';
      setButtonLoading(btn, false);
    }
  });
}

function initOtpPage() {
  const email = sessionStorage.getItem('raven_pending_email') || '';
  document.getElementById('otp-email-display').textContent = email;

  const notice = document.getElementById('otp-email-notice');
  const emailSent = sessionStorage.getItem('raven_otp_email_sent') === '1';

  if (notice) {
    if (emailSent) {
      notice.className = 'otp-notice otp-notice-success';
      notice.innerHTML =
        '<i class="bi bi-envelope-check"></i> Verification code sent to <strong>' +
        email +
        '</strong>. Check inbox and spam folder.';
      notice.classList.remove('d-none');
    } else {
      notice.className = 'otp-notice otp-notice-warning';
      notice.innerHTML =
        '<i class="bi bi-exclamation-triangle"></i> We could not send the email. Check <strong>spam/junk</strong>, then tap <strong>Resend</strong> below. If it still fails, try again in a few minutes.';
      notice.classList.remove('d-none');
      sessionStorage.removeItem('raven_otp_fallback');
    }
  }

  const inputs = document.querySelectorAll('.otp-input');
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      if (inp.value.length === 1 && inputs[i + 1]) inputs[i + 1].focus();
    });
  });

  const timerEl = document.getElementById('otp-timer');
  const tick = () => {
    const rem = RavenAuth.getOTPRemaining();
    if (timerEl) timerEl.textContent = rem > 0 ? `Resend in ${rem}s` : '';
    document.getElementById('btn-resend-otp').disabled = rem > 0;
  };
  tick();
  setInterval(tick, 1000);

  document.getElementById('btn-resend-otp')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-resend-otp');
    btn.disabled = true;
    const res = await RavenAuth.resendOTP(email);
    RavenUI.toast(
      res.emailSent ? 'New OTP sent to your email' : 'Could not send email — check spam or try again',
      res.emailSent ? 'success' : 'warning'
    );
    if (notice && !res.emailSent) {
      notice.className = 'otp-notice otp-notice-warning';
      notice.innerHTML =
        '<i class="bi bi-exclamation-triangle"></i> Email not sent. Check spam folder or tap Resend again.';
      notice.classList.remove('d-none');
    } else if (notice && res.emailSent) {
      notice.className = 'otp-notice otp-notice-success';
      notice.innerHTML = '<i class="bi bi-envelope-check"></i> New code sent to <strong>' + email + '</strong>';
      notice.classList.remove('d-none');
    }
    tick();
  });

  document.getElementById('otp-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const otp = Array.from(inputs).map((i) => i.value).join('');
    const res = RavenAuth.verifyOTP(email, otp);
    if (res.ok) {
      sessionStorage.removeItem('raven_otp_fallback');
      sessionStorage.removeItem('raven_otp_email_sent');
      if (sessionStorage.getItem('raven_reset_flow')) {
        window.location.href = 'forgot-password.html?step=reset';
      } else {
        RavenUI.toast('Verified!', 'success');
        window.location.href = 'dashboard.html';
      }
    } else RavenUI.toast(res.message, 'error');
  });
}

function initForgotPage() {
  const params = RavenUI.getQueryParams();
  if (params.step === 'reset') {
    document.getElementById('forgot-step-1').classList.add('d-none');
    document.getElementById('forgot-step-2').classList.remove('d-none');
    document.getElementById('reset-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const email = sessionStorage.getItem('raven_pending_email');
      if (fd.get('password') !== fd.get('confirm')) {
        RavenUI.toast('Passwords do not match', 'error');
        return;
      }
      RavenAuth.resetPassword(email, fd.get('password'));
      RavenUI.toast('Password updated', 'success');
      window.location.href = 'login.html';
    });
    return;
  }
  document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = getFormSubmitButton(form, e);
    setButtonLoading(btn, true);
    const email = new FormData(form).get('email');
    try {
      const res = await RavenAuth.resetPasswordRequest(email);
      if (res.ok) {
        RavenUI.toast(res.emailSent ? 'OTP sent to your email' : 'Check OTP on next page', res.emailSent ? 'success' : 'info');
        window.location.href = 'otp.html';
      } else RavenUI.toast(res.message, 'error');
    } catch (err) {
      console.error(err);
      RavenUI.toast(err.message || 'Request failed', 'error');
    } finally {
      setButtonLoading(btn, false, 'Send OTP');
    }
  });
}

function initUserDashboard() {
  if (!RavenAuth.requireAuth()) return;
  const user = RavenAuth.getCurrentUser();
  document.getElementById('dash-name').textContent = user.name;
  document.getElementById('dash-email').textContent = user.email;
  const orders = RavenDB.getOrders(user.id);
  document.getElementById('dash-order-count').textContent = orders.length;
}

function initOrdersPage() {
  if (!RavenAuth.requireAuth()) return;
  const user = RavenAuth.getCurrentUser();
  const orders = RavenDB.getOrders(user.id);
  const root = document.getElementById('orders-root');
  if (!orders.length) {
    root.innerHTML = '<p class="text-muted">No orders yet.</p>';
    return;
  }
  root.innerHTML = orders
    .map(
      (o) => `
    <div class="order-card">
      <div class="d-flex justify-content-between flex-wrap">
        <strong>#${o.id}</strong>
        <span class="badge bg-secondary">${o.status}</span>
      </div>
      <p class="small text-muted mb-1">${RavenUI.formatDate(o.createdAt)} · ${o.items?.length || 0} items</p>
      <p class="mb-0">Total: <strong>${RavenDB.formatPrice(o.total)}</strong></p>
    </div>`
    )
    .join('');
}

function initContactPage() {
  document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    RavenUI.toast('Message sent! We will reply soon.', 'success');
    e.target.reset();
  });
}
