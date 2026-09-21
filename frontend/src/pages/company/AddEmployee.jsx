import { useState } from "react";
import "./AddEmployee.css";
import { addEmployee } from "../../services/endpoints";

function AddEmployee() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const companyId = user?.companyId ?? user?.id ?? localStorage.getItem("companyId");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DELIVERY",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyId) {
      alert("Company ID not found. Please login again.");
      return;
    }

    try {
      const res = await addEmployee(companyId, form);
      alert(res.data);
    } catch (err) {
      console.log(err);
      alert("Failed to add employee");
    }
  };

  return (
    <div className="add-employee-container">
      <h2>Add Employee</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
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

        <select name="role" value={form.role} onChange={handleChange}>
          <option value="DELIVERY">DELIVERY</option>
          <option value="TFG">TFG</option>
          <option value="TAG">TAG</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <button type="submit">Add Employee</button>
      </form>
    </div>
  );
}

export default AddEmployee;