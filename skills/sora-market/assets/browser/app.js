import {
	cartCount,
	cartSubtotal,
	cartTotal,
	discountPercent,
	formatMoney,
	parseQty,
	setLineQty,
	shippingCost,
	upsertLine,
	validateAdd,
	validateCheckout,
} from "./cart.js";

const KEYS = {
	cart: "sora-market:cart",
	wishlist: "sora-market:wishlist",
	orders: "sora-market:orders",
};

const CATEGORIES = [
	["all", "Tout"],
	["electronique", "Électronique"],
	["mode", "Mode"],
	["maison", "Maison"],
	["beaute", "Beauté"],
	["sport", "Sport"],
	["auto", "Auto"],
	["jouets", "Jouets"],
	["jardin", "Jardin"],
];

const state = {
	products: [],
	query: "",
	category: "all",
	freeShipping: false,
	minRating: 0,
	sort: "orders",
	view: "catalog",
	selectedId: null,
	variantId: null,
	qty: "1",
	error: "",
	checkout: { name: "", city: "", address: "" },
};

function loadJson(key, fallback) {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		const value = JSON.parse(raw);
		return Array.isArray(value) ? value : fallback;
	} catch {
		return fallback;
	}
}

function saveAll() {
	localStorage.setItem(KEYS.cart, JSON.stringify(cart));
	localStorage.setItem(KEYS.wishlist, JSON.stringify(wishlist));
	localStorage.setItem(KEYS.orders, JSON.stringify(orders));
}

let cart = loadJson(KEYS.cart, []);
let wishlist = loadJson(KEYS.wishlist, []);
let orders = loadJson(KEYS.orders, []);

const els = {
	search: document.querySelector("#search"),
	cats: document.querySelector("#cats"),
	hero: document.querySelector("#hero"),
	flash: document.querySelector("#flash"),
	flashRow: document.querySelector("#flash-row"),
	toolbar: document.querySelector("#toolbar"),
	grid: document.querySelector("#grid"),
	page: document.querySelector("#page"),
	overlay: document.querySelector("#overlay"),
	sheet: document.querySelector("#sheet"),
	toast: document.querySelector("#toast"),
	cartCount: document.querySelector("#cart-count"),
	wishCount: document.querySelector("#wish-count"),
	shipFilter: document.querySelector("#ship-filter"),
	ratingFilter: document.querySelector("#rating-filter"),
	sort: document.querySelector("#sort"),
};

function productById(id) {
	return state.products.find((product) => product.id === id) ?? null;
}

function selectedProduct() {
	return productById(state.selectedId);
}

function visibleProducts(source = state.products) {
	const needle = state.query.trim().toLowerCase();
	const filtered = source.filter((product) => {
		const haystack = `${product.title} ${product.store} ${product.category}`.toLowerCase();
		const matchesQuery = !needle || haystack.includes(needle);
		const matchesCategory = state.category === "all" || product.category === state.category;
		const matchesShip = !state.freeShipping || product.freeShipping;
		const matchesRating = product.rating >= state.minRating;
		return matchesQuery && matchesCategory && matchesShip && matchesRating;
	});
	return [...filtered].sort((a, b) => {
		if (state.sort === "price-asc") return a.price - b.price;
		if (state.sort === "price-desc") return b.price - a.price;
		if (state.sort === "discount") {
			return discountPercent(b.price, b.compareAt) - discountPercent(a.price, a.compareAt);
		}
		return b.orders - a.orders;
	});
}

function showToast(message) {
	els.toast.textContent = message;
	els.toast.classList.toggle("show", Boolean(message));
	if (message) {
		window.setTimeout(() => {
			if (els.toast.textContent === message) showToast("");
		}, 2600);
	}
}

function renderHeader() {
	els.cartCount.textContent = String(cartCount(cart));
	els.wishCount.textContent = String(wishlist.length);
}

function renderCats() {
	els.cats.innerHTML = CATEGORIES.map(
		([id, label]) =>
			`<button type="button" data-category="${id}" aria-pressed="${state.category === id}">${label}</button>`,
	).join("");
}

function cardHtml(product, compact = false) {
	const off = discountPercent(product.price, product.compareAt);
	return `
    <button class="card" type="button" data-open="${product.id}">
      <div class="thumb" style="background:${product.accent}22">${product.emoji}</div>
      <div class="card-body">
        <strong>${product.title}</strong>
        <p class="price">
          ${formatMoney(product.price)}
          <span class="compare">${formatMoney(product.compareAt)}</span>
          ${off ? `<span class="off">-${off}%</span>` : ""}
        </p>
        ${compact ? "" : `<p class="meta">★ ${product.rating.toFixed(1)} · ${product.orders.toLocaleString("fr-FR")} commandes</p>`}
        <p class="ship ${product.freeShipping ? "free" : ""}">
          ${product.freeShipping ? "Livraison gratuite" : `Expédié de ${product.shipsFrom}`}
        </p>
      </div>
    </button>
  `;
}

