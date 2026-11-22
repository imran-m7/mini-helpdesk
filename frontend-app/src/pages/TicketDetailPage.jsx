import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { commentsApi } from "../api/comments";
import { ticketsApi } from "../api/tickets";
import Badge from "../components/Badge";
import CommentSection from "../components/CommentSection";
import { useAuth } from "../context/AuthContext";
import { PRIORITIES, STATUSES, formatDate, formatLabel } from "../utils/format";

export default function TicketDetailPage() {
  const { id } = useParams(); // the "5" in /tickets/5
  const { user, isAgent } = useAuth();
  const navigate = useNavigate();

  // same loading pattern as the ticket list: a result remembers which request it belongs to
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${id}#${reloadCount}`;
  const [result, setResult] = useState({ key: null, ticket: null, comments: [], error: null });
  const loading = result.key !== requestKey;

  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false; // open ticket 5 then 8, load 8 not 5
    // load the ticket and its comments at the same time
    Promise.all([ticketsApi.get(id), commentsApi.list(id)]) // both req at same time, and waits for both
      .then(([ticket, comments]) => {
        if (!ignore) setResult({ key: requestKey, ticket, comments, error: null });
      })
      .catch((err) => {
        if (!ignore) setResult({ key: requestKey, ticket: null, comments: [], error: err });
      });
    return () => {
      ignore = true;
    };
  }, [id, requestKey]);

  if (loading) return <p className="page-message">Loading ticket…</p>;

  if (result.error) {
    return (
      <div className="page-message">
        <p>{result.error.status === 404 ? "Ticket not found." : result.error.message}</p>
        {result.error.status !== 404 && (
          <button className="btn btn-secondary" onClick={() => setReloadCount((n) => n + 1)}>
            Try again
          </button>
        )}
        <p>
          <Link to="/tickets">Back to tickets</Link>
        </p>
      </div>
    );
  }

  const { ticket, comments } = result; // from result take ticket and comment
  const isOwner = ticket.created_by.id === user.id; // did i create this ticket
  const isOpen = ticket.status === "open"; // is it open
  const canEdit = isAgent || (isOwner && isOpen); // same rules as the backend
  const isAssignedToMe = ticket.assigned_to?.id === user.id; // is it assigned to me

  // Why a regular user can't edit, depending on the status
  const lockedMessages = {
    in_progress: "An agent is working on this ticket, so it can no longer be edited.",
    resolved: "This ticket has been resolved, so it can no longer be edited.",
    closed: "This ticket is closed and can no longer be edited.",
  };

  // runs an update and shows the new ticket returned by the API
  async function runAction(action) {
    setActionError(""); // clear old errors
    setBusy(true); // disable buttons
    try {
      const updated = await action();
      setResult((current) => ({ ...current, ticket: updated }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false); // enable again
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this ticket?")) return;
    setActionError("");
    setBusy(true);
    try {
      await ticketsApi.remove(ticket.id);
      navigate("/tickets", { replace: true });
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  }

  function handleCommentAdded(comment) {
    setResult((current) => ({ ...current, comments: [...current.comments, comment] }));
  }

  return (
    <div className="ticket-detail">
      <Link to="/tickets" className="back-link">
        ← Back to tickets
      </Link>

      <section className="card">
        <div className="detail-header">
          <h1>{ticket.title}</h1>
          <div className="detail-badges">
            <Badge kind="status" value={ticket.status} />
            <Badge kind="priority" value={ticket.priority} />
          </div>
        </div>

        <dl className="detail-meta">
          <div>
            <dt>Created by</dt>
            <dd>{ticket.created_by.full_name}</dd>
          </div>
          <div>
            <dt>Assigned to</dt>
            <dd>{ticket.assigned_to?.full_name ?? "Nobody yet"}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDate(ticket.created_at)}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatDate(ticket.updated_at)}</dd>
          </div>
        </dl>

        <p className="description">{ticket.description}</p>

        {actionError && <p className="alert alert-error">{actionError}</p>}

        {isAgent && (
          <div className="agent-actions">
            <label>
              Status
              <select
                value={ticket.status}
                disabled={busy}
                onChange={(event) => runAction(() => ticketsApi.update(ticket.id, { status: event.target.value }))}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={ticket.priority}
                disabled={busy}
                onChange={(event) => runAction(() => ticketsApi.update(ticket.id, { priority: event.target.value }))}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {formatLabel(priority)}
                  </option>
                ))}
              </select>
            </label>
            {!isAssignedToMe && (
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() => runAction(() => ticketsApi.assignToMe(ticket.id))}
              >
                Assign to me
              </button>
            )}
          </div>
        )}

        <div className="detail-actions">
          {canEdit && (
            <Link className="btn btn-secondary" to={`/tickets/${ticket.id}/edit`}>
              Edit
            </Link>
          )}
          {canEdit && (
            <button className="btn btn-danger" disabled={busy} onClick={handleDelete}>
              Delete
            </button>
          )}
          {!canEdit && <p className="muted">{lockedMessages[ticket.status]}</p>}
        </div>
      </section>

      <CommentSection
        ticketId={ticket.id}
        comments={comments}
        canComment={ticket.status !== "closed"}
        onAdded={handleCommentAdded}
      />
    </div>
  );
}