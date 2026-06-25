export default function Loader({ label = "Loading..." }) {
  return (
    <div className="loader-wrap">
      <div className="loader-spinner"></div>
      <p className="loader-text">{label}</p>
    </div>
  );
}
