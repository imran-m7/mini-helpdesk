import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ticketsApi } from "../api/tickets";
import TicketForm from "../components/TicketForm";
import { useAuth } from "../context/AuthContext";

const EMPTY_TICKET = { title: "", description: "", priority: "medium" };

// one page for both /tickets/new and /tickets/:id/edit
export default function TicketFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user, isAgent } = useAuth();
  const navigate = useNavigate();

  // only in edit mode: load the ticket first
  const [result, setResult] = useState({ key: null, ticket: null, error: null });
  const loading = isEdit && result.key !== id; // when we are editing and the id is same as in url, we can edit, sto load

  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;
    ticketsApi
      .get(id)
      .then((ticket) => !ignore && setResult({ key: id, ticket, error: null }))
      .catch((err) => !ignore && setResult({ key: id, ticket: null, error: err }));
    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  async function handleCreate(values) {
    const ticket = await ticketsApi.create(values);
    navigate(`/tickets/${ticket.id}`, { replace: true });
  }

  async function handleUpdate(values) {
    // users only send what they may change; agents may also change the priority
    const changes = { title: values.title, description: values.description };
    if (isAgent) changes.priority = values.priority;
    await ticketsApi.update(id, changes);
    navigate(`/tickets/${id}`, { replace: true }); // replace current page in browser history, so Back does not return us to the form again
  }

  if (!isEdit) {
    return (
      <section className="form-page">
        <h1>New ticket</h1>
        <TicketForm
          initialValues={EMPTY_TICKET}
          submitLabel="Create ticket"
          canChangePriority
          cancelTo="/tickets"
          onSubmit={handleCreate}
        />
      </section>
    );
  }

  if (loading) return <p className="page-message">Loading ticket…</p>;

  if (result.error) {
    return (
      <div className="page-message">
        <p>{result.error.status === 404 ? "Ticket not found." : result.error.message}</p>
        <Link to="/tickets">Back to tickets</Link>
      </div>
    );
  }

  const { ticket } = result;
  const canEdit = isAgent || (ticket.created_by.id === user.id && ticket.status === "open");
  if (!canEdit) {
    return (
      <div className="page-message">
        <p>This ticket can no longer be edited.</p>
        <Link to={`/tickets/${ticket.id}`}>Back to the ticket</Link>
      </div>
    );
  }

  return (
    <section className="form-page">
      <h1>Edit ticket</h1>
      <TicketForm
        initialValues={{ title: ticket.title, description: ticket.description, priority: ticket.priority }}
        submitLabel="Save changes"
        canChangePriority={isAgent}
        cancelTo={`/tickets/${ticket.id}`}
        onSubmit={handleUpdate}
      />
    </section>
  );
}