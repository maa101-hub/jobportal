import { useCallback, useEffect, useState } from "react";
import "./Employees.css";
import { getEmployees, deleteEmployee } from "../../services/endpoints";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const companyId = user?.companyId ?? user?.id ?? localStorage.getItem("companyId");

  const fetchEmployees = useCallback(async () => {
    if (!companyId) {
      alert("Company ID not found. Please login again.");
      return;
    }

    try {
      const res = await getEmployees(companyId);
      setEmployees(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.log(err);
    }
  }, [companyId]);

  useEffect(() => {
    const loadEmployees = async () => {
      await fetchEmployees();
    };

    loadEmployees();
  }, [fetchEmployees]);

  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id);
      alert("Deleted");
      fetchEmployees();
    } catch (err) {
      console.log(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="employees-container">
      <h2>Employees</h2>

      {employees.length === 0 ? (
        <p>No employees found</p>
      ) : (
        employees.map((emp) => (
          <div key={emp.id} className="employee-card">
            <p><b>Name:</b> {emp.name}</p>
            <p><b>Email:</b> {emp.email}</p>
            <p><b>Role:</b> {emp.role}</p>

            <button onClick={() => handleDelete(emp.id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Employees;