"use client";

import { useEffect, useState, useCallback } from "react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  title: string;
  description: string;
}

export default function ImageModal({
  isOpen,
  onClose,
  imageSrc,
  title,
  description,
}: ImageModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsVisible(false);
      onClose();
    }, 480);
  }, [onClose]);

  useEffect(() => {
    if (isVisible && !isClosing) {
      document.body.style.overflow = "hidden";
    } else if (!isVisible) {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible, isClosing]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isVisible) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isVisible, handleClose]);

  if (!isVisible) return null;

  return (
    <>
      {/* Dark Overlay */}
      <div className={`modal-overlay ${isClosing ? 'modal-closing' : ''}`} onClick={handleClose} />

      {/* Modal Card */}
      <div className={`modal-card ${isClosing ? 'modal-closing' : ''}`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="modal-close"
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Image */}
        <div className="modal-image-wrapper">
          <img
            src={imageSrc}
            alt={title}
            className="modal-image"
          />
        </div>

        {/* Content */}
        <div className="modal-content">
          <p className="modal-subtitle">divine froggie</p>
          <h3 className="modal-title modal-title-translate">
            <span className="modal-title-original">{title}</span>
            <span className="modal-title-hover">Hermit&apos;s Book</span>
          </h3>
        </div>
      </div>
    </>
  );
}
