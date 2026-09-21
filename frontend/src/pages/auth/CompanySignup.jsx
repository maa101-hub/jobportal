import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CompanySignup.css";

import { companyRegister } from "../../services/endpoints";

function CompanySignup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
    location: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const res = await companyRegister(form);
      alert(res.data);

      if (res.data === "Company Registered Successfully") {
        navigate("/");
      }
    } catch (err) {
      console.log(err);
      alert("Company signup failed");
    }
  };

  return (
    <div className="company-signup-container">
      <h2>Company Signup</h2>

      <form onSubmit={handleSignup}>
        <input
          type="text"
          name="companyName"
          placeholder="Company Name"
          value={form.companyName}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <input
          type="text"
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
        />

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />

        <button type="submit">Register Company</button>
      </form>
    </div>
  );
}

export default CompanySignup;