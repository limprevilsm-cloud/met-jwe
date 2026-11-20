import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { HOOGLAND_GOALS } from '../data/hooglandData';
import type { GoalItem } from '../types/draughts';

interface GoalsViewProps {
  checkedGoalIds: string[];
  notes: Record<string, string>;
  onToggleGoal: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onNavigateToLinked: (goal: GoalItem) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  checkedGoalIds,
  notes,
  onToggleGoal,
  onUpdateNote,
  onNavigateToLinked,
}) => {
  const total = HOOGLAND_GOALS.length;
  const completed = checkedGoalIds.length;
  const pct = Math.round((completed / total) * 100);

  // Group goals by theme preserving order
  const themes: string[] = [];
  for (const g of HOOGLAND_GOALS) {
    if (!themes.includes(g.theme)) themes.push(g.theme);
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 py-2">
      {/* Header & Overall Mastery Meter */}
      <div className="bg-[#262421] border border-[#3c3934] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5 max-w-xl">
          <p className="text-xs text-[#9c9890]">
            Programme KNDB Niveau 6 · T. Goedemoed & J. Krajenbrink (Trad. H. Kolk)
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white text-balance">
            Fiche d’Objectifs — Cours Hoogland
          </h1>
          <p className="text-sm text-[#bababa] leading-relaxed">
            Suivez votre maîtrise des compétences stratégiques, combinatoires et de taxation. Vos
            validations et notes personnelles sont enregistrées automatiquement.
          </p>
        </div>

        <div className="min-w-[220px] flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-[#9c9890]">Progression globale</span>
            <span className="font-mono text-sm font-semibold text-white">
              {completed} / {total} ({pct}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#161512] rounded-full overflow-hidden border border-[#3c3934]">
            <div
              className="h-full bg-[#629924] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Themes Checklist */}
      <div className="flex flex-col gap-8">
        {themes.map((themeTitle) => {
          const items = HOOGLAND_GOALS.filter((g) => g.theme === themeTitle);
          const themeDone = items.filter((g) => checkedGoalIds.includes(g.id)).length;

          return (
            <section key={themeTitle} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between border-b border-[#3c3934] pb-2">
                <h2 className="text-base font-semibold text-white">{themeTitle}</h2>
                <span className="text-xs font-mono text-[#9c9890]">
                  {themeDone} / {items.length} acquis
                </span>
              </div>

              <div className="flex flex-col divide-y divide-[#3c3934] bg-[#262421] border border-[#3c3934] rounded-xl overflow-hidden">
                {items.map((goal) => {
                  const isChecked = checkedGoalIds.includes(goal.id);
                  const note = notes[goal.id] ?? '';

                  return (
                    <div key={goal.id} className="p-4 sm:p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={isChecked}
                            onClick={() => onToggleGoal(goal.id)}
                            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? 'bg-[#629924] border-[#629924] text-white'
                                : 'bg-[#161512] border-[#524e47] hover:border-[#8d8980]'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                          </button>

                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-xs text-[#d59120]">{goal.code}</span>
                              <span
                                className={`text-sm font-semibold ${
                                  isChecked ? 'text-[#9c9890] line-through' : 'text-white'
                                }`}
                              >
                                {goal.title}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#bababa] leading-relaxed">
                              {goal.description}
                            </p>
                          </div>
                        </label>

                        {goal.linkedTab && goal.linkedId && (
                          <button
                            type="button"
                            onClick={() => onNavigateToLinked(goal)}
                            className="px-3 py-1.5 rounded-md bg-[#302e2c] hover:bg-[#3c3934] border border-[#4a4640] text-xs font-medium text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                          >
                            <span>Pratiquer</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="pl-8">
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => onUpdateNote(goal.id, e.target.value)}
                          placeholder="Note personnelle ou variante à retenir…"
                          className="w-full bg-[#161512] border border-[#3c3934] rounded-md px-3 py-1.5 text-xs text-[#e0ddd6] placeholder:text-[#6e6a63] focus:outline-none focus:border-[#629924]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
