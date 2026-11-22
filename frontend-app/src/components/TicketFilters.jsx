import { useState } from "react";
import { PRIORITIES, STATUSES, formatLabel } from "../utils/format";

// the filter bar. It does not load anything itself: it only reports changes to the page.
export default function TicketFilters({ filters, isAgent, currentUserId, onChange }) {
  const [searchText, setSearchText] = useState(filters.search); // while typing, text is kept locally until pressing enter

  function handleSearchSubmit(event) {
    event.preventDefault(); // do not reload the page
    onChange({ search: searchText.trim() }); // send it without spaces
  }

  function handleClear() {
    setSearchText("");
    onChange({ search: "", status: "", priority: "", assigned_to_id: "" });
  }

  return (
    <div className="filters">
      <form className="search-form" onSubmit={handleSearchSubmit}>
        <input
          type="search"
          placeholder="Search by title…"
          aria-label="Search by title"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <button className="btn btn-secondary" type="submit">
          Search
        </button>
      </form>

      <select
        aria-label="Filter by status"
        value={filters.status}
        onChange={(event) => onChange({ status: event.target.value })}
      >
        <option value="">All statuses</option>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {formatLabel(status)}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by priority"
        value={filters.priority}
        onChange={(event) => onChange({ priority: event.target.value })}
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {formatLabel(priority)}
          </option>
        ))}
      </select>

      {isAgent && (
        <select
          aria-label="Filter by assignee"
          value={filters.assigned_to_id}
          onChange={(event) => onChange({ assigned_to_id: event.target.value })}
        >
          <option value="">Any assignee</option>
          <option value={String(currentUserId)}>Assigned to me</option>
        </select>
      )}

      <button className="btn btn-link" type="button" onClick={handleClear}>
        Clear filters
      </button>
    </div>
  );
}