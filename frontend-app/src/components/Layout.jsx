import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, isAgent, logout } = useAuth();
  const navigate = useNavigate(); // navigation to diff page

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app">
      <header className="navbar">
        <Link to="/tickets" className="brand">
          Mini Helpdesk
        </Link>
        <nav className="nav-links">
          <NavLink to="/tickets" end>
            {isAgent ? "All tickets" : "My tickets"}
          </NavLink>
          <NavLink to="/tickets/new">New ticket</NavLink>
        </nav>
        <div className="nav-user">
          <span> {/* user name and user role badge for CSS */}
            {user.full_name} <span className={`badge badge-${user.role}`}>{user.role}</span>
          </span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="container"> 
        <Outlet /> {/* put current page here */}
      </main>
    </div>
  );
}