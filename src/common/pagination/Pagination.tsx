import React, { useCallback, useEffect, useState } from "react";

export interface PaginationData<T> {
  data: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  itemsPerPage: number;
}

export interface PaginationProps<T> {
  fetchData: (page: number, size: number, extraParams?: any) => Promise<PaginationData<T>>;
  itemsPerPage: number;
  extraParams?: any;
  onDataChange?: (data: PaginationData<T>) => void;
}

export function Pagination<T>({
  fetchData,
  itemsPerPage,
  extraParams,
  onDataChange,
}: PaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState<PaginationData<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchData(page, itemsPerPage, extraParams);
        setPaginationData(data);
        setCurrentPage(data.currentPage);
        onDataChange?.(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    },
    [fetchData, itemsPerPage, extraParams, onDataChange]
  );

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!paginationData) return null;

  return (
    <div>
      {/* Render list */}
      <ul>
        {paginationData.data.map((item: any, i: number) => (
          <li key={item.id ?? i}>{item.testName ?? JSON.stringify(item)}</li>
        ))}
      </ul>

      {/* Pagination Controls */}
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={() => loadData(currentPage - 1)}
          disabled={!paginationData.hasPrevPage}
        >
          Previous
        </button>
        <span style={{ margin: "0 10px" }}>
          Page {paginationData.currentPage} of {paginationData.totalPages}
        </span>
        <button
          onClick={() => loadData(currentPage + 1)}
          disabled={!paginationData.hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}
