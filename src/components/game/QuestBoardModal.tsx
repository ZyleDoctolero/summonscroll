import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskCard, type Task } from "@/components/game/TaskCard";
import type { TaskType } from "@/lib/game/constants";
import type { UserProfile } from "@/lib/game/supabase-api";

interface QuestBoardModalProps {
  open: boolean;
  onClose: () => void;
  tab: TaskType | "vice";
  setTab: (tab: TaskType | "vice") => void;
  filtered: Task[];
  busyIds: Set<string>;
  profile: UserProfile | null;
  onScore: (id: string, direction: "plus" | "minus" | "complete" | "uncomplete") => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onIssueQuest: () => void;
}

export function QuestBoardModal({
  open,
  onClose,
  tab,
  setTab,
  filtered,
  busyIds,
  profile,
  onScore,
  onEdit,
  onDelete,
  onIssueQuest,
}: QuestBoardModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl max-h-[85vh] bg-[#0a0512] border-2 border-[#d4af3f]/30 rounded-xl shadow-[0_0_50px_rgba(10,5,18,0.9),inset_0_0_30px_rgba(212,175,63,0.1)] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-[#d4af3f]/20 flex justify-between items-center bg-gradient-to-r from-[#1a0f2e] to-transparent">
              <h2
                className="t-h2 text-2xl"
                style={{
                  color: "var(--gold-bright)",
                  textShadow: "0 2px 10px rgba(212,175,63,0.5)",
                }}
              >
                Quest Board
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={onIssueQuest}
                  className="ss-btn ss-btn-d-primary shadow-[0_0_15px_rgba(212,175,63,0.4)]"
                >
                  + Issue Quest
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Icon name="close" size={24} color="var(--ink-secondary)" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <div
                className="flex gap-6 mb-6 border-b-2"
                style={{ borderColor: "rgba(212,175,63,0.3)" }}
              >
                {(["habit", "daily", "todo"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`ss-tab-d pb-2 text-base font-semibold capitalize ${tab === t ? "active text-[#fcd34d]" : "text-[#b09e80] hover:text-[#d4af3f]"}`}
                  >
                    {t === "habit" ? "Habits" : t === "daily" ? "Dailies" : "To-Dos"}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  icon={tab === "habit" ? "morning" : tab === "daily" ? "morning" : "checklist"}
                  title={
                    tab === "habit"
                      ? "The board is empty."
                      : tab === "daily"
                        ? "No daily bounties."
                        : "No pending requests."
                  }
                  body="Issue a new quest to begin earning rewards."
                  cta={{
                    label: "Issue Quest",
                    onClick: onIssueQuest,
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filtered.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      busy={busyIds.has(task.id)}
                      isTutorial={profile?.tutorial_directive_id === task.id}
                      onScore={(dir) => onScore(task.id, dir)}
                      onEdit={() => onEdit(task)}
                      onDelete={() => onDelete(task.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
