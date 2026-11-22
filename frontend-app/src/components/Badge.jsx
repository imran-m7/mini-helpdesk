import { formatLabel } from "../utils/format";

// colored label for a ticket status or priority, e.g. <Badge kind="status" value="open" />
// reads it from the props inside the page
export default function Badge({ kind, value }) {
  return <span className={`badge ${kind}-${value}`}>{formatLabel(value)}</span>;
}