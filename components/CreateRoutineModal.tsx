"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, ChevronDown, Settings2, Sliders, Edit3, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ExerciseItem {
    name: string;
    series: number;
    rir: number;
    tempo: string;
    method: string;
    prescribed_reps: string;
}

interface CreateRoutineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
    routineToEdit?: any;
}

const METHODS = ['NORMAL', 'AMRAP', 'REST PAUSE', 'DROP SET'];

export default function CreateRoutineModal({ isOpen, onClose, onSuccess, userId, routineToEdit }: CreateRoutineModalProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [addedExercises, setAddedExercises] = useState<ExerciseItem[]>([]);
    const [groupedLibrary, setGroupedLibrary] = useState<Record<string, string[]>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const [currentExercise, setCurrentExercise] = useState<ExerciseItem>({
        name: "",
        series: 3,
        rir: 0,
        tempo: "2-1-1-1",
        method: "NORMAL",
        prescribed_reps: "10-12"
    });

    useEffect(() => {
        if (isOpen) {
            fetchLibrary();
            if (routineToEdit) {
                setName(routineToEdit.name);
                setAddedExercises(routineToEdit.routine_items.map((it: any) => ({
                    name: it.exercise_name,
                    series: it.series,
                    rir: it.rir,
                    tempo: it.tempo,
                    method: it.method,
                    prescribed_reps: it.prescribed_reps
                })));
            } else {
                setName("");
                setAddedExercises([]);
            }
        }
    }, [isOpen, routineToEdit]);

    const fetchLibrary = async () => {
        const { data } = await supabase.from('exercise_library').select('name, category').order('category');
        if (data) {
            const grouped = data.reduce((acc: any, curr: any) => {
                const cat = curr.category || 'Otros';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(curr.name);
                return acc;
            }, {});
            setGroupedLibrary(grouped);
        }
    };

    const handleAddOrUpdateExercise = () => {
        if (!currentExercise.name) return;
        if (editingIndex !== null) {
            const updated = [...addedExercises];
            updated[editingIndex] = currentExercise;
            setAddedExercises(updated);
            setEditingIndex(null);
        } else {
            setAddedExercises([...addedExercises, currentExercise]);
        }
        setCurrentExercise({ name: "", series: 3, rir: 0, tempo: "2-1-1-1", method: "NORMAL", prescribed_reps: "10-12" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (addedExercises.length === 0 || !name) return;
        setLoading(true);

        let routineId = routineToEdit?.id;

        if (routineId) {
            // Update existing
            await supabase.from('routines').update({ name }).eq('id', routineId);
            await supabase.from('routine_items').delete().eq('routine_id', routineId);
        } else {
            // Create new
            const { data } = await supabase.from('routines').insert([{ user_id: userId, name }]).select().single();
            routineId = data.id;
        }

        if (routineId) {
            await supabase.from('routine_items').insert(
                addedExercises.map((ex, idx) => ({
                    routine_id: routineId,
                    exercise_name: ex.name,
                    series: ex.series,
                    rir: ex.rir,
                    tempo: ex.tempo,
                    method: ex.method,
                    prescribed_reps: ex.prescribed_reps,
                    sort_order: idx
                }))
            );
        }

        onSuccess();
        onClose();
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]" />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-t-[3rem] p-8 z-[90] shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black tracking-tight font-outfit text-black dark:text-white">
                                {routineToEdit ? 'Editar Plantilla' : 'Nueva Plantilla'}
                            </h2>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 tap-target"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input
                                type="text"
                                placeholder="Nombre de la plantilla"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-16 px-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                                required
                            />

                            <div className="bg-neutral-50 dark:bg-neutral-800/30 p-6 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 space-y-4">
                                <select
                                    value={currentExercise.name}
                                    onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
                                    className="w-full h-14 px-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 font-bold text-sm"
                                >
                                    <option value="">Seleccionar ejercicio...</option>
                                    {Object.entries(groupedLibrary).map(([cat, exs]: any) => (
                                        <optgroup key={cat} label={cat.toUpperCase()}>
                                            {exs.map((ex: string) => <option key={ex} value={ex}>{ex}</option>)}
                                        </optgroup>
                                    ))}
                                </select>

                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder="Reps" value={currentExercise.prescribed_reps} onChange={(e) => setCurrentExercise({ ...currentExercise, prescribed_reps: e.target.value })} className="h-12 px-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 font-bold text-xs" />
                                    <select value={currentExercise.method} onChange={(e) => setCurrentExercise({ ...currentExercise, method: e.target.value })} className="h-12 px-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 font-bold text-xs">
                                        {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>

                                <button type="button" onClick={handleAddOrUpdateExercise} className="w-full h-14 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                    {editingIndex !== null ? <Check size={18} /> : <Plus size={18} />}
                                    {editingIndex !== null ? 'Actualizar Ejercicio' : 'Añadir a Plantilla'}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {addedExercises.map((ex, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-100 dark:border-white/5 rounded-2xl">
                                        <div className="flex-1 min-w-0" onClick={() => { setEditingIndex(idx); setCurrentExercise(addedExercises[idx]); }}>
                                            <p className="font-bold text-sm truncate">{ex.name}</p>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase">{ex.series} sets • {ex.prescribed_reps} reps</p>
                                        </div>
                                        <button type="button" onClick={() => setAddedExercises(addedExercises.filter((_, i) => i !== idx))} className="p-2 text-neutral-300 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>

                            <button type="submit" disabled={loading || addedExercises.length === 0} className="w-full h-16 bg-black dark:bg-white text-white dark:text-black rounded-[2rem] font-black text-lg shadow-xl">
                                {loading ? "Guardando..." : "Guardar Plantilla"}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
