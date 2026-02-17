import React, { useState, useEffect } from 'react';

export default function CustomVerseForm({ verse, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    reference: '',
    esv: '',
    niv: '',
    kjv: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (verse) {
      setFormData({
        reference: verse.reference || '',
        esv: verse.esv || '',
        niv: verse.niv || '',
        kjv: verse.kjv || '',
      });
    }
  }, [verse]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reference.trim()) {
      newErrors.reference = 'Reference is required';
    }
    if (!formData.esv.trim()) {
      newErrors.esv = 'ESV text is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      id: verse?.id || `custom-${Date.now()}`,
      theme: 'custom',
      ...formData,
    });

    // Reset form if not editing
    if (!verse) {
      setFormData({ reference: '', esv: '', niv: '', kjv: '' });
    }
  };

  return (
    <form className="custom-verse-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="reference">Bible Reference *</label>
        <input
          id="reference"
          type="text"
          name="reference"
          value={formData.reference}
          onChange={handleChange}
          placeholder="e.g., John 3:16"
          aria-describedby={errors.reference ? 'reference-error' : undefined}
        />
        {errors.reference && (
          <span id="reference-error" className="error">
            {errors.reference}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="esv">ESV Text *</label>
        <textarea
          id="esv"
          name="esv"
          value={formData.esv}
          onChange={handleChange}
          placeholder="Enter the ESV translation..."
          rows="3"
          aria-describedby={errors.esv ? 'esv-error' : undefined}
        />
        {errors.esv && (
          <span id="esv-error" className="error">
            {errors.esv}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="niv">NIV Text (optional)</label>
        <textarea
          id="niv"
          name="niv"
          value={formData.niv}
          onChange={handleChange}
          placeholder="Enter the NIV translation..."
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="kjv">KJV Text (optional)</label>
        <textarea
          id="kjv"
          name="kjv"
          value={formData.kjv}
          onChange={handleChange}
          placeholder="Enter the KJV translation..."
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          aria-label={verse ? 'Update verse' : 'Add verse'}
        >
          {verse ? 'Update Verse' : 'Add Verse'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
