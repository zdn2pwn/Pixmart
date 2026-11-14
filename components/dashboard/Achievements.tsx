"use client";

import React from "react";
import { Lock, Trophy } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string | Date | null;
}

interface AchievementsProps {
  achievements: Achievement[];
}

export default function Achievements({ achievements }: AchievementsProps) {
  return (
    <div
      className="rounded-lg border flex flex-col"
      style={{ background: "#161616", borderColor: "#2a2a2a" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#2a2a2a" }}
      >
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{ fontFamily: "'Press Start 2P', monospace", color: "#555" }}
          >
            HALL OF FAME
          </span>
          <span className="text-sm font-semibold" style={{ color: "#f0f0f0" }}>
            Achievements
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: "#888" }}>
          {achievements.filter((a) => a.unlocked).length}/{achievements.length} unlocked
        </span>
      </div>

      {/* Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {achievements.length === 0 && (
          <div
            className="col-span-full text-center py-6 text-xs font-mono"
            style={{ color: "#555" }}
          >
            NO ACHIEVEMENTS YET
          </div>
        )}
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="flex flex-col items-center gap-2 rounded-lg p-3 border text-center transition-colors"
            style={{
              background: achievement.unlocked ? "#0a1f0a" : "#111",
              borderColor: achievement.unlocked ? "#22c55e" : "#2a2a2a",
              opacity: achievement.unlocked ? 1 : 0.6,
            }}
          >
            {/* Icon */}
            <div
              className="flex items-center justify-center rounded"
              style={{
                width: 36,
                height: 36,
                background: achievement.unlocked ? "#052e16" : "#1a1a1a",
                border: `1px solid ${achievement.unlocked ? "#166534" : "#2a2a2a"}`,
              }}
            >
              {achievement.unlocked ? (
                <Trophy size={16} style={{ color: "#22c55e" }} />
              ) : (
                <Lock size={14} style={{ color: "#555" }} />
              )}
            </div>

            {/* Name */}
            <span
              className="text-[9px] tracking-wide uppercase leading-tight"
              style={{
                fontFamily: "'Press Start 2P', monospace",
                color: achievement.unlocked ? "#22c55e" : "#555",
                lineHeight: 1.4,
              }}
            >
              {achievement.name}
            </span>

            {/* Description */}
            <span
              className="text-[11px] leading-snug"
              style={{ color: achievement.unlocked ? "#888" : "#444" }}
            >
              {achievement.description}
            </span>

            {/* Unlocked date */}
            {achievement.unlocked && achievement.unlockedAt && (
              <span className="text-[10px] font-mono" style={{ color: "#555" }}>
                {new Date(achievement.unlockedAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