function renderCatalog() {
	els.hero.hidden = false;
	els.toolbar.hidden = false;
	els.grid.hidden = false;
	els.page.hidden = true;
	els.overlay.hidden = true;

	const flash = visibleProducts(state.products.filter((product) => product.flash));
	els.flash.hidden = flash.length === 0;
	els.flashRow.innerHTML = flash.slice(0, 4).map((product) => cardHtml(product, true)).join("");

	const products = visibleProducts();
	if (products.length === 0) {
		els.grid.innerHTML = `
      <div class="empty" role="status">
        <h2>Aucun produit</h2>
        <p>Aucun résultat pour ces filtres. Efface la recherche ou change de catégorie.</p>
      </div>`;
		return;
	}
	els.grid.innerHTML = products.map((product) => cardHtml(product)).join("");
}

function openProduct(id) {
	const product = productById(id);
	if (!product) return;
	state.selectedId = id;
	state.variantId = product.variants[0]?.id ?? null;
	state.qty = "1";
	state.error = "";
	renderProduct();
}

function renderProduct() {
	const product = selectedProduct();
	if (!product) {
		els.overlay.hidden = true;
		return;
	}
	const wished = wishlist.includes(product.id);
	const variant = product.variants.find((item) => item.id === state.variantId);
	els.overlay.hidden = false;
	els.sheet.innerHTML = `
    <div class="sheet-head">
      <div class="thumb" style="width:120px;height:120px;border-radius:16px;background:${product.accent}22">${product.emoji}</div>
      <button class="close" type="button" data-close>Fermer</button>
    </div>
    <h2>${product.title}</h2>
    <p class="price">${formatMoney(product.price)} <span class="compare">${formatMoney(product.compareAt)}</span></p>
    <p class="meta">★ ${product.rating.toFixed(1)} · ${product.orders.toLocaleString("fr-FR")} commandes · ${product.store}</p>
    <p class="ship ${product.freeShipping ? "free" : ""}">
      ${product.freeShipping ? "Livraison gratuite" : `Frais selon panier`} · ${product.shipsFrom} · ${product.deliveryMin}–${product.deliveryMax} jours
    </p>
    <div class="variants">
      ${product.variants
				.map(
					(item) =>
						`<button class="chip" type="button" data-variant="${item.id}" aria-pressed="${item.id === state.variantId}">${item.label}</button>`,
				)
				.join("")}
    </div>
    <ul>${product.bullets.map((item) => `<li>${item}</li>`).join("")}</ul>
    <div class="qty-row">
      <label>Qté <input id="qty" type="number" min="1" max="${product.stock}" value="${state.qty}" /></label>
      <span>${product.stock} en stock</span>
    </div>
    <p class="error">${state.error}</p>
    <div class="row">
      <button class="ghost" type="button" data-wish>${wished ? "Retirer des favoris" : "Ajouter aux favoris"}</button>
      <button class="primary" type="button" data-add>Ajouter au panier${variant ? ` · ${variant.label}` : ""}</button>
      <button class="primary buy" type="button" data-buy>Acheter</button>
    </div>
  `;
}

function renderCart() {
	els.hero.hidden = true;
	els.flash.hidden = true;
	els.toolbar.hidden = true;
	els.grid.hidden = true;
	els.overlay.hidden = true;
	els.page.hidden = false;

	if (cart.length === 0) {
		els.page.innerHTML = `
      <div class="empty">
        <h2>Panier vide</h2>
        <p>Ajoute un article depuis le catalogue pour le retrouver ici.</p>
        <button class="primary" type="button" data-view="catalog">Retour boutique</button>
      </div>`;
		return;
	}

	const subtotal = cartSubtotal(cart);
	const shipping = shippingCost(subtotal);
	els.page.innerHTML = `
    <h2>Panier</h2>
    ${cart
			.map((line) => {
				const product = productById(line.productId);
				const key = `${line.productId}:${line.variantId}`;
				return `
          <div class="cart-line">
            <div>
              <strong>${product?.title ?? "Article retiré"}</strong>
              <p class="meta">${line.variantLabel} · ${formatMoney(line.price)}</p>
            </div>
            <label>Qté
              <input data-qty="${key}" type="number" min="1" max="${product?.stock ?? line.qty}" value="${line.qty}" />
            </label>
            <strong>${formatMoney(line.price * line.qty)}</strong>
          </div>`;
			})
			.join("")}
    <div class="totals">
      <div class="row"><span>Sous-total</span><strong>${formatMoney(subtotal)}</strong></div>
      <div class="row"><span>Livraison</span><strong>${shipping ? formatMoney(shipping) : "Offerte"}</strong></div>
      <div class="row"><span>Total</span><strong>${formatMoney(cartTotal(cart))}</strong></div>
    </div>
    <button class="primary buy" type="button" data-view="checkout">Passer commande</button>
  `;
}

