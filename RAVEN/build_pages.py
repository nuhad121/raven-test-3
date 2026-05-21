import os

BASE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = """<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/data.js"></script><script src="js/storage.js"></script><script src="js/auth.js"></script>
<script src="js/cart.js"></script><script src="js/ui.js"></script><script src="js/products.js"></script>
<script src="js/components.js"></script><script src="js/app.js"></script>"""

ADMIN_SCRIPTS = SCRIPTS.replace('src="js/', 'src="../js/') + '\n<script src="../js/admin.js"></script>'


def storefront(title, body, data_page):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>{title}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet"/>
<link href="css/main.css" rel="stylesheet"/>
</head>
<body data-page="{data_page}">
<div id="page-loader"><motion-container class="loader-logo">RAVEN</div></div>
<div id="site-header"></div>
{body}
<div id="site-footer"></div>
{SCRIPTS}
</body>
</html>""".replace("motion-container", "div")


def admin_page(title, body, page_id):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>{title}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet"/>
<link href="../css/main.css" rel="stylesheet"/>
<link href="../css/admin.css" rel="stylesheet"/>
</head>
<body data-admin-page="{page_id}">
<div class="admin-layout">
<aside id="admin-sidebar"></aside>
<div class="admin-main">
<header class="admin-topbar"><h5 class="mb-0">{title.split('|')[0].strip()}</h5><div><button data-theme-toggle class="btn btn-sm btn-outline-secondary me-2"><i class="bi bi-moon"></i></button><span id="admin-user"></span></div></header>
<div class="admin-content">{body}</div>
</div>
</div>
{ADMIN_SCRIPTS}
<script>document.addEventListener('DOMContentLoaded',()=>{{RavenDB.init();RavenAuth.init();if(RavenAdmin.init('{page_id}')){{}}}});</script>
</body>
</html>""".replace("motion-container", "div")


