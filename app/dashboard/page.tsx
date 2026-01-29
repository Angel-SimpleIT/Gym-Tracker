"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import TaskItem from "@/components/TaskItem";
import CreateTaskModal from "@/components/CreateTaskModal";
import { Calendar, Flame, Target, LogOut, Plus, BookOpen } from "lucide-react";
import RoutineLibraryModal from "@/components/RoutineLibraryModal";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

interface Task {
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
}

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
            } else {
                setUser(user);
                fetchTasks(user.id, selectedDate);
            }
        };
        checkUser();
    }, [selectedDate]);

    const fetchTasks = async (userId: string, date: Date) => {
        setLoading(true);
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const { data, error } = await supabase
            .from('daily_tasks')
            .select('*, task_items(*)')
            .eq('user_id', userId)
            .gte('scheduled_for', start.toISOString())
            .lt('scheduled_for', end.toISOString())
            .order('scheduled_for', { ascending: true });

        if (!error && data) {
            setTasks(data);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('daily_tasks')
            .delete()
            .eq('id', id);

        if (!error) {
            setTasks(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleDuplicateRoutine = async (task: Task) => {
        if (!user) return;
        setLoading(true);

        // 1. Create the main task
        const { data: newTask, error: taskError } = await supabase
            .from('daily_tasks')
            .insert([{
                user_id: user.id,
                title: `${task.title} (Copia)`,
                task_type: task.task_type,
                scheduled_for: selectedDate.toISOString(),
                is_completed: false
            }])
            .select()
            .single();

        if (taskError || !newTask) {
            alert("Error al duplicar la rutina");
            setLoading(false);
            return;
        }

        // 2. Create the task items (exercises)
        if (task.task_items && task.task_items.length > 0) {
            const { error: itemsError } = await supabase
                .from('task_items')
                .insert(task.task_items.map((it, idx) => ({
                    task_id: newTask.id,
                    title: it.title,
                    series: it.series,
                    rir: it.rir,
                    tempo: it.tempo,
                    method: it.method,
                    prescribed_reps: it.prescribed_reps,
                    sort_order: idx,
                    is_completed: false
                })));

            if (itemsError) {
                alert("Error al duplicar los ejercicios");
            }
        }

        await fetchTasks(user.id, selectedDate);
    };

    const handleApplyRoutine = async (routine: any) => {
        if (!user) return;
        setLoading(true);

        const { data: newTask, error: taskError } = await supabase
            .from('daily_tasks')
            .insert([{
                user_id: user.id,
                title: routine.name,
                task_type: 'workout',
                scheduled_for: selectedDate.toISOString(),
                is_completed: false
            }])
            .select()
            .single();

        if (taskError || !newTask) {
            alert("Error al asignar rutina");
            setLoading(false);
            return;
        }

        if (routine.routine_items && routine.routine_items.length > 0) {
            await supabase.from('task_items').insert(
                routine.routine_items.map((it: any, idx: number) => ({
                    task_id: newTask.id,
                    title: it.exercise_name,
                    series: it.series,
                    rir: it.rir,
                    tempo: it.tempo,
                    method: it.method,
                    prescribed_reps: it.prescribed_reps,
                    sort_order: idx
                }))
            );
        }

        await fetchTasks(user.id, selectedDate);
        setIsLibraryOpen(false);
    };

    const handleToggle = async (id: string, state: boolean) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: state } : t));

        const { error } = await supabase
            .from('daily_tasks')
            .update({
                is_completed: state,
                completed_at: state ? new Date().toISOString() : null
            })
            .eq('id', id);

        if (error) {
            setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !state } : t));
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth');
    };

    const completedCount = tasks.filter(t => t.is_completed).length;
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#09090b]">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-2 border-neutral-100 dark:border-neutral-800 border-t-blue-500 rounded-full"
            />
        </div>
    );

    return (
        <div className="px-6 pt-10 pb-32 max-w-lg mx-auto min-h-screen">
            <header className="mb-10">
                <div className="flex justify-between items-center mb-10">
                    <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-white/5 p-1.5 rounded-full flex items-center gap-3 pr-4">
                        <div className="w-9 h-9 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-xs">
                            {user?.email?.substring(0, 2).toUpperCase() || 'UT'}
                        </div>
                        <div>
                            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                                {isSameDay(selectedDate, startOfToday()) ? 'Hoy' : format(selectedDate, "eeee", { locale: es })}
                            </p>
                            <p className="text-sm font-bold tracking-tight">
                                {format(selectedDate, "d 'de' MMMM", { locale: es })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-10 h-10 rounded-full border border-neutral-100 dark:border-white/5 flex items-center justify-center text-neutral-400 tap-target"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

                <h1 className="text-4xl font-black tracking-tighter mb-8 font-outfit text-neutral-900 dark:text-white">
                    Vamos por ello.
                </h1>

                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                    {[...Array(7)].map((_, i) => {
                        const date = addDays(startOfToday(), i);
                        const isSelected = isSameDay(date, selectedDate);
                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(date)}
                                className={`flex-shrink-0 w-14 h-20 rounded-3xl flex flex-col items-center justify-center transition-all tap-target ${isSelected
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                    : "bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-white/5 text-neutral-400"
                                    }`}
                            >
                                <span className={`text-[9px] font-black uppercase tracking-tighter mb-1 ${isSelected ? "text-blue-100" : "text-neutral-500"}`}>
                                    {format(date, "EEE", { locale: es })}
                                </span>
                                <span className="text-lg font-black">{format(date, "d")}</span>
                            </button>
                        );
                    })}
                </div>
            </header>

            <section>
                <div className="flex items-center justify-between mb-6 px-1">
                    <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">Tu Cronograma</h2>
                    <span className="text-[10px] font-black text-neutral-500 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 px-2.5 py-1 rounded-full uppercase tracking-widest">
                        {tasks.length} Tareas
                    </span>
                </div>

                {tasks.length === 0 ? (
                    <div className="text-center py-16 px-6 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-[2.5rem] border border-dashed border-neutral-200 dark:border-white/5">
                        <p className="text-neutral-400 font-medium text-sm">No hay tareas para hoy.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 text-xs font-black text-blue-600 uppercase tracking-widest"
                        >
                            Crear rutina +
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                                onDuplicate={() => handleDuplicateRoutine(task)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Float Navigation bar */}
            <nav className="fixed bottom-6 left-6 right-6 h-18 glass rounded-full flex items-center justify-around px-2 shadow-2xl z-50 max-w-md mx-auto">
                <button
                    onClick={() => setIsLibraryOpen(true)}
                    className={`p-4 tap-target ${isLibraryOpen ? 'text-blue-500' : 'text-neutral-400'}`}
                >
                    <BookOpen size={22} strokeWidth={2.5} />
                </button>
                <button
                    onClick={() => setIsLibraryOpen(false)}
                    className={`p-4 tap-target ${!isLibraryOpen ? 'text-blue-500' : 'text-neutral-400'}`}
                >
                    <Calendar size={22} strokeWidth={2.5} />
                </button>
                <div
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg cursor-pointer tap-target"
                >
                    <Plus size={24} strokeWidth={3} />
                </div>
                <button className="p-4 text-neutral-400 tap-target">
                    <Flame size={22} strokeWidth={2.5} />
                </button>
                <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-white dark:border-neutral-800 overflow-hidden shadow-sm">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="profile" />
                </div>
            </nav>

            {user && (
                <>
                    <CreateTaskModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={() => fetchTasks(user.id, selectedDate)}
                        userId={user.id}
                        initialDate={selectedDate}
                    />
                    <RoutineLibraryModal
                        isOpen={isLibraryOpen}
                        onClose={() => setIsLibraryOpen(false)}
                        userId={user.id}
                        selectedDate={selectedDate}
                        onApplyRoutine={handleApplyRoutine}
                    />
                </>
            )}
        </div>
    );
}
