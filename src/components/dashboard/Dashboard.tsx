// Dashboard.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../redux/hook";
import { fetchTestSchedules } from "../../redux/TestSchedule.slice";
import ApiGrid from "../../Ag-Grid/Grid";
import Spinner from "../spinner/Spinner";
import {
  PlusIcon,
  RefreshCcwIcon,
  FilterIcon,
  DownloadIcon,
  SearchIcon,
  CalendarIcon,
  BarChart3Icon,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.scss";
import StatusCell from "../mock/StatusCell";
import { IsActiveCell } from "../mock/IsActiveCell";
import { AttemptCount } from "../../function/atmPerDay";
import { MoreVerticalIcon } from "../mock/moreVerticalIcon";

interface DashboardFilters {
  search: string;
  status: "all" | "active" | "inactive";
  dateRange: "all" | "today" | "week" | "month";
}

export const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state?.user?.user?.id);
  const {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    pageSize,
    totalElements,
  } = useAppSelector((state) => state.testSchedule);

  const [attempt, setAttempt] = useState(0);
  const [currentGridPage, setCurrentGridPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(10);
  const [scheduleFilterData, setScheduledFilterData] = useState(data || null);
  const [filters, setFilters] = useState<DashboardFilters>({
    search: "",
    status: "all",
    dateRange: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Column definitions for TestScheduledDTO
  const columnDefs = useMemo(
    () => [
      {
        field: "testName",
        headerName: "Test Name",
        flex: 1,
        minWidth: 200,
      },
      {
        field: "scheduleMock",
        headerName: "Schedule",
        flex: 1.2,
        minWidth: 150,
        valueFormatter: (params: any) => {
          if (!params.value) return "";
          const date = new Date(params.value);
          // Format: "28 Aug 2025, 08:17 PM" (you can customize)
          return date.toLocaleString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        },
      },
      {
        field: "durationSeconds",
        headerName: "Duration (sec)",
        flex: 0.5,
        minWidth: 60,
        type: "numericColumn",
        valueFormatter: (params: any) => {
          const minutes = Math.floor(params.value / 60);
          const seconds = params.value % 60;
          return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        },
      },
      {
        field: "scheduledStatus",
        headerName: "Status",
        flex: 0.8,
        minWidth: 120,
        cellRenderer: StatusCell,
      },
      {
        field: "isActive",
        headerName: "IsActive",
        flex: 0.5,
        minWidth: 80,
        cellRenderer: IsActiveCell,
      },
      {
        field: "actionHandler",
        headerName: "Action",
        flex: 0.5,
        minWidth: 100,
        cellRenderer: MoreVerticalIcon,
        
      },
    ],
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (userId) {
      dispatch(
        fetchTestSchedules({
          userId,
          page: currentGridPage - 1,
          size: currentPageSize,
        })
      );
    }
  }, [dispatch, userId, currentGridPage, currentPageSize]);

  //filtering data from table later on we can filter form backend
  useEffect(() => {
    if (!data) return;

    const filtered = data.filter((e) => {
      // ✅ Search filter
      const matchesSearch = filters.search
        ? e.testName.toLowerCase().includes(filters.search.toLowerCase())
        : true;

      // ✅ Status filter
      const matchesStatus =
        filters.status === "all"
          ? true
          : filters.status === "active"
          ? e.isActive === true
          : e.isActive === false;

      // ✅ Date range filter
      let matchesDate = true;
      if (filters.dateRange !== "all") {
        const testDate = new Date(e.scheduleMock); // e.scheduleMock is UTC
        const now = new Date();

        if (filters.dateRange === "today") {
          const today = new Date();
          matchesDate =
            testDate.getUTCFullYear() === today.getUTCFullYear() &&
            testDate.getUTCMonth() === today.getUTCMonth() &&
            testDate.getUTCDate() === today.getUTCDate();
        }

        if (filters.dateRange === "week") {
          const startOfWeek = new Date(now);
          startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay()); // Sunday
          startOfWeek.setUTCHours(0, 0, 0, 0);

          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 7);

          matchesDate = testDate >= startOfWeek && testDate < endOfWeek;
        }

        if (filters.dateRange === "month") {
          matchesDate =
            testDate.getUTCFullYear() === now.getUTCFullYear() &&
            testDate.getUTCMonth() === now.getUTCMonth();
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    setScheduledFilterData(filtered);
  }, [filters, data]);

  //attempt count fetching
  useEffect(() => {
    const fetchCount = async () => {
      const res = await AttemptCount(userId);
      setAttempt(res["mock count : "]);
    };
    fetchCount();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error, { position: "top-right", autoClose: 5000 });
    }
  }, [error]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentGridPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setCurrentPageSize(size);
    setCurrentGridPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    if (userId) {
      dispatch(
        fetchTestSchedules({
          userId,
          page: currentGridPage - 1,
          size: currentPageSize,
        })
      );
      toast.success("Data refreshed successfully", { autoClose: 2000 });
    }
  }, [dispatch, userId, currentGridPage, currentPageSize]);

  const handleCreateMock = useCallback(() => {
    navigate(`/dashboard/${userId}/create-mock`);
  }, [navigate, userId]);

  const handleExport = useCallback(() => {
    toast.info("Exporting data...", { autoClose: 2000 });
  }, []);

  const handleFilterChange = useCallback(
    (key: keyof DashboardFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentGridPage(1);
    },
    []
  );

  const stats = React.useMemo(() => {
    return {
      total: totalElements,
      active: data?.filter((item) => item.isActive).length || 0,
      inactive: data?.filter((item) => !item.isActive).length || 0,
      avgDuration:
        data?.length > 0
          ? Math.round(
              data.reduce((sum, item) => sum + item.durationSeconds, 0) /
                data.length /
                60
            )
          : 0,
      maxAttempt: `${attempt}/2`,
    };
  }, [data, totalElements, attempt]);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Mock Test Schedules</h1>
          <p className="dashboard-subtitle">
            Manage and monitor your scheduled mock tests
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn btn-outline"
          >
            <RefreshCcwIcon size={16} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={loading || !data?.length}
            className="btn btn-outline"
          >
            <DownloadIcon size={16} />
            Export
          </button>
          <button
            onClick={handleCreateMock}
            className="btn btn-primary"
            disabled={attempt === 2}
          >
            <PlusIcon size={16} />
            Create Mock Test
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="card">
          <div className="card-content">
            <div>
              <p className="card-label">Total Tests</p>
              <p className="card-value">{stats.total}</p>
            </div>
            <div className="card-icon bg-blue">
              <CalendarIcon size={24} color="#3b82f6" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div>
              <p className="card-label">Active Tests</p>
              <p className="card-value text-green">{stats.active}</p>
            </div>
            <div className="card-icon bg-green">
              <BarChart3Icon size={24} color="#059669" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div>
              <p className="card-label">Inactive Tests</p>
              <p className="card-value text-red">{stats.inactive}</p>
            </div>
            <div className="card-icon bg-red">
              <BarChart3Icon size={24} color="#dc2626" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div>
              <p className="card-label">Attempts</p>
              <p className="card-value text-red">{stats.maxAttempt}</p>
            </div>
            <div className="card-icon bg-red">
              <BookOpen size={24} color="#dc2626" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div>
              <p className="card-label">Avg Duration</p>
              <p className="card-value text-purple">{stats.avgDuration}m</p>
            </div>
            <div className="card-icon bg-purple">
              <BarChart3Icon size={24} color="#7c3aed" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filters-header">
          <h3>Filters & Search</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-toggle"
          >
            <FilterIcon size={16} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
        {showFilters && (
          <div className="filters-body">
            <div className="form-group">
              <label>Search Tests</label>
              <div className="input-icon">
                <SearchIcon size={16} className="icon" />
                <input
                  type="text"
                  placeholder="Search by test name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  handleFilterChange("dateRange", e.target.value)
                }
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <Spinner
          variant="dots"
          size="lg"
          modal
          label="Loading mock tests..."
          color="#3b82f6"
          accent="#22d3ee"
        />
      )}

      {/* Error */}
      {error && !loading && (
        <div className="error-box">
          <p>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid-box">
        <ApiGrid
          data={scheduleFilterData}
          columnDefs={columnDefs}
          loading={loading}
          currentPage={currentGridPage}
          totalPages={totalPages}
          pageSize={currentPageSize}
          totalElements={totalElements}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
};
