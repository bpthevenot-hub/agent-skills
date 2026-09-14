import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import {
	FREE_SHIPPING_FROM,
	cartCount,
	cartSubtotal,
	cartTotal,
	discountPercent,
	parseQty,
	shippingCost,
	upsertLine,
	validateAdd,
	validateCheckout,
} from "../skills/sora-market/assets/browser/cart.js";

const skillDir = join(__dirname, "..", "skills", "sora-market");
const browserDir = join(skillDir, "assets", "browser");

describe("sora-market skill", () => {
	it("has valid SKILL.md frontmatter for an AliExpress-style shop", () => {
		const raw = readFileSync(join(skillDir, "SKILL.md"), "utf8");
		const { data } = matter(raw);
		expect(data.name).toBe("sora-market");
		expect(String(data.description)).toMatch(/AliExpress/i);
		expect(String(data.description)).not.toMatch(/prediction/i);
		expect(data.metadata?.version).toBe("0.0.0");
		expect(raw).not.toMatch(/paper-trading|marché de prédiction|payout/i);
	});

	it("ships a playable storefront", () => {
		for (const file of [
			"index.html",
			"styles.css",
			"app.js",
			"cart.js",
			"products.json",
		]) {
			expect(existsSync(join(browserDir, file)), file).toBe(true);
		}

		const html = readFileSync(join(browserDir, "index.html"), "utf8");
		expect(html).toContain('id="search"');
		expect(html).toContain('id="grid"');
		expect(html).toContain('data-view="cart"');
		expect(html).toContain('id="overlay"');
		expect(html).not.toContain("paper trading");
	});

	it("uses a consistent product catalog", () => {
		const products = JSON.parse(
			readFileSync(join(browserDir, "products.json"), "utf8"),
		) as Array<{
			id: string;
			title: string;
			category: string;
			price: number;
			compareAt: number;
			rating: number;
			orders: number;
			stock: number;
			variants: Array<{ id: string; label: string }>;
		}>;

		expect(products.length).toBeGreaterThan(10);
		const categories = new Set(products.map((product) => product.category));
		expect(categories.has("electronique")).toBe(true);
		expect(categories.has("mode")).toBe(true);
		for (const product of products) {
			expect(product.id).toBeTruthy();
			expect(product.title.length).toBeGreaterThan(8);
			expect(product.price).toBeGreaterThan(0);
			expect(product.compareAt).toBeGreaterThan(product.price);
			expect(product.rating).toBeGreaterThanOrEqual(4);
			expect(product.orders).toBeGreaterThan(0);
			expect(product.stock).toBeGreaterThan(0);
			expect(product.variants.length).toBeGreaterThan(0);
		}
	});
});

describe("sora-market cart math", () => {
	it("formats discount and shipping", () => {
		expect(discountPercent(18.9, 39.9)).toBe(53);
		expect(FREE_SHIPPING_FROM).toBe(15);
		expect(shippingCost(10)).toBe(2.99);
		expect(shippingCost(15)).toBe(0);
		expect(parseQty("2")).toBe(2);
	});

	it("rejects invalid add-to-cart payloads", () => {
		const product = {
			stock: 3,
			variants: [{ id: "black", label: "Noir" }],
		};
		expect(validateAdd({ product, qty: 1, variantId: "black" })).toBeNull();
		expect(validateAdd({ product, qty: 8, variantId: "black" })).toBe(
			"Stock insuffisant",
		);
		expect(validateAdd({ product, qty: 1, variantId: null })).toBe(
			"Choisis une option",
		);
	});

	it("merges the same variant and totals the cart", () => {
		const first = upsertLine([], {
			productId: "p-1",
			variantId: "black",
			price: 10,
			qty: 1,
		});
		const merged = upsertLine(first, {
			productId: "p-1",
			variantId: "black",
			price: 10,
			qty: 2,
		});
		expect(merged).toHaveLength(1);
		expect(merged[0]?.qty).toBe(3);
		expect(cartCount(merged)).toBe(3);
		expect(cartSubtotal(merged)).toBe(30);
		expect(cartTotal(merged)).toBe(30);
	});

	it("blocks empty checkout", () => {
		expect(validateCheckout({ cart: [], name: "Ada", city: "Lyon" })).toBe(
			"Panier vide",
		);
		expect(
			validateCheckout({
				cart: [{ price: 10, qty: 2 }],
				name: "Ada",
				city: "Lyon",
			}),
		).toBeNull();
	});
});
