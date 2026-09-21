import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Jobs.css";
import { jobService } from "../../services/api";
import { applyForJob, getUserApplications } from "../../services/endpoints";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const navigate = useNavigate();

  const [userId] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const mappedUserId = user?.id ?? user?.userId ?? localStorage.getItem("userId");
    return mappedUserId ? Number(mappedUserId) : null;
  });

  const fetchJobs = useCallback(async () => {
    try {
      const res = await jobService.getAllJobs();
      setJobs(res.data);
      console.log(res.data);
    } catch (err) {
      console.log("Error fetching jobs:", err);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getUserApplications(userId);
      const apps = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setApplications(apps);
    } catch (err) {
      console.log("Error fetching applications:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const hasApplied = (jobId) => {
    return applications.some((app) => app.jobId === jobId);
  };

  const handleApply = async (jobId) => {
    if (!userId) {
      alert("User ID not found. Please login again.");
      return;
    }

    const data = {
      userId: userId,
      jobId: jobId,
      resumeUrl: "resume.pdf",
    };

    try {
      await applyForJob(data);
      alert("Applied Successfully");
      // Refresh applications list
      await fetchApplications();
    } catch (err) {
      console.log(err);
      alert("Apply failed");
    }
  };

  const handleViewApplication = () => {
    navigate("/my-applications");
  };

  return (
    <div className="jobs-container">
      <h2>Available Jobs</h2>

      {jobs.map((job) => (
        <div key={job.id} className="job-card">
          <h3>{job.title}</h3>
          <p>{job.description}</p>
          <p><b>Location:</b> {job.location}</p>

          {hasApplied(job.id) ? (
            <button 
              className="btn-view-application"
              onClick={handleViewApplication}
            >
              View My Application
            </button>
          ) : (
            <button 
              className="btn-apply"
              onClick={() => handleApply(job.id)}
            >
              Apply
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default Jobs;