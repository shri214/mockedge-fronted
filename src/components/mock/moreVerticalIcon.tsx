// MoreVerticalIcon.tsx
import React, { useState, useEffect } from "react";
import { MoreVertical, CalendarClock, XCircle, Eye } from "lucide-react";
import { createPortal } from "react-dom";
import type { ICellRendererParams } from "ag-grid-community";
import "./MoreVerticalIcons.scss";

// Global state to ensure only one modal is open at a time
let currentOpenModal: (() => void) | null = null;

export const MoreVerticalIcon: React.FC<ICellRendererParams> = (params) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    // Close any other open modal first
    if (currentOpenModal) {
      currentOpenModal();
    }
    
    // Set current modal as the active one
    currentOpenModal = () => setOpen(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    currentOpenModal = null;
  };

  // Handle outside clicks and escape key
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.modal-content')) {
        handleClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  // Portal modal to avoid any ag-grid issues
  const modalContent = open ? createPortal(
    <div className="custom-modal">
      <div className="modal-backdrop" onClick={handleClose} />

      <div className="modal-content">
        <h3 className="modal-title">Actions</h3>

        <div className="modal-options">
          <button
            className="modal-btn"
            onClick={() => {
              alert(`Reschedule ${params.data.scheduleMock}`);
              handleClose();
            }}
          >
            <CalendarClock size={18} /> Reschedule
          </button>

          <button
            className="modal-btn danger"
            onClick={() => {
              alert(`Cancelled ${params.data.scheduleMock}`);
              handleClose();
            }}
          >
            <XCircle size={18} /> Cancel
          </button>

          <button
            className="modal-btn"
            onClick={() => {
              alert(`Viewing details of ${params.data.scheduleMock}`);
              handleClose();
            }}
          >
            <Eye size={18} /> View Details
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {/* Action icon */}
      <MoreVertical
        size={18}
        className="more-vertical-icon"
        onClick={handleOpen}
      />
      {modalContent}
    </>
  );
};