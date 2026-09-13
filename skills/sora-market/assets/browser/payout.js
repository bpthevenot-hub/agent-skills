export const STARTING_CASH = 1000;

export function toCents(price) {
	if (!Number.isFinite(price)) return 0;
	return Math.round(price * 100);
}

export function impliedPercent(price) {
	return `${toCents(price)} %`;
}

export function formatUsd(value) {
	const amount = Number(value);
	if (!Number.isFinite(amount)) return "—";
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	}).format(amount);
}

export function formatCompactUsd(value) {
	const amount = Number(value);
	if (!Number.isFinite(amount)) return "—";
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "USD",
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(amount);
}

export function potentialPayout(stake, price) {
	const s = Number(stake);
	const p = Number(price);
	if (!Number.isFinite(s) || !Number.isFinite(p) || s <= 0 || p <= 0 || p >= 1) {
		return 0;
	}
	return s / p;
}

export function potentialProfit(stake, price) {
	const payout = potentialPayout(stake, price);
	if (payout === 0) return 0;
	return payout - Number(stake);
}

export function parseStake(raw) {
	if (typeof raw !== "string" && typeof raw !== "number") return NaN;
	const normalized = String(raw).replace(",", ".").trim();
	if (normalized === "") return NaN;
	const value = Number(normalized);
	return Number.isFinite(value) ? value : NaN;
}

export function validateTicket({ stake, cash, outcome, market }) {
	if (!market) return "Marché introuvable";
	if (market.status === "settled") return "Marché déjà réglé";
	if (!outcome) return "Choisis une issue";
	if (!Number.isFinite(stake) || stake <= 0) return "Mise invalide";
	if (stake > cash) return "Solde insuffisant";
	return null;
}

export function claimAmount(position, market) {
	if (!position || !market || market.status !== "settled") return 0;
	if (position.outcomeId !== market.resolvedOutcomeId) return 0;
	return potentialPayout(position.stake, position.price);
}
