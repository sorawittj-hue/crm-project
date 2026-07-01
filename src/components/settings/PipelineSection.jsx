import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { STAGES as DEFAULT_STAGES } from '../../lib/constants';
import { Info, GripVertical, Plus, X, Check, Edit2, Loader2, Trash2, ArrowRight } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { fetchPipelineStages, upsertPipelineStages, deletePipelineStage } from '../../services/apiStages';

const COLOR_CLASSES = {
  indigo: { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-l-indigo-500', dot: 'bg-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', button: 'bg-indigo-500' },
  violet: { bg: 'from-violet-50 to-violet-100/50', border: 'border-l-violet-500', dot: 'bg-violet-500', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', button: 'bg-violet-500' },
  pink: { bg: 'from-pink-50 to-pink-100/50', border: 'border-l-pink-500', dot: 'bg-pink-500', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700', button: 'bg-pink-500' },
  orange: { bg: 'from-orange-50 to-orange-100/50', border: 'border-l-orange-500', dot: 'bg-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', button: 'bg-orange-500' },
  emerald: { bg: 'from-emerald-50 to-emerald-100/50', border: 'border-l-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', button: 'bg-emerald-500' },
  rose: { bg: 'from-rose-50 to-rose-100/50', border: 'border-l-rose-500', dot: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700', button: 'bg-rose-500' },
  blue: { bg: 'from-blue-50 to-blue-100/50', border: 'border-l-blue-500', dot: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', button: 'bg-blue-500' },
  cyan: { bg: 'from-cyan-50 to-cyan-100/50', border: 'border-l-cyan-500', dot: 'bg-cyan-500', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700', button: 'bg-cyan-500' },
  teal: { bg: 'from-teal-50 to-teal-100/50', border: 'border-l-teal-500', dot: 'bg-teal-500', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700', button: 'bg-teal-500' },
};
const TAILWIND_COLORS = Object.keys(COLOR_CLASSES);

function getStageStyle(colorName) {
  return COLOR_CLASSES[colorName] || COLOR_CLASSES['indigo'];
}

export function PipelineSection() {
  const [stages, setStages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', color: 'indigo' });

  useEffect(() => {
    loadStages();
  }, []);

  async function loadStages() {
    setIsLoading(true);
    const data = await fetchPipelineStages();
    if (data && data.length > 0) {
      setStages(data.sort((a, b) => a.position - b.position));
    } else {
      setStages(DEFAULT_STAGES.map((s, i) => ({
        id: s.id,
        stage_id: s.id,
        label: s.label,
        color: ['indigo', 'violet', 'pink', 'orange', 'emerald', 'rose'][i] || 'indigo',
        position: i
      })));
    }
    setIsLoading(false);
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const newStages = items.map((item, index) => ({ ...item, position: index }));
    setStages(newStages);
    saveStages(newStages);
  };

  const saveStages = async (newStages) => {
    setIsSaving(true);
    try {
      const payload = newStages.map((s, i) => ({
        ...s,
        stage_id: s.stage_id || s.id || `stage_${Date.now()}`,
        position: i
      }));
      const saved = await upsertPipelineStages(payload);
      if (saved) {
        setStages(saved.sort((a, b) => a.position - b.position));
      }
    } catch (err) {
      console.error('Save stages failed', err);
    }
    setIsSaving(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    const newStage = {
      id: `temp_${Date.now()}`,
      stage_id: `stage_${Date.now()}`,
      label: 'New Stage',
      color: 'blue',
      position: stages.length
    };
    const newStages = [...stages, newStage];
    setStages(newStages);
    setEditingId(newStage.id);
    setEditForm({ label: newStage.label, color: newStage.color });
  };

  const handleDelete = async (id) => {
    if (stages.length <= 1) return;
    const isTemp = String(id).startsWith('temp_');
    const newStages = stages.filter(s => s.id !== id).map((s, i) => ({ ...s, position: i }));
    setStages(newStages);
    
    if (!isTemp) {
      setIsSaving(true);
      try {
        await deletePipelineStage(id);
        await upsertPipelineStages(newStages);
      } catch (err) {
        console.error('Delete failed', err);
      }
      setIsSaving(false);
    }
  };

  const handleSaveEdit = (id) => {
    const newStages = stages.map(s => {
      if (s.id === id) {
        return { ...s, label: editForm.label, color: editForm.color };
      }
      return s;
    });
    setStages(newStages);
    saveStages(newStages);
  };

  return (
    <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">ขั้นตอนดีล (Pipeline Stages)</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mr-2">{stages.length} ขั้นตอน</span>
            ปรับแต่งลำดับขั้นตอนของคุณ
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={isSaving || isLoading || editingId}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <Plus size={16} />
          เพิ่มขั้นตอน
        </button>
      </div>

      <div className="relative z-10">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="pipeline-stages">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 relative min-h-[100px]">
                  <div className="absolute left-[33px] top-6 bottom-6 w-px bg-gradient-to-b from-indigo-200 via-violet-200 to-rose-200" />
                  
                  {stages.map((s, i) => {
                    const style = getStageStyle(s.color);
                    const isEditing = editingId === s.id;
                    const isLast = i === stages.length - 1;
                    
                    return (
                      <Draggable key={s.id} draggableId={String(s.id)} index={i} isDragDisabled={editingId !== null}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              'flex items-center gap-3 p-3 pl-2 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all relative',
                              snapshot.isDragging ? 'shadow-xl ring-2 ring-violet-500/20 z-50 scale-[1.02]' : 'hover:shadow-md'
                            )}
                          >
                            <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1">
                              <GripVertical size={20} />
                            </div>
                            
                            <div className="relative z-10 flex-shrink-0">
                              <div className={cn('w-[10px] h-[10px] rounded-full ring-4 ring-white shadow-sm', style.dot)} />
                            </div>

                            {isEditing ? (
                              <div className="flex-1 flex items-center gap-3 min-w-0 bg-slate-50 p-2 rounded-xl border border-slate-200 ml-2">
                                <input
                                  type="text"
                                  value={editForm.label}
                                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(s.id)}
                                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                  autoFocus
                                  placeholder="ชื่อขั้นตอน"
                                />
                                <div className="flex items-center gap-1.5 flex-wrap px-2">
                                  {TAILWIND_COLORS.map(c => (
                                    <button
                                      key={c}
                                      onClick={() => setEditForm({ ...editForm, color: c })}
                                      className={cn('w-5 h-5 rounded-full border-2 transition-transform hover:scale-110', editForm.color === c ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent', COLOR_CLASSES[c].button)}
                                      title={c}
                                    />
                                  ))}
                                </div>
                                <button onClick={() => handleSaveEdit(s.id)} className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
                                  <Check size={16} />
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className={cn("flex-1 flex items-center justify-between min-w-0 ml-2 p-3 rounded-xl bg-gradient-to-r border-l-4", style.bg, style.border)}>
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-sm font-bold', style.text)}>{s.label}</p>
                                  <p className="text-[11px] text-slate-400 font-mono truncate">{s.stage_id}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold', style.badge)}>
                                    Step {i + 1}
                                  </span>
                                  <button onClick={() => { setEditingId(s.id); setEditForm({ label: s.label, color: s.color || 'indigo' }); }} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-white/50 transition-colors">
                                    <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-30" disabled={stages.length <= 1}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      <div className="flex items-start gap-2.5 mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 relative z-10">
        <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          {isSaving ? (
            <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> กำลังบันทึกข้อมูล...</span>
          ) : (
            'การเปลี่ยนแปลงจะถูกบันทึกอัตโนมัติ การลบขั้นตอนที่กำลังใช้งานอาจมีผลกระทบกับดีลที่อยู่ในขั้นตอนนี้'
          )}
        </p>
      </div>
    </Card>
  );
}
