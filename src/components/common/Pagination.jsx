export default function Pagination({ pageData, onPageChange }) {
  if (!pageData || pageData.totalPages <= 1) return null;

  const currentPage = pageData.number ?? pageData.currentPage ?? 0;
  const totalRecords = pageData.totalElements ?? pageData.totalRecords ?? 0;
  const isFirst = pageData.first ?? currentPage === 0;
  const isLast = pageData.last ?? pageData.lastPage ?? currentPage >= pageData.totalPages - 1;

  return (
    <div className="pagination">
      <button
        className="page-btn"
        disabled={isFirst}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      <span className="page-info">
        Page {currentPage + 1} of {pageData.totalPages} ({totalRecords} total)
      </span>
      <button
        className="page-btn"
        disabled={isLast}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}
