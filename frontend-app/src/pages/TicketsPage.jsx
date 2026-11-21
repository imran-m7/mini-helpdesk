import { useAuth } from "../context/AuthContext";

// Placeholder: the real list (filters, search, pagination) comes in the next step
export default function TicketsPage() {
  const { user, isAgent } = useAuth();
  return (
    <section>
      <h1>{isAgent ? "All tickets" : "My tickets"}</h1>
      <p>Logged in as {user.email}. The ticket list comes next.</p>
    </section>
  );
}