function renderWishlist() {
	els.hero.hidden = true;
	els.flash.hidden = true;
	els.toolbar.hidden = true;
	els.grid.hidden = false;
	els.page.hidden = true;
	els.overlay.hidden = true;
	const products = state.products.filter((product) => wishlist.includes(product.id));
	if (products.length === 0) {
		els.grid.innerHTML = `
      <div class="empty">
        <h2>Aucun favori</h2>
        <p>Ajoute un cœur depuis une fiche produit.</p>
      </div>`;
		return;
	}
	els.grid.innerHTML = products.map((product) => cardHtml(product)).join("");
}

function renderCheckout() {
	els.hero.hidden = true;
	els.flash.hidden = true;
	els.toolbar.hidden = true;
	els.grid.hidden = true;
	els.overlay.hidden = true;
	els.page.hidden = false;
	els.page.innerHTML = `
    <h2>Commande</h2>
    <p class="meta">Paiement démo — aucune carte n’est débitée.</p>
    <p>Total à payer : <strong>${formatMoney(cartTotal(cart))}</strong></p>
    <label>Nom<input id="name" value="${state.checkout.name}" /></label>
    <label>Ville<input id="city" value="${state.checkout.city}" /></label>
    <label>Adresse<input id="address" value="${state.checkout.address}" /></label>
    <p class="error">${state.error}</p>
    <button class="primary buy" type="button" data-place>Confirmer la commande</button>
  `;
}

function renderOrders() {
	els.hero.hidden = true;
	els.flash.hidden = true;
	els.toolbar.hidden = true;
	els.grid.hidden = true;
	els.overlay.hidden = true;
	els.page.hidden = false;
	if (orders.length === 0) {
		els.page.innerHTML = `
      <div class="empty">
        <h2>Pas encore de commande</h2>
        <p>Tes commandes démo apparaîtront ici.</p>
      </div>`;
		return;
	}
	els.page.innerHTML = `
    <h2>Commandes</h2>
    ${orders
			.map(
				(order) => `
        <article class="cart-line">
          <div>
            <strong>${order.id}</strong>
            <p class="meta">${new Date(order.createdAt).toLocaleString("fr-FR")} · ${order.city}</p>
            <p>${order.lines.map((line) => `${line.title} ×${line.qty}`).join(" · ")}</p>
          </div>
          <strong>${formatMoney(order.total)}</strong>
        </article>`,
			)
			.join("")}
  `;
}

function render() {
	renderHeader();
	renderCats();
	if (state.view === "cart") return renderCart();
	if (state.view === "wishlist") return renderWishlist();
	if (state.view === "checkout") return renderCheckout();
	if (state.view === "orders") return renderOrders();
	renderCatalog();
}

function addToCart(goCheckout = false) {
	const product = selectedProduct();
	const qty = parseQty(state.qty);
	const existing = cart.find(
		(line) => line.productId === product?.id && line.variantId === state.variantId,
	);
	const error = validateAdd({
		product,
		qty: (existing?.qty ?? 0) + qty,
		variantId: state.variantId,
	});
	if (error) {
		state.error = error;
		renderProduct();
		return;
	}
	const variant = product.variants.find((item) => item.id === state.variantId);
	cart = upsertLine(cart, {
		productId: product.id,
		variantId: state.variantId,
		variantLabel: variant?.label ?? "",
		title: product.title,
		price: product.price,
		qty,
	});
	saveAll();
	state.error = "";
	showToast(`${product.title} ajouté au panier`);
	if (goCheckout) {
		state.view = "checkout";
		els.overlay.hidden = true;
	}
	render();
}

function toggleWish(id) {
	wishlist = wishlist.includes(id)
		? wishlist.filter((item) => item !== id)
		: [...wishlist, id];
	saveAll();
	render();
	if (state.selectedId) renderProduct();
}

