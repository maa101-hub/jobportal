import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CandidateSignup.css";

import { candidateSignup } from "../../services/endpoints";

function CandidateSignup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    const data = {
      name,
      email,
      password,
    };

    try {
      const res = await candidateSignup(data);
      alert(res.data);

      if (res.data === "Candidate Registered Successfully") {
        navigate("/");
      }

    } catch (err) {
      console.log(err);
      alert("Signup failed");
    }
  };

  return (
    <div className="signup-container">
      <h2>Candidate Signup</h2>

      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Signup</button>
      </form>
    </div>
  );
}

export default CandidateSignup;