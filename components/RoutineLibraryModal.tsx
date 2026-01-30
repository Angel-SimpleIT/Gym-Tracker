"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Trash2, Copy, Plus, Edit3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import CreateRoutineModal from "./CreateRoutineModal";

interface RoutineItem {
    id: string;
    routine_id: string;
    exercise_name: string;
    series: number;
    rir: number;
    tempo: string;
    method: string;
    prescribed_reps: string;
}

interface Routine {
    id: string;
    name: string;
    routine_items: RoutineItem[];
}

interface RoutineLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    selectedDate: Date;
    onApplyRoutine: (routine: Routine) => void;
}

export default function RoutineLibraryModal({ isOpen, onClose, userId, selectedDate, onApplyRoutine }: RoutineLibraryModalProps) {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<Routine | null>(null);

    const fetchRoutines = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('routines')
            .select('*, routine_items(*)')
            .order('name', { ascending: true });

        if (!error && data) {
            setRoutines(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchRoutines();
        }
    }, [isOpen, fetchRoutines]);

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('routines').delete().eq('id', id);
        if (!error) {
            setRoutines(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleDuplicate = async (routine: Routine) => {
        setLoading(true);
        const { data: newRoutine } = await supabase
            .from('routines')
            .insert([{ user_id: userId, name: `${routine.name} (Copia)` }])
            .select()
            .single();

        if (newRoutine) {
            await supabase.from('routine_items').insert(
                routine.routine_items.map((it: RoutineItem, idx: number) => ({
                    routine_id: newRoutine.id,
                    exercise_name: it.exercise_name,
                    series: it.series,
                    rir: it.rir,
                    tempo: it.tempo,
                    method: it.method,
                    prescribed_reps: it.prescribed_reps,
                    sort_order: idx
                }))
            );
            fetchRoutines();
        }
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-neutral-950 z-[70] shadow-2xl flex flex-col"
                    >
                        <div className="p-8 pb-4 flex justify-between items-center border-b border-neutral-100 dark:border-white/5">
                            <div>
                                <h2 className="text-3xl font-black tracking-tighter font-outfit text-black dark:text-white">Mis Rutinas</h2>
                                <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mt-1">Biblioteca Maestra</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 tap-target"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-2 border-neutral-200 border-t-blue-500 rounded-full animate-spin" />
                                </div>
                            ) : routines.length === 0 ? (
                                <div className="text-center py-16 px-6">
                                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-3xl flex items-center justify-center mx-auto mb-4 text-neutral-300">
                                        <Plus size={32} />
                                    </div>
                                    <p className="text-neutral-400 font-medium">No tienes rutinas guardadas.</p>
                                    <p className="text-xs text-neutral-500 mt-2">Crea una rutina desde el Dashboard y guárdala como plantilla.</p>
                                </div>
                            ) : (
                                routines.map((routine) => (
                                    <motion.div
                                        key={routine.id}
                                        layout
                                        className="group bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-white/5 rounded-[2.5rem] p-6 tap-target"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-black tracking-tight text-neutral-900 dark:text-white mb-1">
                                                    {routine.name}
                                                </h3>
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                                    {routine.routine_items.length} Ejercicios
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDuplicate(routine)}
                                                    className="p-2 text-neutral-300 hover:text-blue-500 transition-colors"
                                                    title="Duplicar plantilla"
                                                >
                                                    <Copy size={18} />
                                                </button>
                                                <button
                                                    onClick={() => { setTemplateToEdit(routine); setIsCreateModalOpen(true); }}
                                                    className="p-2 text-neutral-300 hover:text-emerald-500 transition-colors"
                                                    title="Editar plantilla"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(routine.id)}
                                                    className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={() => onApplyRoutine(routine)}
                                                className="flex-1 h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <Play size={16} fill="currentColor" />
                                                Asignar a {format(selectedDate, "EEE d", { locale: es })}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-white/5">
                            <button
                                className="w-full h-18 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20"
                                onClick={() => { setTemplateToEdit(null); setIsCreateModalOpen(true); }}
                            >
                                <Plus size={20} strokeWidth={3} />
                                Nueva Plantilla
                            </button>
                        </div>
                    </motion.div>
                </>
            )}

            <CreateRoutineModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchRoutines}
                userId={userId}
                routineToEdit={templateToEdit}
            />
        </AnimatePresence>
    );
}