pages = {
    "checkout.html": storefront(
        "Checkout | RAVEN",
        """<main class="container py-5"><h1>Checkout</h1>
<div id="checkout-success" class="alert alert-success d-none">Order placed!</motion-container>
<div class="row g-4"><div class="col-lg-7"><form id="checkout-form" class="auth-card mx-0" style="max-width:none">
<input name="name" class="form-control mb-2" placeholder="Full Name" required/>
<input name="email" type="email" class="form-control mb-2" placeholder="Email" required/>
<input name="phone" class="form-control mb-2" placeholder="Phone" required/>
<textarea name="address" class="form-control mb-2" placeholder="Address" required></textarea>
<input name="city" class="form-control mb-3" value="Dhaka" required/>
<select name="payment" class="form-select mb-3"><option value="cod">COD</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="card">Card</option></select>
<button class="btn btn-dark w-100">Place Order</button></form></div>
<div class="col-lg-5"><div id="checkout-summary" class="checkout-summary"></div>
<div class="mt-3 d-flex gap-2"><input id="coupon-code" class="form-control"/><button id="apply-coupon" class="btn btn-outline-dark">Apply</button></div></div></div></main>""",
        "checkout",
    ),
    "login.html": storefront(
        "Login | RAVEN",
        """<main class="container"><div class="auth-card"><h2 class="text-center">Login</h2>
<form id="login-form"><input name="email" type="email" class="form-control mb-2" required placeholder="Email"/>
<input name="password" type="password" class="form-control mb-3" required placeholder="Password"/>
<button class="btn btn-dark w-100">Login</button></form>
<p class="text-center mt-3"><a href="forgot-password.html">Forgot?</a> · <a href="register.html">Register</a></p></div></main>""",
        "login",
    ),
    "register.html": storefront(
        "Register | RAVEN",
        """<main class="container"><div class="auth-card"><h2 class="text-center">Create Account</h2>
<form id="register-form"><input name="name" class="form-control mb-2" required placeholder="Name"/>
<input name="email" type="email" class="form-control mb-2" required placeholder="Email"/>
<input name="phone" class="form-control mb-2" required placeholder="01XXXXXXXXX"/>
<input name="password" id="reg-password" type="password" class="form-control mb-1" required/>
<div class="progress mb-1" style="height:4px"><div id="password-strength-bar" class="progress-bar"></div></div><small class="text-muted d-block mb-2"></small>
<input name="confirm" type="password" class="form-control mb-3" required placeholder="Confirm"/>
<button class="btn btn-dark w-100">Sign Up</button></form></div></main>""",
        "register",
    ),
    "otp.html": storefront(
        "OTP | RAVEN",
        """<main class="container"><div class="auth-card text-center"><h2>Verify OTP</h2>
<p>Sent to <strong id="otp-email-display"></strong></p>
<form id="otp-form"><div class="d-flex justify-content-center gap-2 mb-3">
<input class="otp-input" maxlength="1"/><input class="otp-input" maxlength="1"/><input class="otp-input" maxlength="1"/>
<input class="otp-input" maxlength="1"/><input class="otp-input" maxlength="1"/><input class="otp-input" maxlength="1"/>
</div><button class="btn btn-dark w-100">Verify</button></form>
<button id="btn-resend-otp" class="btn btn-link">Resend</button> <span id="otp-timer"></span></div></main>""",
        "otp",
    ),
    "forgot-password.html": storefront(
        "Forgot | RAVEN",
        """<main class="container"><div id="forgot-step-1" class="auth-card"><h2>Forgot Password</h2>
<form id="forgot-form"><input name="email" type="email" class="form-control mb-3" required/><button class="btn btn-dark w-100">Send OTP</button></form></div>
<div id="forgot-step-2" class="auth-card d-none"><h2>Reset</h2>
<form id="reset-form"><input name="password" type="password" class="form-control mb-2" required/>
<input name="confirm" type="password" class="form-control mb-3" required/><button class="btn btn-dark w-100">Update</button></form></div></main>""",
        "forgot",
    ),
    "wishlist.html": storefront(
        "Wishlist | RAVEN",
        """<main class="container py-5"><h1>Wishlist</h1><div class="product-grid" id="wishlist-grid"></div></main>""",
        "wishlist",
    ),
    "dashboard.html": storefront(
        "Dashboard | RAVEN",
        """<main class="container py-5"><h1>My Dashboard</h1>
<div class="row g-4"><div class="col-md-4"><div class="auth-card"><h4 id="dash-name"></h4><p id="dash-email" class="text-muted"></p>
<p>Orders: <strong id="dash-order-count">0</strong></p><a href="orders.html" class="btn btn-dark btn-sm">Order History</a></div></div></div></main>""",
        "dashboard",
    ),
    "orders.html": storefront(
        "Orders | RAVEN",
        """<main class="container py-5"><h1>Order History</h1><div id="orders-root"></div></main>""",
        "orders",
    ),
    "search.html": storefront(
        "Search | RAVEN",
        """<main class="container py-5"><h1 id="search-query">Search</h1>
<form action="search.html" class="mb-4"><input id="search-input" name="q" class="form-control" placeholder="Search..."/></form>
<div class="product-grid" id="search-grid"></div></main>""",
        "search",
    ),
    "contact.html": storefront(
        "Contact | RAVEN",
        """<main class="container py-5"><h1>Contact Us</h1><motion-container class="row"><div class="col-md-6">
<form id="contact-form"><input class="form-control mb-2" name="name" placeholder="Name" required/>
<input class="form-control mb-2" name="email" type="email" placeholder="Email" required/>
<textarea class="form-control mb-3" name="message" rows="4" required></textarea>
<button class="btn btn-dark">Send</button></form></div>
<div class="col-md-6"><p>Dhaka, Bangladesh<br>Email: support@raven.bd<br>Phone: 09678-RAVEN-00</p></div></div></main>""",
        "contact",
    ),
    "about.html": storefront(
        "About | RAVEN",
        """<main class="container py-5"><h1>About RAVEN</h1>
<p>RAVEN is a premium online clothing marketplace built for Bangladesh fashion shoppers. We curate streetwear, essentials, and limited drops with a focus on quality and modern design.</p>
<p>Inspired by leading eCommerce experiences, RAVEN brings you a seamless shopping journey—from discovery to checkout.</p></main>""",
        "contact",
    ),
    "cart.html": storefront(
        "Cart | RAVEN",
        """<main class="container py-5"><h1>Cart</h1><div id="cart-root"></div></main>""",
        "cart",
    ),
}

for name, html in pages.items():
    html = html.replace("motion-container", "div")
    path = os.path.join(BASE, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", name)

# Admin pages
admin_pages = {
    "admin-login.html": """<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Admin Login | RAVEN</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
<link href="../css/main.css" rel="stylesheet"/><link href="../css/admin.css" rel="stylesheet"/></head>
<body class="bg-dark text-white"><main class="container min-vh-100 d-flex align-items-center justify-content-center">
<div class="auth-card bg-white text-dark"><h2 class="text-center">RAVEN Admin</h2>
<form id="admin-login-form"><input name="email" type="email" class="form-control mb-2" placeholder="Admin email" required/>
<input name="password" type="password" class="form-control mb-3" placeholder="Password" required/>
<button class="btn btn-dark w-100">Login</button></form>
<p class="small text-muted mt-3 text-center">Authorized admin only</p></div></main>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="../js/data.js"></script><script src="../js/storage.js"></script><script src="../js/auth.js"></script><script src="../js/ui.js"></script>
<script>document.addEventListener('DOMContentLoaded',()=>{RavenDB.init();RavenAuth.init();initAdminLogin();});</script></body></html>""",
    "dashboard.html": """<div class="row g-3 mb-4">
<div class="col-md-3"><div class="stat-card"><p>Revenue</p><h3 id="stat-revenue">৳0</h3></div></div>
<div class="col-md-3"><div class="stat-card"><p>Orders</p><h3 id="stat-orders">0</h3></div></div>
<div class="col-md-3"><motion-container class="stat-card"><p>Products</p><h3 id="stat-products">0</h3></div></div>
<div class="col-md-3"><div class="stat-card"><p>Customers</p><h3 id="stat-users">0</h3></div></div></motion-container>
<div class="row g-4"><div class="col-lg-7"><div class="admin-table p-3"><h6>Recent Orders</h6>
<table class="table table-sm"><thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody id="recent-orders"></tbody></table></div></div>
<div class="col-lg-5"><div class="admin-table p-3"><h6>Activity</h6>
<table class="table table-sm"><thead><tr><th>Event</th><th>User</th><th>Date</th></tr></thead><tbody id="user-activity"></tbody></table></div></div></div>""",
    "products.html": """<div class="d-flex justify-content-between mb-3"><h5>Products</h5><button id="btn-add-product" class="btn btn-dark btn-sm">Add Product</button></div>
<div class="admin-table"><table class="table"><thead><tr><th></th><th>Name</th><th>Cat</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody id="products-table"></tbody></table></div>
<div class="modal fade" id="productModal"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-body">
<form id="product-form"><input type="hidden" name="id"/>
<input name="name" class="form-control mb-2" placeholder="Name" required/>
<input name="category" class="form-control mb-2" placeholder="category slug" required/>
<input name="price" type="number" class="form-control mb-2" required/>
<input name="discount" type="number" class="form-control mb-2" value="0"/>
<input name="stock" type="number" class="form-control mb-2" required/>
<select name="status" class="form-select mb-2"><option value="active">active</option><option value="draft">draft</option></select>
<input name="badge" class="form-control mb-2" placeholder="badge"/>
<input name="image" class="form-control mb-2" placeholder="image URL" required/>
<textarea name="description" class="form-control mb-2"></textarea>
<input name="colors" class="form-control mb-2" placeholder="#000, #fff"/>
<input name="sizes" class="form-control mb-2" placeholder="S, M, L"/>
<label><input type="checkbox" name="featured"/> Featured</label>
<label><input type="checkbox" name="flashSale"/> Flash</label>
<label><input type="checkbox" name="trending"/> Trending</label>
<label><input type="checkbox" name="isNew"/> New</label>
<button class="btn btn-dark mt-2">Save</button></form></motion-container></div></div></div>""",
    "orders.html": """<h5>Orders</h5><div class="admin-table"><table class="table"><thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody id="orders-table"></tbody></table></div>""",
    "users.html": """<h5>Customers</h5><div class="admin-table"><table class="table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Verified</th><th>Joined</th></tr></thead><tbody id="users-table"></tbody></table></div>""",
    "analytics.html": """<div class="row g-3 mb-4">
<div class="col-md-3"><div class="stat-card"><p>Revenue</p><h3 id="an-revenue">0</h3></div></div>
<div class="col-md-3"><div class="stat-card"><p>Orders</p><h3 id="an-orders">0</h3></div></div>
<div class="col-md-3"><div class="stat-card"><p>Pending</p><h3 id="an-pending">0</h3></div></div>
<div class="col-md-3"><div class="stat-card"><p>Low Stock</p><h3 id="an-lowstock">0</h3></div></div></div>
<div class="chart-wrap"><canvas id="sales-chart" width="600" height="200"></canvas><p class="small text-muted mt-2">Out of stock: <span id="an-oos">0</span></p></div>""",
    "categories.html": """<div class="row"><div class="col-md-6"><h5>Categories</h5><div id="categories-list"></div></div>
<div class="col-md-6"><form id="category-form" class="border p-3 rounded"><h6>Add Category</h6>
<input name="name" class="form-control mb-2" required/><input name="slug" class="form-control mb-2" required/>
<input name="icon" class="form-control mb-2" placeholder="bi-tag"/><button class="btn btn-dark btn-sm">Add</button></form></div></div>""",
    "reviews.html": """<h5>Reviews</h5><div class="admin-table"><table class="table"><thead><tr><th>Product</th><th>User</th><th>Rating</th><th>Text</th><th>Date</th></tr></thead><tbody id="reviews-table"></tbody></table></div>""",
    "coupons.html": """<div class="row g-4"><div class="col-md-5"><form id="coupon-form" class="border p-3"><h6>Add Coupon</h6>
<input name="code" class="form-control mb-2" required/><input name="discount" type="number" class="form-control mb-2" required/>
<select name="type" class="form-select mb-2"><option value="percent">percent</option><option value="flat">flat</option></select>
<input name="minOrder" type="number" class="form-control mb-2" value="1500"/><button class="btn btn-dark btn-sm">Add</button></form></div>
<div class="col-md-7"><table class="table"><thead><tr><th>Code</th><th>Discount</th><th>Min</th><th>Status</th><th></th></tr></thead><tbody id="coupons-table"></tbody></table></div></motion-container>""",
    "banners.html": """<form id="banner-form" class="border p-3 mb-4"><h6>Add Banner</h6>
<input name="title" class="form-control mb-2" required/><input name="subtitle" class="form-control mb-2"/>
<input name="image" class="form-control mb-2" placeholder="image URL" required/>
<input name="link" class="form-control mb-2" value="shop.html"/><button class="btn btn-dark btn-sm">Add</button></form>
<div class="row g-3" id="banners-grid"></div>""",
    "settings.html": """<form id="settings-form" class="row g-4"><div class="col-md-6">
<h5>Website Settings</h5><input name="siteName" class="form-control mb-2"/>
<input name="shippingFee" type="number" class="form-control mb-2"/>
<input name="freeShippingMin" type="number" class="form-control mb-2"/>
<textarea name="newsletterText" class="form-control mb-2"></textarea>
<button class="btn btn-dark">Save Settings</button></div>
<div class="col-md-6"><h5>Featured Products</h5><select id="featured-select" class="form-select" multiple size="8"></select></div></form>""",
}

admin_dir = os.path.join(BASE, "admin")
os.makedirs(admin_dir, exist_ok=True)

with open(os.path.join(admin_dir, "admin-login.html"), "w", encoding="utf-8") as f:
    f.write(admin_pages["admin-login.html"].replace("motion-container", "div"))
print("wrote admin-login.html")

for fname, body in admin_pages.items():
    if fname == "admin-login.html":
        continue
    title = fname.replace(".html", "").title() + " | RAVEN Admin"
    html = admin_page(title, body.replace("motion-container", "div"), fname.replace(".html", ""))
    html = html.replace("motion-container", "div")
    with open(os.path.join(admin_dir, fname), "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote admin/" + fname)

print("done")
