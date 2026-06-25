export default function EmptyState({ message = "Nothing here yet." }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
    </div>
  );
}
