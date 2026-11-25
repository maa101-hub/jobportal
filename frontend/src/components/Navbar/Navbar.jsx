import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/endpoints";

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </svg>
);

const formatNotificationTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const notificationRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const [listResponse, countResponse] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(Array.isArray(listResponse.data) ? listResponse.data : []);
      setUnread(Number(countResponse.data?.count || 0));
    } catch {
      // Notification failures should never interrupt the main application.
    }
  };

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 45000);
    const closeOnOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  const openNotification = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((current) => current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        ));
        setUnread((current) => Math.max(0, current - 1));
      } catch {
        // Keep the menu usable if marking read fails.
      }
    }
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setUnread(0);
    } catch {
      // Keep the existing unread state when the request fails.
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">HireTrack</div>
      <div className="navbar-user">
        {user && (
          <>
            <div className="navbar-notifications" ref={notificationRef}>
              <button
                type="button"
                className={`navbar-notification-btn${open ? " is-open" : ""}`}
                onClick={() => setOpen((current) => !current)}
                aria-label={unread ? `${unread} unread notifications` : "Notifications"}
                aria-expanded={open}
              >
                <BellIcon />
                {unread > 0 && <span className="navbar-notification-count">{unread > 99 ? "99+" : unread}</span>}
              </button>
              {open && (
                <section className="notification-menu" aria-label="Notifications">
                  <div className="notification-menu-head">
                    <div>
                      <strong>Notifications</strong>
                      <span>{unread ? `${unread} unread` : "All caught up"}</span>
                    </div>
                    {unread > 0 && (
                      <button type="button" className="notification-read-all" onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <BellIcon />
                        <strong>No notifications yet</strong>
                        <span>Updates about your hiring activity will appear here.</span>
                      </div>
                    ) : notifications.map((notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        className={`notification-item${notification.read ? "" : " is-unread"}`}
                        onClick={() => void openNotification(notification)}
                      >
                        <span className="notification-dot" aria-hidden="true" />
                        <span className="notification-copy">
                          <strong>{notification.title}</strong>
                          <span>{notification.message}</span>
                          <small>{formatNotificationTime(notification.createdAt)}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
            <span className="navbar-role-badge">{user.role}</span>
            <span className="navbar-username">{user.name || user.email}</span>
            <button className="navbar-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
