"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Dumbbell, ChevronDown, ChevronUp, TrendingUp, Clock, ShieldCheck, Trash2, Sliders, Copy } from "lucide-react";
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
}

export default function TaskItem({ task, onToggle, onDelete, onDuplicate }: TaskItemProps) {
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
                <div className={`w-12 h-12 rounded-2xl mr-4 flex items-center justify-center transition-colors ${isCompleted
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-blue-50 dark:bg-blue-500/10 text-blue-500"
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
                    <div className="text-neutral-300 p-2">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && hasItems && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-6 overflow-hidden"
                    >
                        <div className="space-y-4 pt-4 border-t border-neutral-50 dark:border-white/5">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`p-5 rounded-[2rem] border transition-all ${item.is_completed
                                        ? "bg-neutral-50 dark:bg-neutral-800/10 border-neutral-100 dark:border-white/5"
                                        : "bg-neutral-50 dark:bg-neutral-800/20 border-neutral-100 dark:border-neutral-800/50"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="max-w-[70%]">
                                            <h4 className={`text-base font-black tracking-tight font-outfit ${item.is_completed ? "text-neutral-400" : "text-neutral-900 dark:text-white"}`}>
                                                {item.title}
                                            </h4>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                <span className="flex items-center gap-1 text-[9px] font-black text-neutral-500 uppercase bg-white dark:bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-100 dark:border-white/5">
                                                    <Sliders size={10} className="text-blue-500" /> {item.series} SETS
                                                </span>
                                                <span className="flex items-center gap-1 text-[9px] font-black text-neutral-500 uppercase bg-white dark:bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-100 dark:border-white/5">
                                                    <TrendingUp size={10} className="text-orange-500" /> RIR {item.rir}
                                                </span>
                                                <span className="flex items-center gap-1 text-[9px] font-black text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-500/10">
                                                    {item.method}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Objetivo</p>
                                            <p className="text-base font-black font-outfit text-blue-500">{item.prescribed_reps} REPS</p>
                                        </div>
                                    </div>

                                    {!item.is_completed ? (
                                        <div className="grid grid-cols-3 gap-2 mt-4">
                                            <div className="space-y-1">
                                                <input
                                                    type="number"
                                                    placeholder="KG"
                                                    value={itemData[item.id]?.weight}
                                                    onChange={(e) => setItemData({
                                                        ...itemData,
                                                        [item.id]: { ...itemData[item.id], weight: e.target.value }
                                                    })}
                                                    className="w-full h-12 bg-white dark:bg-neutral-900 rounded-xl text-center font-black text-base border border-neutral-100 dark:border-neutral-800 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <input
                                                    type="number"
                                                    placeholder="REPS"
                                                    value={itemData[item.id]?.reps}
                                                    onChange={(e) => setItemData({
                                                        ...itemData,
                                                        [item.id]: { ...itemData[item.id], reps: e.target.value }
                                                    })}
                                                    className="w-full h-12 bg-white dark:bg-neutral-900 rounded-xl text-center font-black text-base border border-neutral-100 dark:border-neutral-800 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={() => saveItemProgress(item.id)}
                                                disabled={!itemData[item.id]?.reps || !itemData[item.id]?.weight}
                                                className="h-12 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center tap-target disabled:opacity-20 transition-all shadow-sm"
                                            >
                                                <Check size={20} strokeWidth={3} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                            <div className="flex gap-6">
                                                <div>
                                                    <p className="text-[8px] font-black text-neutral-400 uppercase">Peso</p>
                                                    <p className="font-black text-xs text-emerald-600 dark:text-emerald-400">{item.actual_weight} KG</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-neutral-400 uppercase">Reps</p>
                                                    <p className="font-black text-xs text-emerald-600 dark:text-emerald-400">{item.actual_reps} REPS</p>
                                                </div>
                                            </div>
                                            <Check size={14} className="text-emerald-500" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            ))}

                            <button
                                onClick={toggleMainTask}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-2 ${isCompleted
                                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                                    : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    }`}
                            >
                                {isCompleted ? "Sesión Completada" : "Finalizar Entrenamiento"}
                                {isCompleted && <ShieldCheck size={16} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
