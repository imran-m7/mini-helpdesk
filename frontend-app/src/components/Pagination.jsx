export default function Pagination({ page, pages, total, onPageChange }) {
  if (pages <= 1) {
    return <p className="pagination-info">{total} ticket{total === 1 ? "" : "s"}</p>; // add s if more than 1 ticket
  }

  return ( // [Previous]     Page 2 of 3 · 25 tickets     [Next]
    <nav className="pagination" aria-label="Pagination">
      <button className="btn btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span className="pagination-info">
        Page {page} of {pages} · {total} tickets
      </span>
      <button className="btn btn-secondary" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}