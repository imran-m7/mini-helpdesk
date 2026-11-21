import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="page-message">
      <h1>Page not found</h1>
      <Link to="/tickets">Back to tickets</Link>
    </div>
  );
}