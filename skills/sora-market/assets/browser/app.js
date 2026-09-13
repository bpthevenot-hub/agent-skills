import {
	STARTING_CASH,
	claimAmount,
	formatCompactUsd,
	formatUsd,
	impliedPercent,
	parseStake,
	potentialPayout,
	potentialProfit,
	validateTicket,
} from "./payout.js";

const KEYS = {
	cash: "sora-market:cash",
	positions: "sora-market:positions",
	watchlist: "sora-market:watchlist",
};

const CATEGORIES = [
	["all", "Tous"],
	["sport", "Sport"],
	["crypto", "Crypto"],
	["tech", "Tech"],
	["politics", "Politique"],
	["culture", "Culture"],
];

const STATUSES = [
	["all", "Tous"],
	["live", "Live"],
	["upcoming", "À venir"],
	["settled", "Réglés"],
];

const state = {
	markets: [],
	query: "",
	category: "all",
	status: "all",
	sort: "volume",
	view: "markets",
	selectedId: null,
	outcomeId: null,
	stake: "25",
	error: "",
	toast: "",
};

function loadCash() {
	const raw = localStorage.getItem(KEYS.cash);
	if (raw === null) return STARTING_CASH;
	const value = Number(raw);
	return Number.isFinite(value) ? value : STARTING_CASH;
}

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

function savePortfolio(cash, positions, watchlist) {
	localStorage.setItem(KEYS.cash, String(cash));
	localStorage.setItem(KEYS.positions, JSON.stringify(positions));
	localStorage.setItem(KEYS.watchlist, JSON.stringify(watchlist));
}

let cash = loadCash();
let positions = loadJson(KEYS.positions, []);
let watchlist = loadJson(KEYS.watchlist, []);

const els = {
	search: document.querySelector("#search"),
	cash: document.querySelector("#cash"),
	stats: document.querySelector("#stats"),
	chips: document.querySelector("#chips"),
	tabs: document.querySelector("#tabs"),
	sort: document.querySelector("#sort"),
	board: document.querySelector("#board"),
	views: document.querySelector("#views"),
	drawer: document.querySelector("#drawer"),
	panel: document.querySelector("#panel"),
	toast: document.querySelector("#toast"),
	positions: document.querySelector("#positions"),
};

function selectedMarket() {
	return state.markets.find((market) => market.id === state.selectedId) ?? null;
}

function selectedOutcome(market = selectedMarket()) {
	return market?.outcomes.find((outcome) => outcome.id === state.outcomeId) ?? null;
}

function visibleMarkets() {
	const needle = state.query.trim().toLowerCase();
	const filtered = state.markets.filter((market) => {
		const matchesQuery =
			!needle ||
			market.question.toLowerCase().includes(needle) ||
			market.outcomes.some((outcome) =>
				outcome.label.toLowerCase().includes(needle),
			);
		const matchesCategory =
			state.category === "all" || market.category === state.category;
		const matchesStatus = state.status === "all" || market.status === state.status;
		const matchesWatch =
			state.view !== "watchlist" || watchlist.includes(market.id);
		return matchesQuery && matchesCategory && matchesStatus && matchesWatch;
	});

	return [...filtered].sort((a, b) => {
		if (state.sort === "ending") {
			return new Date(a.closeAt).getTime() - new Date(b.closeAt).getTime();
		}
		if (state.sort === "newest") {
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		}
		return b.volume - a.volume;
	});
}

function statusLabel(status) {
	if (status === "live") return "Live";
	if (status === "upcoming") return "À venir";
	return "Réglé";
}

