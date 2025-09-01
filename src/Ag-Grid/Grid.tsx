import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ClientSideRowModelModule, ModuleRegistry } from "ag-grid-community";
import type { TestScheduledDTO } from "../redux/TestSchedule.slice";
import Spinner from "../components/spinner/Spinner";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface ApiGridProps {
  data: TestScheduledDTO[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const ApiGrid: React.FC<ApiGridProps> = ({
  data,
  columnDefs,
  loading,
  currentPage,
  totalPages,
  pageSize,
  totalElements,
  onPageChange,
  onPageSizeChange,
}) => {
  const containerStyle = useMemo(
    () => ({ width: "100%", height: "600px" }),
    []
  );
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);


  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      headerClass: "text-right", // Right align headers
      cellClass: "text-right", // Right align cell content
    }),
    []
  );

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    onPageSizeChange(newSize);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Header with controls */}
      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <strong>Total Records: {totalElements}</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label>Rows per page: </label>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            style={{ padding: "4px 8px" }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <Spinner
          variant="ring"
          size="lg"
          modal
          label="Loading..."
          color="#f43f5e"
          accent="#22d3ee"
        />
      )}

      {/* AG Grid */}
      <div style={containerStyle}>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            rowData={data}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            suppressPaginationPanel={true} // We'll use custom pagination
            animateRows={true}
            rowSelection="single"
          />
        </div>
      </div>

      {/* Custom Pagination Controls */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          padding: "10px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <div>
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalElements)} to{" "}
          {Math.min(currentPage * pageSize, totalElements)} of {totalElements}{" "}
          entries
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || loading}
            style={{
              padding: "6px 12px",
              border: "1px solid #ddd",
              backgroundColor: currentPage <= 1 || loading ? "#f5f5f5" : "#fff",
              cursor: currentPage <= 1 || loading ? "not-allowed" : "pointer",
              borderRadius: "4px",
            }}
          >
            Previous
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={handlePageInput}
              disabled={loading}
              style={{
                width: "60px",
                padding: "4px 8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                textAlign: "center",
              }}
            />
            <span>of {totalPages}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || loading}
            style={{
              padding: "6px 12px",
              border: "1px solid #ddd",
              backgroundColor:
                currentPage >= totalPages || loading ? "#f5f5f5" : "#fff",
              cursor:
                currentPage >= totalPages || loading
                  ? "not-allowed"
                  : "pointer",
              borderRadius: "4px",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiGrid;
