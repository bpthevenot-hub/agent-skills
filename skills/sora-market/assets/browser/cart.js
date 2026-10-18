export const FREE_SHIPPING_FROM = 15;
export const SHIPPING_FEE = 2.99;

export function formatMoney(value) {
	const amount = Number(value);
	if (!Number.isFinite(amount)) return "—";
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "EUR",
	}).format(amount);
}

export function discountPercent(price, compareAt) {
	if (!(compareAt > price) || price <= 0) return 0;
	return Math.round((1 - price / compareAt) * 100);
}

export function parseQty(raw) {
	const value = Number.parseInt(String(raw).trim(), 10);
	return Number.isInteger(value) ? value : NaN;
}

export function lineTotal(line) {
	return Number(line.price) * Number(line.qty);
}

export function cartSubtotal(items) {
	return items.reduce((sum, line) => sum + lineTotal(line), 0);
}

export function shippingCost(subtotal) {
	if (!(subtotal > 0)) return 0;
	return subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
}

export function cartTotal(items) {
	const subtotal = cartSubtotal(items);
	return subtotal + shippingCost(subtotal);
}

export function cartCount(items) {
	return items.reduce((sum, line) => sum + Number(line.qty), 0);
}

export function validateAdd({ product, qty, variantId }) {
	if (!product) return "Produit introuvable";
	if (!Number.isInteger(qty) || qty < 1) return "Quantité invalide";
	if (qty > product.stock) return "Stock insuffisant";
	if (product.variants?.length && !variantId) return "Choisis une option";
	if (
		product.variants?.length &&
		!product.variants.some((variant) => variant.id === variantId)
	) {
		return "Option indisponible";
	}
	return null;
}

export function upsertLine(cart, line) {
	const index = cart.findIndex(
		(item) => item.productId === line.productId && item.variantId === line.variantId,
	);
	if (index === -1) return [line, ...cart];
	return cart.map((item, itemIndex) =>
		itemIndex === index ? { ...item, qty: item.qty + line.qty, price: line.price } : item,
	);
}

export function setLineQty(cart, key, qty) {
	if (!Number.isInteger(qty) || qty < 1) {
		return cart.filter((item) => `${item.productId}:${item.variantId}` !== key);
	}
	return cart.map((item) =>
		`${item.productId}:${item.variantId}` === key ? { ...item, qty } : item,
	);
}

export function validateCheckout({ cart, name, city }) {
	if (!cart.length) return "Panier vide";
	if (!String(name ?? "").trim()) return "Indique un nom";
	if (!String(city ?? "").trim()) return "Indique une ville";
	return null;
}
