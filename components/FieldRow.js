'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FIELD_ICONS } from './Icons';

export default function FieldRow({ field, onChange, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="field-row" ref={setNodeRef} style={style}>
      <div className="field-delete-btn" onClick={() => onDelete(field.id)}>✕</div>
      
      {/* Ручка перетаскивания (иконка) */}
      <div className="field-icon-wrap" {...attributes} {...listeners}>
        <div className="ficon" dangerouslySetInnerHTML={{ __html: FIELD_ICONS[field.icon] || FIELD_ICONS.scroll }} />
      </div>

      <div className="field-content">
        <span className="field-label">{field.label}</span>
        <input 
          type="text" 
          className="field-input"
          value={field.value} 
          onChange={(e) => onChange(field.id, e.target.value)} 
          placeholder="—"
        />
      </div>
    </div>
  );
}