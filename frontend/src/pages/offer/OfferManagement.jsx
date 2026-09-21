import { useState } from "react";
import "./OfferManagement.css";

import { createOffer, getOffer, joinOfferByIdWithDate } from "../../services/endpoints";

function OfferManagement() {
	const [applicationId, setApplicationId] = useState("");
	const [joiningDate, setJoiningDate] = useState("");
	const [joinDateForAccepted, setJoinDateForAccepted] = useState("");
	const [offer, setOffer] = useState(null);

	const handleFetchOffer = async () => {
		const normalizedApplicationId = Number(applicationId);

		if (!normalizedApplicationId || normalizedApplicationId <= 0) {
			alert("Please enter valid Application ID");
			return;
		}

		try {
			const res = await getOffer(normalizedApplicationId);
			setOffer(res.data?.data ?? res.data);
		} catch (err) {
			console.log(err);
			alert("Offer not found");
			setOffer(null);
		}
	};

	const handleCreateOffer = async () => {
		const normalizedApplicationId = Number(applicationId);

		if (!normalizedApplicationId || normalizedApplicationId <= 0) {
			alert("Please enter valid Application ID");
			return;
		}

		if (!joiningDate) {
			alert("Please select joining date");
			return;
		}

		try {
			const res = await createOffer({
				applicationId: normalizedApplicationId,
				joiningDate,
			});

			const createdOffer = res.data?.data ?? res.data;
			setOffer(createdOffer || null);
			alert("Offer released successfully");
		} catch (err) {
			console.log(err);
			alert("Offer release failed");
		}
	};

	const handleMarkJoined = async () => {
		if (!offer?.id) {
			alert("Offer not found");
			return;
		}

		if (!joinDateForAccepted) {
			alert("Please select join date");
			return;
		}

		try {
			const res = await joinOfferByIdWithDate(offer.id, joinDateForAccepted);
			const updated = res.data?.data ?? res.data;
			setOffer(updated || null);
			alert("Candidate marked as JOINED");
		} catch (err) {
			console.log(err);
			alert("Failed to mark joined");
		}
	};

	return (
		<div className="offer-management-page">
			<div className="offer-management-shell">
				<div className="offer-management-header">
					<h2>Offer Release</h2>
					<p>TAG / ADMIN can create and track offers by Application ID.</p>
				</div>

				<div className="offer-form-card">
					<div className="field-row">
						<div className="field-group">
							<label htmlFor="applicationId">Application ID</label>
							<input
								id="applicationId"
								type="number"
								placeholder="Enter application ID"
								value={applicationId}
								onChange={(e) => setApplicationId(e.target.value)}
							/>
						</div>

						<div className="field-group">
							<label htmlFor="joiningDate">Joining Date</label>
							<input
								id="joiningDate"
								type="date"
								value={joiningDate}
								onChange={(e) => setJoiningDate(e.target.value)}
							/>
						</div>
					</div>

					<div className="actions-row">
						<button className="secondary-btn" onClick={handleFetchOffer}>
							Get Offer
						</button>
						<button className="primary-btn" onClick={handleCreateOffer}>
							Release Offer
						</button>
					</div>
				</div>

				{offer && (
					<div className="offer-preview-card">
						<h3>Offer Detail</h3>
						<p><b>Offer ID:</b> {offer.id || "N/A"}</p>
						<p><b>Application ID:</b> {offer.applicationId ?? offer.application?.id ?? applicationId}</p>
						<p><b>Status:</b> {offer.status || "RELEASED"}</p>
						<p><b>Joining Date:</b> {offer.joiningDate || joiningDate || "N/A"}</p>

						{String(offer.status || "").toUpperCase() === "ACCEPTED" && (
							<div className="accepted-actions">
								<div className="field-group">
									<label htmlFor="joinDateForAccepted">Join Date for Candidate</label>
									<input
										id="joinDateForAccepted"
										type="date"
										value={joinDateForAccepted}
										onChange={(e) => setJoinDateForAccepted(e.target.value)}
									/>
								</div>
								<button className="primary-btn" onClick={handleMarkJoined}>
									Mark Joined
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export default OfferManagement;