function placeOrder() {
	const error = validateCheckout({
		cart,
		name: state.checkout.name,
		city: state.checkout.city,
	});
	if (error) {
		state.error = error;
		renderCheckout();
		return;
	}
	orders = [
		{
			id: `SM-${Date.now()}`,
			createdAt: new Date().toISOString(),
			name: state.checkout.name.trim(),
			city: state.checkout.city.trim(),
			address: state.checkout.address.trim(),
			total: cartTotal(cart),
			lines: cart.map((line) => ({
				title: line.title,
				qty: line.qty,
				price: line.price,
			})),
		},
		...orders,
	];
	cart = [];
	saveAll();
	state.error = "";
	state.view = "orders";
	showToast("Commande confirmée (démo)");
	render();
}

function bind() {
	els.search.addEventListener("input", (event) => {
		state.query = event.target.value;
		if (state.view !== "catalog") state.view = "catalog";
		render();
	});
	document.querySelector("#search-btn").addEventListener("click", () => {
		state.view = "catalog";
		render();
	});
	els.cats.addEventListener("click", (event) => {
		const button = event.target.closest("[data-category]");
		if (!button) return;
		state.category = button.dataset.category;
		state.view = "catalog";
		render();
	});
	els.shipFilter.addEventListener("change", (event) => {
		state.freeShipping = event.target.checked;
		state.view = "catalog";
		render();
	});
	els.ratingFilter.addEventListener("change", (event) => {
		state.minRating = Number(event.target.value);
		render();
	});
	els.sort.addEventListener("change", (event) => {
		state.sort = event.target.value;
		render();
	});
	document.querySelector("#quick").addEventListener("click", (event) => {
		const button = event.target.closest("[data-view]");
		if (!button) return;
		state.view = button.dataset.view;
		state.selectedId = null;
		render();
	});
	document.querySelector(".logo").addEventListener("click", (event) => {
		event.preventDefault();
		state.view = "catalog";
		state.category = "all";
		state.query = "";
		els.search.value = "";
		render();
	});
	els.grid.addEventListener("click", (event) => {
		const button = event.target.closest("[data-open]");
		if (!button) return;
		openProduct(button.dataset.open);
	});
	els.flashRow.addEventListener("click", (event) => {
		const button = event.target.closest("[data-open]");
		if (!button) return;
		openProduct(button.dataset.open);
	});
	els.overlay.addEventListener("click", (event) => {
		if (event.target === els.overlay || event.target.closest("[data-close]")) {
			state.selectedId = null;
			els.overlay.hidden = true;
			return;
		}
		const variant = event.target.closest("[data-variant]");
		if (variant) {
			state.variantId = variant.dataset.variant;
			state.error = "";
			renderProduct();
			return;
		}
		if (event.target.closest("[data-wish]")) return toggleWish(state.selectedId);
		if (event.target.closest("[data-add]")) return addToCart(false);
		if (event.target.closest("[data-buy]")) return addToCart(true);
	});
	els.overlay.addEventListener("input", (event) => {
		if (event.target.id !== "qty") return;
		state.qty = event.target.value;
	});
	els.page.addEventListener("click", (event) => {
		const view = event.target.closest("[data-view]");
		if (view) {
			state.view = view.dataset.view;
			render();
			return;
		}
		if (event.target.closest("[data-place]")) placeOrder();
	});
	els.page.addEventListener("input", (event) => {
		if (event.target.id === "name") state.checkout.name = event.target.value;
		if (event.target.id === "city") state.checkout.city = event.target.value;
		if (event.target.id === "address") state.checkout.address = event.target.value;
		const qtyInput = event.target.closest("[data-qty]");
		if (qtyInput) {
			cart = setLineQty(cart, qtyInput.dataset.qty, parseQty(qtyInput.value));
			saveAll();
			renderCart();
			renderHeader();
		}
	});
	document.addEventListener("keydown", (event) => {
		if (event.key === "/" && document.activeElement !== els.search) {
			event.preventDefault();
			els.search.focus();
		}
		if (event.key === "Escape") {
			state.selectedId = null;
			els.overlay.hidden = true;
		}
	});
}

async function start() {
	bind();
	try {
		const response = await fetch("./products.json");
		if (!response.ok) throw new Error("Catalogue indisponible");
		state.products = await response.json();
		if (!Array.isArray(state.products) || state.products.length === 0) {
			throw new Error("Catalogue vide");
		}
	} catch (error) {
		els.grid.innerHTML = `
      <div class="empty" role="alert">
        <h2>Impossible de charger la boutique</h2>
        <p>${error instanceof Error ? error.message : "Erreur inconnue"}</p>
      </div>`;
		return;
	}
	render();
}

void start();
