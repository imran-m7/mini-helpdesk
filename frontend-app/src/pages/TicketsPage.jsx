import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ticketsApi } from "../api/tickets";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import TicketFilters from "../components/TicketFilters";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

const PAGE_SIZE = 10;

export default function TicketsPage() {
  const { user, isAgent } = useAuth(); // from authContext read user and if he is an agent

  // filters live in the URL (?status=open&page=2), so reload and Back keep them
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = {
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? "",
    priority: searchParams.get("priority") ?? "",
    assigned_to_id: searchParams.get("assigned_to_id") ?? "",
    page: Number(searchParams.get("page") ?? 1),
  };

  // Each result remembers which request it belongs to; if it isn't for the current URL yet, we're loading
  const [retryCount, setRetryCount] = useState(0); // used usually if server is down, and we need to invoke requestKey again
  const requestKey = `${searchParams.toString()}#${retryCount}`;
  const [result, setResult] = useState({ key: null, data: null, error: "" });
  const loading = result.key !== requestKey; // if match, url updated, if not still loading

  useEffect(() => {
    let ignore = false; // ignore answers that arrive after the filters changed again
    const params = Object.fromEntries(new URLSearchParams(requestKey.split("#")[0])); // take status=open, remove 0 and add it to object
    ticketsApi
      .list({ ...params, page_size: PAGE_SIZE })
      .then((data) => !ignore && setResult({ key: requestKey, data, error: "" }))
      .catch((err) => !ignore && setResult({ key: requestKey, data: null, error: err.message }));
    return () => {
      ignore = true;
    };
  }, [requestKey]); 

  // changing any filter goes back to page 1; empty values are removed from the URL
  function updateFilters(changes) {
    const next = { ...filters, ...changes, page: changes.page ?? 1 }; // copy current filters and overwrite with changes
    const params = {};
    Object.entries(next).forEach(([key, value]) => {
      if (value !== "" && !(key === "page" && value === 1)) params[key] = String(value); // go through every pair in next
    });
    setSearchParams(params); // send what is changed
  }

  const hasFilters = Boolean(filters.search || filters.status || filters.priority || filters.assigned_to_id);
  const data = result.data;

  return (
    <section>
      <div className="page-header">
        <h1>{isAgent ? "All tickets" : "My tickets"}</h1>
        <Link className="btn btn-primary" to="/tickets/new">
          New ticket
        </Link>
      </div>

      <TicketFilters
        key={filters.search}
        filters={filters}
        isAgent={isAgent}
        currentUserId={user.id}
        onChange={updateFilters}
      />

      {result.error && !loading && (
        <div className="alert alert-error">
          {result.error}{" "}
          <button className="btn btn-link" onClick={() => setRetryCount((count) => count + 1)}>
            Try again
          </button>
        </div>
      )}

      {loading && !data && <p className="page-message">Loading tickets…</p>}

      {data && data.items.length === 0 && !loading && (
        <div className="page-message">
          {hasFilters ? (
            <p>No tickets match these filters.</p>
          ) : (
            <p>
              No tickets yet. <Link to="/tickets/new">Create the first one</Link>
            </p>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className={loading ? "is-loading" : undefined}> {/* no class and table looks normal */}
          <table className="ticket-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                {isAgent && <th>Created by</th>}
                <th>Assigned to</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((ticket) => (
                <tr key={ticket.id}>
                  <td data-label="Title">
                    <Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
                  </td>
                  <td data-label="Status">
                    <Badge kind="status" value={ticket.status} />
                  </td>
                  <td data-label="Priority">
                    <Badge kind="priority" value={ticket.priority} />
                  </td>
                  {isAgent && <td data-label="Created by">{ticket.created_by.full_name}</td>}
                  <td data-label="Assigned to">{ticket.assigned_to?.full_name ?? "—"}</td>
                  <td data-label="Created">{formatDate(ticket.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            onPageChange={(page) => updateFilters({ page })}
          />
        </div>
      )}
    </section>
  );
}