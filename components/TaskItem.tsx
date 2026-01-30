"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Dumbbell, ChevronDown, ChevronUp, TrendingUp, ShieldCheck, Trash2, Sliders, Copy } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface TaskItemProps {
    task: {
        id: string;
        title: string;
        description?: string;
        task_type: 'meal' | 'workout';
        is_completed: boolean;
        scheduled_for: string;
        task_items?: {
            id: string;
            title: string;
            is_completed: boolean;
            series: number;
            rir: number;
            tempo: string;
            method: string;
            prescribed_reps: string;
            actual_reps?: number;
            actual_weight?: number;
        }[];
    };
    onToggle: (id: string, state: boolean) => void;
    onDelete: (id: string) => void;
    onDuplicate: () => void;
    onFocus?: () => void;
    isFocusMode?: boolean;
}

export default function TaskItem({ task, onToggle, onDelete, onDuplicate, onFocus, isFocusMode }: TaskItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [items, setItems] = useState(task.task_items || []);
    const [isCompleted, setIsCompleted] = useState(task.is_completed);

    const [itemData, setItemData] = useState<Record<string, { reps: string, weight: string }>>(
        (task.task_items || []).reduce((acc, it) => ({
            ...acc,
            [it.id]: {
                reps: it.actual_reps?.toString() || "",
                weight: it.actual_weight?.toString() || ""
            }
        }), {})
    );

    const toggleMainTask = () => {
        const newState = !isCompleted;
        setIsCompleted(newState);
        onToggle(task.id, newState);
    };

    const saveItemProgress = async (itemId: string) => {
        const data = itemData[itemId];
        const reps = parseInt(data.reps);
        const weight = parseFloat(data.weight);

        setItems(prev => prev.map(it => it.id === itemId ? { ...it, is_completed: true, actual_reps: reps, actual_weight: weight } : it));

        const { error } = await supabase
            .from('task_items')
            .update({
                is_completed: true,
                actual_reps: reps,
                actual_weight: weight
            })
            .eq('id', itemId);

        if (error) {
            setItems(prev => prev.map(it => it.id === itemId ? { ...it, is_completed: false } : it));
            alert("Error guardando progreso");
        }
    };

    const hasItems = items.length > 0;
    const completedItemsCount = items.filter(it => it.is_completed).length;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative mb-4 rounded-[2.5rem] border transition-all duration-300 overflow-hidden ${isCompleted
                ? "bg-emerald-500/5 dark:bg-emerald-500/5 border-emerald-500/20 shadow-none"
                : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-white/5 shadow-sm"
                }`}
        >
            <div className="flex items-center p-5 cursor-pointer" onClick={() => hasItems && setIsExpanded(!isExpanded)}>
                <div className={`w-12 h-12 rounded-2xl mr-4 flex items-center justify-center transition-colors shadow-inner ${isCompleted
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    }`}>
                    <Dumbbell size={24} strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-black tracking-tight font-outfit truncate ${isCompleted ? "text-neutral-400 line-through" : "text-neutral-900 dark:text-white"
                        }`}>
                        {task.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest bg-neutral-50 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-100 dark:border-white/5">
                            {items.length} EJERCICIOS
                        </span>
                        {hasItems && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${completedItemsCount === items.length ? "text-emerald-500" : "text-blue-500"
                                }`}>
                                {completedItemsCount}/{items.length} LISTO
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {onFocus && !isFocusMode && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onFocus(); }}
                            className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg mr-2 active:scale-95 transition-transform"
                        >
                            Iniciar
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                        className="p-2 text-neutral-300 hover:text-blue-500 transition-colors tap-target"
                        title="Repetir rutina"
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                        className="p-2 text-neutral-300 hover:text-red-500 transition-colors tap-target"
                    >
                        <Trash2 size={16} />
                    </button>
                    {!isFocusMode && (
                        <div className="text-neutral-300 p-2">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence initial={false}>
                {(isExpanded || isFocusMode) && hasItems && (
                    <motion.div
                        initial={isFocusMode ? { opacity: 1 } : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={`overflow-hidden ${isFocusMode ? "" : "px-5 pb-6"}`}
                    >
                        <div className={`space-y-6 ${isFocusMode ? "" : "pt-4 border-t border-neutral-50 dark:border-white/5"}`}>
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`rounded-[2.5rem] border transition-all ${isFocusMode ? "p-6" : "p-5"} ${item.is_completed
                                        ? "bg-neutral-50 dark:bg-neutral-800/10 border-neutral-100 dark:border-white/5"
                                        : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-white/5 shadow-xl shadow-black/5"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="max-w-[70%]">
                                            <h4 className={`${isFocusMode ? "text-xl" : "text-base"} font-black tracking-tighter font-outfit ${item.is_completed ? "text-neutral-400" : "text-neutral-900 dark:text-white"}`}>
                                                {item.title}
                                            </h4>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-neutral-500 uppercase bg-neutral-100 dark:bg-neutral-800/50 px-3 py-1.5 rounded-xl">
                                                    <Sliders size={12} className="text-blue-500" /> {item.series} SERIES
                                                </span>
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-neutral-500 uppercase bg-neutral-100 dark:bg-neutral-800/50 px-3 py-1.5 rounded-xl">
                                                    <TrendingUp size={12} className="text-orange-500" /> RIR {item.rir}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Objetivo</p>
                                            <p className={`${isFocusMode ? "text-2xl" : "text-lg"} font-black font-outfit text-blue-500`}>{item.prescribed_reps} REPS</p>
                                        </div>
                                    </div>

                                    {!item.is_completed ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    placeholder="KG"
                                                    value={itemData[item.id]?.weight}
                                                    onChange={(e) => setItemData({
                                                        ...itemData,
                                                        [item.id]: { ...itemData[item.id], weight: e.target.value }
                                                    })}
                                                    className={`${isFocusMode ? "h-16 text-xl" : "h-12 text-base"} w-full bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl text-center font-black border-2 border-transparent focus:border-blue-500 outline-none transition-all`}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    placeholder="REPS"
                                                    value={itemData[item.id]?.reps}
                                                    onChange={(e) => setItemData({
                                                        ...itemData,
                                                        [item.id]: { ...itemData[item.id], reps: e.target.value }
                                                    })}
                                                    className={`${isFocusMode ? "h-16 text-xl" : "h-12 text-base"} w-full bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl text-center font-black border-2 border-transparent focus:border-blue-500 outline-none transition-all`}
                                                />
                                            </div>
                                            <button
                                                onClick={() => saveItemProgress(item.id)}
                                                disabled={!itemData[item.id]?.reps || !itemData[item.id]?.weight}
                                                className={`${isFocusMode ? "h-16" : "h-12"} bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center tap-target disabled:opacity-20 transition-all shadow-lg active:scale-95`}
                                            >
                                                <Check size={28} strokeWidth={4} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                            <div className="flex gap-8">
                                                <div>
                                                    <p className="text-[10px] font-black text-neutral-400 uppercase">Peso</p>
                                                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{item.actual_weight} <span className="text-[10px]">KG</span></p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-neutral-400 uppercase">Reps</p>
                                                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{item.actual_reps} <span className="text-[10px]">REPS</span></p>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                                <Check size={18} strokeWidth={4} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <button
                                onClick={toggleMainTask}
                                className={`w-full ${isFocusMode ? "py-6" : "py-4"} rounded-3xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 mt-4 ${isCompleted
                                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                                    : "bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40"
                                    }`}
                            >
                                {isCompleted ? "Sesión Finalizada" : "Finalizar Entrenamiento"}
                                {isCompleted ? <ShieldCheck size={20} /> : <Check size={20} strokeWidth={3} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
