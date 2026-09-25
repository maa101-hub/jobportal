import { BrowserRouter, Routes, Route } from "react-router-dom";
import Guard from "./Guard";

import CandidateOffers from "../pages/candidate/CandidateOffers";
import CompanySignup from "../pages/auth/CompanySignup";
import Login from "../pages/auth/Login";
import CandidateSignup from "../pages/auth/CandidateSignup";
import Jobs from "../pages/candidate/Jobs";
import CandidateDashboard from "../pages/candidate/Dashboard";
import MyApplications from "../pages/candidate/MyApplications";
import CreateJob from "../pages/job/CreateJob";
import CompanyJobs from "../pages/job/CompanyJobs";
import JobRequests from "../pages/job/JobRequests";
import TfgReview from "../pages/job/TfgReview";
import Applications from "../pages/application/Applications";
import Interview from "../pages/application/Interview";
import TeamMembers from "../pages/company/Employees";
import AddTeamMember from "../pages/company/AddEmployee";
import Dashboard from "../pages/company/Dashboard";
import OfferManagement from "../pages/offer/OfferManagement";
import CandidateProfile from "../pages/candidate/CandidateProfile";

// Role sets (ADMIN implicitly passes every company gate via Guard).
const CANDIDATE = ["CANDIDATE"];
const COMPANY = ["DELIVERY", "TFG", "TAG", "ADMIN"];
const DELIVERY_ADMIN = ["DELIVERY", "ADMIN"];
const TFG_ADMIN = ["TFG", "ADMIN"];
const TAG_ADMIN = ["TAG", "ADMIN"];

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth — full-bleed, no chrome, no guard */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<CandidateSignup />} />
        <Route path="/company-signup" element={<CompanySignup />} />

        {/* Candidate portal */}
        <Route path="/dashboard" element={<Guard allow={CANDIDATE}><CandidateDashboard /></Guard>} />
        <Route path="/jobs" element={<Guard allow={CANDIDATE}><Jobs /></Guard>} />
        <Route path="/my-applications" element={<Guard allow={CANDIDATE}><MyApplications /></Guard>} />
        <Route path="/my-offers" element={<Guard allow={CANDIDATE}><CandidateOffers /></Guard>} />

        {/* Company dashboard — any internal role */}
        <Route path="/company/dashboard" element={<Guard allow={COMPANY}><Dashboard /></Guard>} />

        {/* Team Members — ADMIN only */}
        <Route path="/company/team" element={<Guard allow={["ADMIN"]}><TeamMembers /></Guard>} />
        <Route path="/company/add-team-member" element={<Guard allow={["ADMIN"]}><AddTeamMember /></Guard>} />
        <Route path="/company/employees" element={<Guard allow={["ADMIN"]}><TeamMembers /></Guard>} />
        <Route path="/company/add-employee" element={<Guard allow={["ADMIN"]}><AddTeamMember /></Guard>} />

        {/* Job workflow */}
        <Route path="/company/job-requests" element={<Guard allow={DELIVERY_ADMIN}><JobRequests /></Guard>} />
        <Route path="/company/create-job" element={<Guard allow={DELIVERY_ADMIN}><CreateJob /></Guard>} />
        <Route path="/company/review" element={<Guard allow={TFG_ADMIN}><TfgReview /></Guard>} />
        <Route path="/company/jobs" element={<Guard allow={COMPANY}><CompanyJobs /></Guard>} />

        {/* Hiring workflow — TAG/ADMIN only (Delivery & TFG excluded) */}
        <Route path="/applications-manage" element={<Guard allow={TAG_ADMIN}><Applications /></Guard>} />
        <Route path="/company/applications" element={<Guard allow={TAG_ADMIN}><Applications /></Guard>} />
        <Route path="/company/interview" element={<Guard allow={TAG_ADMIN}><Interview /></Guard>} />
        <Route path="/company/offers" element={<Guard allow={TAG_ADMIN}><OfferManagement /></Guard>} />
        <Route path="/company/candidate/:userId" element={<Guard allow={TAG_ADMIN}><CandidateProfile /></Guard>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
