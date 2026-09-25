import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { acceptOfferById, getOfferByApplication, getUserApplications, rejectOfferById } from "../../services/endpoints";
import { normalizeList, formatDate, humanize } from "../../utils/helpers";
import { useToast } from "../../components/Toast/ToastContext";
import ConfirmDialog from "../../components/Toast/ConfirmDialog";
import "./CandidateOffers.css";

const statusTone = (status) => {
	const s = String(status || "").toUpperCase();
	if (s === "JOINED") return "green";
	if (s === "ACCEPTED") return "teal";
	if (["OFFER_RELEASED", "OFFERED"].includes(s)) return "brand";
	return "slate";
};

function CandidateOffers() {
	const navigate = useNavigate();
	const toast = useToast();
	const [offers, setOffers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [acting, setActing] = useState(null);
	const [pendingDecline, setPendingDecline] = useState(null); // offerId

	const userId = (() => {
		const user = JSON.parse(localStorage.getItem("user") || "null");
		const raw = user?.id ?? user?.userId ?? localStorage.getItem("userId");
		return raw ? Number(raw) : null;
	})();

	const fetchOffers = useCallback(async () => {
		if (!userId) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const apps = normalizeList((await getUserApplications(userId)).data);
			const resolved = await Promise.all(
				apps.map(async (application) => {
					try {
						const r = await getOfferByApplication(application.id);
						const offer = r?.data?.data ?? r?.data ?? r;
						return { application, offer };
					} catch {
						return null;
					}
				})
			);
			setOffers(
				resolved.filter(
					(x) => x?.offer && ["OFFER_RELEASED", "ACCEPTED", "JOINED"].includes(String(x.offer.status || "").toUpperCase())
				)
			);
		} catch (err) {
			console.log(err);
			setOffers([]);
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		const t = setTimeout(() => void fetchOffers(), 0);
		return () => clearTimeout(t);
	}, [fetchOffers]);

	const accept = async (offerId) => {
		setActing(offerId);
		try {
			await acceptOfferById(offerId);
			toast.success("Offer accepted! The company will confirm your joining details.");
			await fetchOffers();
		} catch (err) {
			console.log(err);
			toast.error("Couldn't accept the offer.");
		} finally {
			setActing(null);
		}
	};

	const confirmDecline = async () => {
		const offerId = pendingDecline;
		setPendingDecline(null);
		setActing(offerId);
		try {
			await rejectOfferById(offerId);
			toast.info("Offer declined.");
			await fetchOffers();
		} catch (err) {
			console.log(err);
			toast.error("Couldn't decline the offer.");
		} finally {
			setActing(null);
		}
	};

	return (
		<div className="ht-page myoffers-page">
			<header className="ht-page-head">
				<div>
					<h2>My Offers</h2>
					<p>Review and respond to the offers you've received.</p>
				</div>
				<div className="ht-page-actions">
					<span className="myoffers-count">{offers.length} offer{offers.length === 1 ? "" : "s"}</span>
				</div>
			</header>

			{loading ? (
				<div className="myoffers-skeleton">
					{[0, 1].map((i) => <div key={i} className="myoffers-skel" style={{ "--i": i }} />)}
				</div>
			) : offers.length === 0 ? (
				<div className="ht-empty">
					<div className="ht-empty-mark" aria-hidden="true" />
					<h3>No offers yet</h3>
					<p>Keep applying — offers will appear here as you clear interview rounds.</p>
					<button style={{ marginTop: "1rem" }} onClick={() => navigate("/jobs")}>Browse Jobs</button>
				</div>
			) : (
				<div className="myoffers-grid">
					{offers.map(({ application, offer }) => {
						const status = String(offer?.status || "").toUpperCase();
						const isReleased = status === "OFFER_RELEASED";
						return (
							<article key={application.id} className="myoffer-card">
								<div className="myoffer-top">
									<div>
										<span className="myoffer-appid">Application #{application.id}</span>
										<h3>Job #{application.jobId}</h3>
									</div>
									<span className={`ht-pill tone-${statusTone(status)}`}>{humanize(offer?.status || "Offer")}</span>
								</div>

								<div className="myoffer-facts">
									<div><span>Applied</span><strong>{formatDate(application.appliedAt)}</strong></div>
									<div><span>Offer date</span><strong>{formatDate(offer?.offerDate)}</strong></div>
									<div><span>Joining</span><strong>{formatDate(offer?.joiningDate)}</strong></div>
								</div>

								<div className={`myoffer-note tone-${statusTone(status)}`}>
									{status === "JOINED" ? "You're marked as joined. Welcome onboard! 🎉"
										: status === "ACCEPTED" ? "Offer accepted — awaiting joining confirmation."
											: "Congratulations! Review and respond to your offer."}
								</div>

								{isReleased && (
									<div className="myoffer-actions">
										<button className="ht-btn-success" onClick={() => accept(offer.id)} disabled={acting === offer.id || !offer?.id}>
											{acting === offer.id ? "…" : "Accept"}
										</button>
										<button className="ht-btn-danger" onClick={() => setPendingDecline(offer.id)} disabled={acting === offer.id || !offer?.id}>
											Decline
										</button>
									</div>
								)}
							</article>
						);
					})}
				</div>
			)}

			<ConfirmDialog
				open={!!pendingDecline}
				title="Decline this offer?"
				message="This can't be undone. The company will be notified."
				confirmLabel="Decline offer"
				onConfirm={confirmDecline}
				onCancel={() => setPendingDecline(null)}
			/>
		</div>
	);
}

export default CandidateOffers;
