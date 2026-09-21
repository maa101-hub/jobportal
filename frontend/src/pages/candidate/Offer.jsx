import { useState } from "react";
import "./Offer.css";

import {
  createOffer,
  getOffer,
  acceptOffer,
  joinOffer,
} from "../../services/endpoints";

function Offer() {
  const [applicationId, setApplicationId] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [offer, setOffer] = useState(null);

  const handleFetch = async () => {
    const normalizedApplicationId = Number(applicationId);

    if (!normalizedApplicationId || normalizedApplicationId <= 0) {
      alert("Please enter a valid Application ID");
      return;
    }

    try {
      const res = await getOffer(normalizedApplicationId);
      setOffer(res.data?.data ?? res.data);
    } catch (err) {
      console.log(err);
      alert("Offer not found");
    }
  };

  const handleCreate = async () => {
    const normalizedApplicationId = Number(applicationId);

    if (!normalizedApplicationId || normalizedApplicationId <= 0) {
      alert("Please enter a valid Application ID");
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

      setOffer(res.data?.data ?? res.data);
      alert("Offer Created");
      await handleFetch();
    } catch (err) {
      console.log(err);
      alert("Create failed");
    }
  };

  const handleAccept = async () => {
    try {
      await acceptOffer(offer.id);
      alert("Offer Accepted");
      await handleFetch();
    } catch (err) {
      console.log(err);
    }
  };

  const handleJoin = async () => {
    try {
      await joinOffer(offer.id, joiningDate);
      alert("Joined Successfully");
      await handleFetch();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="offer-container">
      <h2>Offer Management</h2>

      <input
        type="number"
        placeholder="Enter Application ID"
        value={applicationId}
        onChange={(e) => setApplicationId(e.target.value)}
      />

      <input
        type="date"
        value={joiningDate}
        onChange={(e) => setJoiningDate(e.target.value)}
      />

      <button onClick={handleFetch}>Get Offer</button>
      <button onClick={handleCreate}>Create Offer</button>

      {offer && (
        <div className="offer-card">
          <p><b>Status:</b> {offer.status}</p>
          <p><b>Joining Date:</b> {offer.joiningDate}</p>

          <button onClick={handleAccept}>Accept</button>
          <button onClick={handleJoin}>Join</button>
        </div>
      )}
    </div>
  );
}

export default Offer;