function timeLabel(iso) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "Date inconnue";
	return new Intl.DateTimeFormat("fr-FR", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function showToast(message) {
	state.toast = message;
	els.toast.textContent = message;
	els.toast.classList.toggle("show", Boolean(message));
	if (message) {
		window.setTimeout(() => {
			if (state.toast === message) showToast("");
		}, 2800);
	}
}

function renderHeader() {
	els.cash.innerHTML = `Caisse <strong>${formatUsd(cash)}</strong>`;
}

function renderStats() {
	const live = state.markets.filter((market) => market.status === "live").length;
	const volume = state.markets.reduce((sum, market) => sum + market.volume, 0);
	const open = state.markets.filter((market) => market.status !== "settled").length;
	els.stats.innerHTML = `
    <div class="stat"><span>Volume affiché</span><strong>${formatCompactUsd(volume)}</strong></div>
    <div class="stat"><span>Marchés live</span><strong>${live}</strong></div>
    <div class="stat"><span>Marchés ouverts</span><strong>${open}</strong></div>
    <div class="stat"><span>Positions</span><strong>${positions.length}</strong></div>
  `;
}

function renderToolbar() {
	els.chips.innerHTML = CATEGORIES.map(
		([id, label]) =>
			`<button class="chip" type="button" data-category="${id}" aria-pressed="${state.category === id}">${label}</button>`,
	).join("");
	els.tabs.innerHTML = STATUSES.map(
		([id, label]) =>
			`<button class="tab" type="button" data-status="${id}" aria-pressed="${state.status === id}">${label}</button>`,
	).join("");
	els.sort.value = state.sort;
}

function renderCard(market) {
	const watched = watchlist.includes(market.id);
	const outcomes = market.outcomes
		.slice(0, 3)
		.map(
			(outcome) =>
				`<span class="outcome"><small>${outcome.label}</small><strong>${impliedPercent(outcome.price)}</strong></span>`,
		)
		.join("");
	return `
    <button class="card" type="button" data-open="${market.id}">
      <div class="card-top">
        <span>${market.category}</span>
        <span class="status ${market.status}">${statusLabel(market.status)}</span>
      </div>
      <h2>${market.question}</h2>
      <div class="outcomes">${outcomes}</div>
      <div class="meta">
        <span>Vol. ${formatCompactUsd(market.volume)}</span>
        <span>${watched ? "★ suivi" : timeLabel(market.closeAt)}</span>
      </div>
    </button>
  `;
}

function renderBoard() {
	if (state.view === "portfolio") {
		els.board.hidden = true;
		els.positions.hidden = false;
		renderPositions();
		return;
	}

	els.board.hidden = false;
	els.positions.hidden = true;
	const markets = visibleMarkets();
	if (markets.length === 0) {
		els.board.innerHTML = `
      <div class="empty" role="status">
        <h2>Aucun marché</h2>
        <p>Aucun résultat pour ces filtres. Efface la recherche ou change de catégorie.</p>
      </div>
    `;
		return;
	}
	els.board.innerHTML = markets.map(renderCard).join("");
}

function renderPositions() {
	if (positions.length === 0) {
		els.positions.innerHTML = `
      <div class="empty" role="status">
        <h2>Portefeuille vide</h2>
        <p>Place une mise papier depuis un marché live pour la voir ici.</p>
      </div>
    `;
		return;
	}

	els.positions.innerHTML = positions
		.map((position) => {
			const market = state.markets.find((item) => item.id === position.marketId);
			const outcome = market?.outcomes.find((item) => item.id === position.outcomeId);
			const settled = market?.status === "settled";
			const won = settled && position.outcomeId === market.resolvedOutcomeId;
			const claim = claimAmount(position, market);
			const action = settled
				? position.claimed
					? `<p>Réclamé · ${formatUsd(position.claimedAmount ?? 0)}</p>`
					: `<button class="primary" type="button" data-claim="${position.id}">Réclamer ${formatUsd(claim)}</button>`
				: `<p>Gain potentiel ${formatUsd(potentialPayout(position.stake, position.price))}</p>`;
			return `
        <article class="position">
          <p class="status ${market?.status ?? ""}">${settled ? (won ? "Gagné" : "Perdu") : "Ouvert"}</p>
          <h2>${market?.question ?? "Marché retiré"}</h2>
          <p>${outcome?.label ?? position.outcomeId} · mise ${formatUsd(position.stake)}</p>
          ${action}
        </article>
      `;
		})
		.join("");
}

function renderPanel() {
	const market = selectedMarket();
	if (!market) {
		els.drawer.classList.remove("open");
		els.drawer.setAttribute("aria-hidden", "true");
		return;
	}

	const outcome = selectedOutcome(market) ?? market.outcomes[0];
	state.outcomeId = outcome.id;
	const stake = parseStake(state.stake);
	const payout = potentialPayout(stake, outcome.price);
	const profit = potentialProfit(stake, outcome.price);
	const watched = watchlist.includes(market.id);
	const disabled = market.status === "settled";

	els.drawer.classList.add("open");
	els.drawer.setAttribute("aria-hidden", "false");
	els.panel.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="status ${market.status}">${statusLabel(market.status)}</p>
        <h2 id="drawer-title">${market.question}</h2>
      </div>
      <button class="close" type="button" data-close>Fermer</button>
    </div>
    <div class="outcomes">
      ${market.outcomes
				.map(
					(item) => `
        <button class="outcome" type="button" data-outcome="${item.id}" aria-pressed="${item.id === outcome.id}">
          <small>${item.label}</small>
          <strong>${impliedPercent(item.price)}</strong>
        </button>`,
				)
				.join("")}
    </div>
    <div class="ticket-box">
      <label for="stake">Mise (USD)</label>
      <input id="stake" inputmode="decimal" value="${state.stake}" ${disabled ? "disabled" : ""} />
      <div class="figures">
        <div><small>Paiement potentiel</small><strong id="payout">${formatUsd(payout)}</strong></div>
        <div><small>Profit potentiel</small><strong id="profit">${formatUsd(profit)}</strong></div>
      </div>
      <p class="error" id="ticket-error">${state.error}</p>
      <button class="primary" id="place" type="button" ${disabled ? "disabled" : ""}>Miser</button>
    </div>
    <button class="ghost" type="button" data-watch>
      ${watched ? "Retirer des favoris" : "Ajouter aux favoris"}
    </button>
    <p class="meta">Volume ${formatCompactUsd(market.volume)} · clôture ${timeLabel(market.closeAt)}</p>
  `;
	document.querySelector("#stake")?.focus();
}

function render() {
	renderHeader();
	renderStats();
	renderToolbar();
	renderBoard();
	renderPanel();
	for (const button of els.views.querySelectorAll("[data-view]")) {
		button.setAttribute("aria-pressed", String(button.dataset.view === state.view));
	}
}

function openMarket(id) {
	const market = state.markets.find((item) => item.id === id);
	if (!market) return;
	state.selectedId = id;
	state.outcomeId = market.outcomes[0]?.id ?? null;
	state.error = "";
	render();
}

function closeDrawer() {
	state.selectedId = null;
	state.outcomeId = null;
	state.error = "";
	render();
}

function placeOrder() {
	const market = selectedMarket();
	const outcome = selectedOutcome(market);
	const stake = parseStake(state.stake);
	const error = validateTicket({ stake, cash, outcome, market });
	if (error) {
		state.error = error;
		renderPanel();
		return;
	}

	cash -= stake;
	positions = [
		{
			id: `p-${Date.now()}`,
			marketId: market.id,
			outcomeId: outcome.id,
			stake,
			price: outcome.price,
			createdAt: new Date().toISOString(),
			claimed: false,
		},
		...positions,
	];
	savePortfolio(cash, positions, watchlist);
	state.error = "";
	showToast(`Mise de ${formatUsd(stake)} placée sur ${outcome.label}`);
	render();
}

function claimPosition(id) {
	const position = positions.find((item) => item.id === id);
	const market = state.markets.find((item) => item.id === position?.marketId);
	if (!position || !market || position.claimed) return;
	const amount = claimAmount(position, market);
	cash += amount;
	positions = positions.map((item) =>
		item.id === id ? { ...item, claimed: true, claimedAmount: amount } : item,
	);
	savePortfolio(cash, positions, watchlist);
	showToast(amount > 0 ? `Gain crédité : ${formatUsd(amount)}` : "Position perdante clôturée");
	render();
}

function toggleWatch(id) {
	watchlist = watchlist.includes(id)
		? watchlist.filter((item) => item !== id)
		: [...watchlist, id];
	savePortfolio(cash, positions, watchlist);
	render();
}

function bind() {
	els.search.addEventListener("input", (event) => {
		state.query = event.target.value;
		renderBoard();
	});
	els.sort.addEventListener("change", (event) => {
		state.sort = event.target.value;
		renderBoard();
	});
	els.chips.addEventListener("click", (event) => {
		const button = event.target.closest("[data-category]");
		if (!button) return;
		state.category = button.dataset.category;
		render();
	});
	els.tabs.addEventListener("click", (event) => {
		const button = event.target.closest("[data-status]");
		if (!button) return;
		state.status = button.dataset.status;
		render();
	});
	els.views.addEventListener("click", (event) => {
		const button = event.target.closest("[data-view]");
		if (!button) return;
		state.view = button.dataset.view;
		if (state.view !== "markets") closeDrawer();
		render();
	});
	els.board.addEventListener("click", (event) => {
		const button = event.target.closest("[data-open]");
		if (!button) return;
		openMarket(button.dataset.open);
	});
	els.positions.addEventListener("click", (event) => {
		const button = event.target.closest("[data-claim]");
		if (!button) return;
		claimPosition(button.dataset.claim);
	});
	els.drawer.addEventListener("click", (event) => {
		if (event.target === els.drawer || event.target.closest("[data-close]")) {
			closeDrawer();
			return;
		}
		const outcome = event.target.closest("[data-outcome]");
		if (outcome) {
			state.outcomeId = outcome.dataset.outcome;
			state.error = "";
			renderPanel();
			return;
		}
		if (event.target.closest("[data-watch]")) {
			toggleWatch(state.selectedId);
			return;
		}
		if (event.target.closest("#place")) {
			placeOrder();
		}
	});
	els.drawer.addEventListener("input", (event) => {
		if (event.target.id !== "stake") return;
		state.stake = event.target.value;
		state.error = "";
		const market = selectedMarket();
		const outcome = selectedOutcome(market);
		const stake = parseStake(state.stake);
		const payout = document.querySelector("#payout");
		const profit = document.querySelector("#profit");
		if (payout) payout.textContent = formatUsd(potentialPayout(stake, outcome?.price));
		if (profit) profit.textContent = formatUsd(potentialProfit(stake, outcome?.price));
	});
	document.addEventListener("keydown", (event) => {
		if (event.key === "/" && document.activeElement !== els.search) {
			event.preventDefault();
			els.search.focus();
		}
		if (event.key === "Escape") closeDrawer();
	});
}

async function start() {
	bind();
	try {
		const response = await fetch("./markets.json");
		if (!response.ok) throw new Error("Catalogue indisponible");
		state.markets = await response.json();
		if (!Array.isArray(state.markets) || state.markets.length === 0) {
			throw new Error("Catalogue vide");
		}
	} catch (error) {
		els.board.innerHTML = `
      <div class="empty" role="alert">
        <h2>Impossible de charger les marchés</h2>
        <p>${error instanceof Error ? error.message : "Erreur inconnue"}</p>
      </div>
    `;
		return;
	}
	render();
}

void start();
