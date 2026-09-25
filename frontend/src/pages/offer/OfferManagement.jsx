import { useState } from "react";
import "./OfferManagement.css";

import { createOffer, getOffer, joinOfferByIdWithDate } from "../../services/endpoints";
import { formatDate, humanize } from "../../utils/helpers";

// The offer lifecycle as a visual tracker.
const FLOW = [
	{ key: "SELECTED", label: "Selected" },
	{ key: "OFFER_RELEASED", label: "Offer Sent" },
	{ key: "ACCEPTED", label: "Accepted" },
	{ key: "JOINED", label: "Hired" },
];

const statusIndex = (status) => {
	const s = String(status || "").toUpperCase();
	if (["OFFERED", "OFFER_RELEASED", "RELEASED"].includes(s)) return 1;
	if (s === "ACCEPTED") return 2;
	if (s === "JOINED") return 3;
	return 0;
};

const statusTone = (status) => {
	const s = String(status || "").toUpperCase();
	if (s === "JOINED") return "green";
	if (s === "ACCEPTED") return "teal";
	if (["OFFERED", "OFFER_RELEASED", "RELEASED"].includes(s)) return "brand";
	if (s === "REJECTED") return "danger";
	return "slate";
};

function OfferManagement() {
	const [applicationId, setApplicationId] = useState("");
	const [joiningDate, setJoiningDate] = useState("");
	const [joinDateForAccepted, setJoinDateForAccepted] = useState("");
	const [offer, setOffer] = useState(null);
	const [busy, setBusy] = useState(null);
	const [message, setMessage] = useState(null);

	const flash = (type, text) => setMessage({ type, text });

	const fetchOffer = async () => {
		const n = Number(applicationId);
		if (!n || n <= 0) return flash("error", "Enter a valid Application ID.");
		setBusy("get");
		try {
			const res = await getOffer(n);
			setOffer(res.data?.data ?? res.data);
			setMessage(null);
		} catch (err) {
			console.log(err);
			setOffer(null);
			flash("error", "No offer found for that application.");
		} finally {
			setBusy(null);
		}
	};

	const releaseOffer = async () => {
		const n = Number(applicationId);
		if (!n || n <= 0) return flash("error", "Enter a valid Application ID.");
		if (!joiningDate) return flash("error", "Pick a joining date.");
		setBusy("create");
		try {
			const res = await createOffer({ applicationId: n, joiningDate });
			setOffer(res.data?.data ?? res.data ?? null);
			flash("success", "Offer released to the candidate.");
		} catch (err) {
			console.log(err);
			flash("error", "Couldn't release the offer.");
		} finally {
			setBusy(null);
		}
	};

	const markJoined = async () => {
		if (!offer?.id) return flash("error", "Load an offer first.");
		if (!joinDateForAccepted) return flash("error", "Pick a join date.");
		setBusy("join");
		try {
			const res = await joinOfferByIdWithDate(offer.id, joinDateForAccepted);
			setOffer(res.data?.data ?? res.data ?? null);
			flash("success", "Candidate marked as joined.");
		} catch (err) {
			console.log(err);
			flash("error", "Couldn't mark as joined.");
		} finally {
			setBusy(null);
		}
	};

	const activeStep = offer ? statusIndex(offer.status) : -1;

	return (
		<div className="ht-page offers-page">
			<header className="ht-page-head">
				<div>
					<h2>Offers</h2>
					<p>Release offers, track acceptance, and confirm joining.</p>
				</div>
			</header>

			{message && <div className={`offers-banner ${message.type}`}>{message.text}</div>}

			<div className="offers-layout">
				{/* Left: create / lookup */}
				<section className="ht-panel offers-form">
					<h3>Release an offer</h3>
					<p className="offers-form-sub">Look up an existing offer or create a new one by application.</p>

					<div className="offers-field">
						<label htmlFor="o-app">Application ID</label>
						<input id="o-app" type="number" placeholder="e.g. 42" value={applicationId} onChange={(e) => setApplicationId(e.target.value)} />
					</div>
					<div className="offers-field">
						<label htmlFor="o-join">Joining date</label>
						<input id="o-join" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
					</div>

					<div className="offers-form-actions">
						<button className="ht-btn-ghost" onClick={fetchOffer} disabled={busy === "get"}>
							{busy === "get" ? "Looking up…" : "Get Offer"}
						</button>
						<button onClick={releaseOffer} disabled={busy === "create"}>
							{busy === "create" ? "Releasing…" : "Release Offer"}
						</button>
					</div>
				</section>

				{/* Right: offer detail + flow */}
				<section className="ht-panel offers-detail">
					{offer ? (
						<>
							<div className="offers-detail-head">
								<div>
									<span className={`ht-pill tone-${statusTone(offer.status)}`}>{humanize(offer.status || "Released")}</span>
									<h3>Offer #{offer.id ?? "—"}</h3>
								</div>
							</div>

							{/* Flow tracker */}
							<ol className="offers-flow">
								{FLOW.map((step, i) => (
									<li key={step.key} className={`offers-flow-step ${i <= activeStep ? "done" : ""} ${i === activeStep ? "current" : ""}`}>
										<span className="offers-flow-dot">{i < activeStep ? "✓" : i + 1}</span>
										<span className="offers-flow-label">{step.label}</span>
									</li>
								))}
							</ol>

							<div className="offers-facts">
								<div className="offers-fact"><span>Application</span><strong>#{offer.applicationId ?? offer.application?.id ?? applicationId}</strong></div>
								<div className="offers-fact"><span>Offer date</span><strong>{formatDate(offer.offerDate)}</strong></div>
								<div className="offers-fact"><span>Joining date</span><strong>{formatDate(offer.joiningDate || joiningDate)}</strong></div>
								<div className="offers-fact"><span>Status</span><strong>{humanize(offer.status || "Released")}</strong></div>
							</div>

							{String(offer.status || "").toUpperCase() === "ACCEPTED" && (
								<div className="offers-join">
									<h4>Confirm joining</h4>
									<div className="offers-join-row">
										<input type="date" value={joinDateForAccepted} onChange={(e) => setJoinDateForAccepted(e.target.value)} />
										<button className="ht-btn-success" onClick={markJoined} disabled={busy === "join"}>
											{busy === "join" ? "Saving…" : "Mark Joined"}
										</button>
									</div>
								</div>
							)}
						</>
					) : (
						<div className="offers-empty">
							<div className="ht-empty-mark" aria-hidden="true" />
							<h3>No offer loaded</h3>
							<p>Enter an application ID and get or release an offer to see its details here.</p>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}

export default OfferManagement;
