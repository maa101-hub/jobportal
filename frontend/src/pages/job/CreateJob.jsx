import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateJob.css";

import { createJob } from "../../services/endpoints";
function CreateJob() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const storedCompanyId = user?.companyId ?? localStorage.getItem("companyId") ?? user?.id;
  const normalizedCompanyId = Number(storedCompanyId);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    techStack: "",
    experience: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!Number.isFinite(normalizedCompanyId) || normalizedCompanyId <= 0) {
      alert("Company ID not found. Please login again.");
      return;
    }

    const payload = {
      ...form,
      companyId: normalizedCompanyId,
    };

    try {
      const res = await createJob(payload);
      alert("Job Created Successfully");
      console.log(res.data);
      navigate("/company/jobs");
    } catch (err) {
      console.log(err);
      alert("Job creation failed");
    }
  };

  return (
    <div className="create-job-page">
      <div className="create-job-container">
        <div className="create-job-header">
          <h2>Create Job</h2>
          <p>Add a new job opening for candidates.</p>
        </div>

        <form className="create-job-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Job Title</label>
            <input
              id="title"
              type="text"
              name="title"
              placeholder="e.g. React Developer"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Write a short job description"
              value={form.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              name="location"
              placeholder="e.g. Noida, Remote"
              value={form.location}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="techStack">Tech Stack</label>
            <input
              id="techStack"
              type="text"
              name="techStack"
              placeholder="e.g. React, Java, Spring Boot"
              value={form.techStack}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="experience">Experience</label>
            <input
              id="experience"
              type="text"
              name="experience"
              placeholder="e.g. 2+ years"
              value={form.experience}
              onChange={handleChange}
            />
          </div>

          <button className="create-job-btn" type="submit">
            Create Job
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateJob;