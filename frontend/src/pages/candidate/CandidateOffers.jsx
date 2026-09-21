import { useEffect, useState, useCallback } from "react";
import { acceptOfferById, getOfferByApplication, getUserApplications, rejectOfferById } from "../../services/endpoints";
import "./CandidateOffers.css";

function CandidateOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const mappedUserId = user?.id ?? user?.userId ?? localStorage.getItem("userId");
    return mappedUserId ? Number(mappedUserId) : null;
  });

  const fetchOffers = useCallback(async () => {
    if (!userId) {
      setError("User ID not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      console.log(`📡 Fetching offers for userId: ${userId}`);

      const { data } = await getUserApplications(userId);
      const applications = Array.isArray(data) ? data : data.data || [];
      
      const resolvedOffers = await Promise.all(
        applications.map(async (application) => {
          try {
            const offerResponse = await getOfferByApplication(application.id);
            const offer = offerResponse?.data?.data ?? offerResponse?.data ?? offerResponse;
            return { application, offer };
          } catch {
            return null;
          }
        })
      );

      const filteredOffers = resolvedOffers.filter(
        (item) => item?.offer && ["OFFER_RELEASED", "ACCEPTED", "JOINED"].includes(String(item.offer.status || "").toUpperCase())
      );

      console.log("✅ Offered applications:", filteredOffers);
      setOffers(filteredOffers);

      if (filteredOffers.length === 0) {
        setError("No pending offers");
      }
    } catch (err) {
      console.error("❌ Error fetching offers:", err);
      setError(`Error loading offers: ${err.message}`);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchOffers();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchOffers]);

  const handleAcceptOffer = async (offerId) => {
    try {
      console.log("📡 Accepting offer:", offerId);

      await acceptOfferById(offerId);
      
      alert("✅ Offer Accepted! Company will contact you with joining details.");
      await fetchOffers();
    } catch (err) {
      console.error("❌ Error accepting offer:", err);
      alert("Failed to accept offer: " + err.message);
    }
  };

  const handleRejectOffer = async (offerId) => {
    if (!window.confirm("Are you sure you want to decline this offer?")) {
      return;
    }

    try {
      await rejectOfferById(offerId);
      alert("Offer declined");
      await fetchOffers();
    } catch (err) {
      console.error("❌ Error declining offer:", err);
      alert("Failed to decline offer: " + err.message);
    }
  };

  return (
    <div className="offers-container">
      <div className="offers-header">
        <div>
          <h2>💼 My Job Offers</h2>
          <p>Review and respond to job offers from companies</p>
        </div>
        <div className="offers-count-card">
          <span>Total Offers</span>
          <strong>{offers.length}</strong>
        </div>
      </div>

      {/* Debug Info */}
      <div className="debug-info">
        <p><strong>User ID:</strong> {userId || "Not found"}</p>
        <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
      </div>

      {/* Error Message */}
      {error && !loading && offers.length === 0 && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <p>Loading your offers...</p>
        </div>
      )}

      {/* Offers Grid */}
      {!loading && offers.length > 0 && (
        <div className="offers-grid">
          {offers.map(({ application, offer }) => (
            <div key={application.id} className="offer-card">
              <div className="offer-header">
                <div>
                  <h3>Application #{application.id}</h3>
                  <p className="job-id">Job ID: {application.jobId}</p>
                </div>
                <span className="offer-badge">OFFER EXTENDED</span>
              </div>

              <div className="offer-details">
                <div className="detail-item">
                  <span className="label">Applied On</span>
                  <strong>{application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : "N/A"}</strong>
                </div>
                <div className="detail-item">
                  <span className="label">Current Status</span>
                  <strong className="status-offered">{offer?.status || application.status || "N/A"}</strong>
                </div>
                <div className="detail-item">
                  <span className="label">Last Updated</span>
                  <strong>{offer?.offerDate ? new Date(offer.offerDate).toLocaleDateString() : "N/A"}</strong>
                </div>
              </div>

              {offer?.joiningDate && (
                <div className="offer-message">
                  <p>📅 Joining Date: {new Date(offer.joiningDate).toLocaleDateString()}</p>
                </div>
              )}

              <div className="offer-message">
                {String(offer?.status || "").toUpperCase() === "JOINED" ? (
                  <>
                    <p>✅ Your status is updated as JOINED.</p>
                    <p>Welcome onboard!</p>
                  </>
                ) : String(offer?.status || "").toUpperCase() === "ACCEPTED" ? (
                  <>
                    <p>✅ Offer accepted successfully.</p>
                    <p>Waiting for admin to confirm joining date.</p>
                  </>
                ) : (
                  <>
                    <p>🎉 Congratulations! You've received a job offer.</p>
                    <p>Please accept or decline this offer.</p>
                  </>
                )}
              </div>

              {String(offer?.status || "").toUpperCase() === "OFFER_RELEASED" && (
                <div className="offer-actions">
                  <button
                    className="btn-accept"
                    onClick={() => handleAcceptOffer(offer?.id)}
                    disabled={!offer?.id}
                  >
                    ✅ Accept Offer
                  </button>
                  <button
                    className="btn-decline"
                    onClick={() => handleRejectOffer(offer?.id)}
                    disabled={!offer?.id}
                  >
                    ❌ Decline Offer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && offers.length === 0 && !error && (
        <div className="empty-state">
          <h3>No Offers Yet</h3>
          <p>Keep applying for jobs! Companies will send you offers as you progress through their interview rounds.</p>
        </div>
      )}
    </div>
  );
}

export default CandidateOffers;
