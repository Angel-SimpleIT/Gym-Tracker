"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, ChevronDown, Settings2, Edit3, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ExerciseItem {
    id?: string;
    name: string;
    series: number;
    rir: number;
    tempo: string;
    method: string;
    prescribed_reps: string;
}

interface ExerciseLibraryItem {
    name: string;
    category: string;
}

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (task: { id: string; title: string }) => void;
    userId: string;
    initialDate?: Date;
}

const METHODS = ['NORMAL', 'AMRAP', 'REST PAUSE', 'DROP SET'];

export default function CreateTaskModal({ isOpen, onClose, onSuccess, userId, initialDate }: CreateTaskModalProps) {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [groupedLibrary, setGroupedLibrary] = useState<Record<string, string[]>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);

    // Current Exercise Form
    const [currentExercise, setCurrentExercise] = useState<ExerciseItem>({
        name: "",
        series: 3,
        rir: 0,
        tempo: "2-1-1-1",
        method: "NORMAL",
        prescribed_reps: "10-12"
    });

    const [addedExercises, setAddedExercises] = useState<ExerciseItem[]>([]);

    const fetchLibrary = useCallback(async () => {
        const { data } = await supabase
            .from('exercise_library')
            .select('name, category')
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (data) {
            const grouped = data.reduce((acc: Record<string, string[]>, curr: ExerciseLibraryItem) => {
                const cat = curr.category || 'Otros';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(curr.name);
                return acc;
            }, {});
            setGroupedLibrary(grouped);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchLibrary();
            if (editingIndex === null) {
                setTitle("");
                setAddedExercises([]);
            }
        }
    }, [isOpen, editingIndex, fetchLibrary]);

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

        setCurrentExercise({
            name: "",
            series: 3,
            rir: 0,
            tempo: "2-1-1-1",
            method: "NORMAL",
            prescribed_reps: "10-12"
        });
    };

    const startEditing = (index: number) => {
        setEditingIndex(index);
        setCurrentExercise(addedExercises[index]);
    };

    const removeExercise = (index: number) => {
        setAddedExercises(addedExercises.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
            setCurrentExercise({
                name: "",
                series: 3,
                rir: 0,
                tempo: "2-1-1-1",
                method: "NORMAL",
                prescribed_reps: "10-12"
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (addedExercises.length === 0) return;
        setLoading(true);

        const scheduledFor = initialDate ? new Date(initialDate) : new Date();
        if (initialDate) {
            const now = new Date();
            scheduledFor.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        }

        const { data: task, error: taskError } = await supabase
            .from('daily_tasks')
            .insert([
                {
                    user_id: userId,
                    title,
                    task_type: 'workout',
                    scheduled_for: scheduledFor.toISOString(),
                    is_completed: false
                }
            ])
            .select()
            .single();

        if (taskError || !task) {
            setLoading(false);
            return;
        }

        if (addedExercises.length > 0) {
            await supabase
                .from('task_items')
                .insert(
                    addedExercises.map((ex, idx) => ({
                        task_id: task.id,
                        title: ex.name,
                        series: ex.series,
                        rir: ex.rir,
                        tempo: ex.tempo,
                        method: ex.method,
                        prescribed_reps: ex.prescribed_reps,
                        sort_order: idx
                    }))
                );
        }

        // Save as template if requested
        if (saveAsTemplate) {
            const { data: routine } = await supabase
                .from('routines')
                .insert([{ user_id: userId, name: title }])
                .select()
                .single();

            if (routine) {
                await supabase.from('routine_items').insert(
                    addedExercises.map((ex, idx) => ({
                        routine_id: routine.id,
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
        }

        onSuccess(task);
        setTitle("");
        setAddedExercises([]);
        onClose();
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-t-[3rem] p-8 z-[70] shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight font-outfit text-black dark:text-white">Nueva Rutina</h2>
                                <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mt-1">Configuración técnica</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 tap-target"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input
                                type="text"
                                placeholder="Ej: Empuje Día 1"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full h-16 px-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-blue-500 font-bold text-lg transition-all"
                                required
                            />

                            <div className="bg-neutral-50 dark:bg-neutral-800/30 p-6 rounded-[2rem] border border-neutral-100 dark:border-neutral-800/50 space-y-5">
                                <div className="flex items-center gap-2 px-1">
                                    <Settings2 size={16} className="text-blue-500" />
                                    <span className="font-black text-[10px] uppercase tracking-widest text-neutral-400">
                                        {editingIndex !== null ? 'Modificando Ejercicio' : 'Añadir Ejercicio'}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <select
                                            value={currentExercise.name}
                                            onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
                                            className="w-full h-14 px-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 appearance-none font-bold text-sm"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {Object.entries(groupedLibrary).map(([category, exercises]) => (
                                                <optgroup key={category} label={category.toUpperCase()} className="dark:bg-neutral-900">
                                                    {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={18} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest px-1">Método</label>
                                            <select
                                                value={currentExercise.method}
                                                onChange={(e) => setCurrentExercise({ ...currentExercise, method: e.target.value })}
                                                className="w-full h-12 px-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 font-bold text-xs"
                                            >
                                                {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest px-1">Reps</label>
                                            <input
                                                type="text"
                                                value={currentExercise.prescribed_reps}
                                                onChange={(e) => setCurrentExercise({ ...currentExercise, prescribed_reps: e.target.value })}
                                                className="w-full h-12 px-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 font-bold text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-1">
                                        <div className="flex justify-between px-1 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                                            <label>Series: {currentExercise.series}</label>
                                            <label>RIR: {currentExercise.rir}</label>
                                        </div>
                                        <div className="flex gap-4">
                                            <input
                                                type="range" min="1" max="10" step="1"
                                                value={currentExercise.series}
                                                onChange={(e) => setCurrentExercise({ ...currentExercise, series: parseInt(e.target.value) })}
                                                className="flex-1 accent-black dark:accent-white h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <input
                                                type="range" min="0" max="4" step="1"
                                                value={currentExercise.rir}
                                                onChange={(e) => setCurrentExercise({ ...currentExercise, rir: parseInt(e.target.value) })}
                                                className="flex-1 accent-blue-500 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-1">
                                        <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest px-1">Tempo (E-I-C-I)</label>
                                        <input
                                            type="text"
                                            value={currentExercise.tempo}
                                            onChange={(e) => setCurrentExercise({ ...currentExercise, tempo: e.target.value })}
                                            className="w-full h-12 px-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 font-mono text-center tracking-widest font-bold mt-1"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddOrUpdateExercise}
                                        disabled={!currentExercise.name}
                                        className={`tap-target w-full h-14 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm ${editingIndex !== null
                                            ? "bg-emerald-500 text-white"
                                            : "bg-blue-600 text-white disabled:opacity-30"
                                            }`}
                                    >
                                        {editingIndex !== null ? <Check size={18} /> : <Plus size={18} />}
                                        {editingIndex !== null ? 'Guardar Cambios' : 'Añadir a la lista'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-neutral-400 px-1">Resumen de Rutina</h3>
                                {addedExercises.map((ex, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={idx}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${editingIndex === idx
                                            ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30"
                                            : "bg-neutral-50 dark:bg-neutral-800/20 border-neutral-100 dark:border-neutral-800"
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0" onClick={() => startEditing(idx)}>
                                            <p className="font-bold text-sm truncate">{ex.name}</p>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase">
                                                {ex.series}x{ex.prescribed_reps} • RIR {ex.rir} • {ex.method}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => startEditing(idx)}
                                                className="p-2 text-neutral-300 hover:text-blue-500 transition-colors"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeExercise(idx)}
                                                className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                                <div className="flex items-center gap-3 px-2 py-4">
                                    <input
                                        type="checkbox"
                                        id="saveTemplate"
                                        checked={saveAsTemplate}
                                        onChange={(e) => setSaveAsTemplate(e.target.checked)}
                                        className="w-5 h-5 accent-blue-600 rounded-lg"
                                    />
                                    <label htmlFor="saveTemplate" className="text-xs font-black uppercase tracking-widest text-neutral-500 cursor-pointer">
                                        Guardar en Biblioteca para repetir luego
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || addedExercises.length === 0 || !title}
                                className="tap-target w-full h-16 bg-black dark:bg-white text-white dark:text-black rounded-[2rem] font-black text-lg shadow-xl disabled:opacity-50 mt-4"
                            >
                                {loading ? "Guardando..." : "Finalizar Programación"}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
