import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import {
	STARTING_CASH,
	claimAmount,
	parseStake,
	potentialPayout,
	potentialProfit,
	validateTicket,
} from "../skills/sora-market/assets/browser/payout.js";

const skillDir = join(__dirname, "..", "skills", "sora-market");
const browserDir = join(skillDir, "assets", "browser");

describe("sora-market skill", () => {
	it("has valid SKILL.md frontmatter", () => {
		const raw = readFileSync(join(skillDir, "SKILL.md"), "utf8");
		const { data } = matter(raw);
		expect(data.name).toBe("sora-market");
		expect(String(data.description)).toMatch(/Sora Market Browser/i);
		expect(data.metadata?.version).toBe("0.0.0");
	});

	it("ships a playable browser", () => {
		for (const file of [
			"index.html",
			"styles.css",
			"app.js",
			"payout.js",
			"markets.json",
		]) {
			expect(existsSync(join(browserDir, file)), file).toBe(true);
		}

		const html = readFileSync(join(browserDir, "index.html"), "utf8");
		expect(html).toContain('id="search"');
		expect(html).toContain('id="board"');
		expect(html).toContain('data-view="portfolio"');
		expect(html).toContain('id="drawer"');
	});

	it("uses a consistent market schema", () => {
		const markets = JSON.parse(
			readFileSync(join(browserDir, "markets.json"), "utf8"),
		) as Array<{
			id: string;
			question: string;
			category: string;
			status: string;
			volume: number;
			outcomes: Array<{ id: string; label: string; price: number }>;
			resolvedOutcomeId: string | null;
		}>;

		expect(markets.length).toBeGreaterThan(5);
		for (const market of markets) {
			expect(market.id).toBeTruthy();
			expect(market.question.length).toBeGreaterThan(8);
			expect(["sport", "crypto", "tech", "politics", "culture"]).toContain(
				market.category,
			);
			expect(["live", "upcoming", "settled"]).toContain(market.status);
			expect(market.volume).toBeGreaterThan(0);
			expect(market.outcomes.length).toBeGreaterThan(1);
			const priceSum = market.outcomes.reduce((sum, outcome) => sum + outcome.price, 0);
			expect(priceSum).toBeGreaterThan(0.95);
			expect(priceSum).toBeLessThan(1.05);
			if (market.status === "settled") {
				expect(market.resolvedOutcomeId).toBeTruthy();
			}
		}
	});
});

describe("sora-market payout math", () => {
	it("computes payout and profit from price", () => {
		expect(potentialPayout(100, 0.4)).toBeCloseTo(250);
		expect(potentialProfit(100, 0.4)).toBeCloseTo(150);
		expect(potentialPayout(25, 0)).toBe(0);
		expect(potentialPayout(-10, 0.5)).toBe(0);
	});

	it("parses fr/en stake input", () => {
		expect(parseStake("25,5")).toBe(25.5);
		expect(parseStake("")).toBeNaN();
		expect(STARTING_CASH).toBe(1000);
	});

	it("rejects invalid tickets before a write", () => {
		const market = {
			status: "live",
			outcomes: [{ id: "yes", label: "Oui", price: 0.4 }],
		};
		expect(
			validateTicket({
				stake: 25,
				cash: 1000,
				outcome: market.outcomes[0],
				market,
			}),
		).toBeNull();
		expect(
			validateTicket({
				stake: 25,
				cash: 10,
				outcome: market.outcomes[0],
				market,
			}),
		).toBe("Solde insuffisant");
		expect(
			validateTicket({
				stake: 25,
				cash: 1000,
				outcome: market.outcomes[0],
				market: { ...market, status: "settled" },
			}),
		).toBe("Marché déjà réglé");
	});

	it("credits a winning claim only", () => {
		const position = { stake: 40, price: 0.2, outcomeId: "yes" };
		const won = { status: "settled", resolvedOutcomeId: "yes" };
		const lost = { status: "settled", resolvedOutcomeId: "no" };
		expect(claimAmount(position, won)).toBeCloseTo(200);
		expect(claimAmount(position, lost)).toBe(0);
	});
});
