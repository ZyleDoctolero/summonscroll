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
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-8"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[rgba(61,46,31,0.5)] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl h-[100dvh] md:h-auto md:max-h-[85vh] bg-[rgba(255,252,247,0.96)] border-0 md:border-2 border-[#c89a3e]/30 rounded-t-2xl md:rounded-xl shadow-[0_8px_40px_rgba(120,90,50,0.15)] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-[#c89a3e]/20 flex justify-between items-center bg-gradient-to-r from-[rgba(200,154,62,0.08)] to-transparent shrink-0">
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
                  className="p-2 hover:bg-[rgba(200,154,62,0.1)] rounded-full transition-colors"
                >
                  <Icon name="close" size={24} color="var(--ink-secondary)" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 custom-scrollbar">
              <div
                className="flex gap-6 mb-6 border-b-2"
                style={{ borderColor: "rgba(200,154,62,0.25)" }}
              >
                {(["habit", "daily", "todo"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`ss-tab-d pb-2 text-base font-semibold capitalize min-h-[44px] ${tab === t ? "active text-[#b8860b]" : "text-[#8b7355] hover:text-[#c89a3e]"}`}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
