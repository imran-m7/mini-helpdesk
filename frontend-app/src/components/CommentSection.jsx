import { useState } from "react";
import { commentsApi } from "../api/comments";
import { formatDate } from "../utils/format";

export default function CommentSection({ ticketId, comments, canComment, onAdded }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!body.trim()) {
      setError("Comment cannot be empty.");
      return;
    }
    setError("");
    setSubmitting(true); // button shows sending
    try {
      const comment = await commentsApi.create(ticketId, body); // send it to backend
      onAdded(comment); // tell the UI, page adds it
      setBody(""); // clear body for next comment
    } catch (err) {
      setError(err.fieldErrors?.body ?? err.message); // if backend rejected
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card comments">
      <h2>Comments ({comments.length})</h2>

      {comments.length === 0 && <p className="muted">No comments yet.</p>}
      <ul className="comment-list">
        {comments.map((comment) => (
          <li key={comment.id} className="comment">
            <div className="comment-meta">
              <strong>{comment.author.full_name}</strong>
              <span className="muted">{formatDate(comment.created_at)}</span>
            </div>
            <p className="comment-body">{comment.body}</p>
          </li>
        ))}
      </ul>

      {canComment ? (
        <form className="comment-form" onSubmit={handleSubmit} noValidate> {/* browser does not check, we do */}
          <label htmlFor="new-comment">Add a comment</label>
          <textarea
            id="new-comment"
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            aria-invalid={Boolean(error)}
            maxLength={2000}
          />
          {error && <p className="field-error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Add comment"}
          </button>
        </form>
      ) : (
        <p className="muted">This ticket is closed, so no new comments can be added.</p>
      )}
    </section>
  );
}