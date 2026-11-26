import React from "react";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { EquipmentItem } from "@/types";

interface ProfileEquipmentStepProps {
  equipment: EquipmentItem[];
  editingEquipmentId: string | null;
  editMaxLoad: string;
  editMinIncrement: string;
  onStartEdit: (item: EquipmentItem) => void;
  onChangeMaxLoad: (value: string) => void;
  onChangeMinIncrement: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (itemId: string) => void;
  onToggleConfirm: (item: EquipmentItem) => void;
  onBack: () => void;
  onConfirmAllAndNext: () => void;
}

export const ProfileEquipmentStep: React.FC<ProfileEquipmentStepProps> = ({
  equipment,
  editingEquipmentId,
  editMaxLoad,
  editMinIncrement,
  onStartEdit,
  onChangeMaxLoad,
  onChangeMinIncrement,
  onCancelEdit,
  onSaveEdit,
  onToggleConfirm,
  onBack,
  onConfirmAllAndNext,
}) => {
  const confirmedCount = equipment.filter((i) => i.isConfirmed).length;
  const allConfirmed = equipment.length > 0 && confirmedCount === equipment.length;

  return (
    <Card spotlight className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-4">
        <div>
          <span className="text-xs font-mono text-athloniq-lime uppercase font-semibold">
            Step 3 of 5
          </span>
          <h3 className="text-xl font-bold text-white mt-0.5">
            Home Gym Equipment Verification
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical home gym items must be confirmed to unlock tailored resistance training progressions.
          </p>
        </div>
        <Badge variant={allConfirmed ? "emerald" : "amber"}>
          {confirmedCount}/{equipment.length} CONFIRMED
        </Badge>
      </div>

      <div className="space-y-3">
        {equipment.map((item) => {
          const isEditingThis = editingEquipmentId === item.id;
          const maxInputId = `equip-max-${item.id}`;
          const incInputId = `equip-inc-${item.id}`;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col gap-4 ${
                item.isConfirmed
                  ? "bg-athloniq-surface border-emerald-500/40"
                  : "bg-athloniq-surface/60 border-amber-500/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                      item.isConfirmed
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    <Dumbbell className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{item.itemName}</span>
                      <Badge variant={item.isConfirmed ? "lime" : "amber"}>
                        {item.isConfirmed ? "CONFIRMED" : "UNCONFIRMED"}
                      </Badge>
                      <ProvenanceBadge
                        provenance={item.isConfirmed ? "user_confirmed" : "unconfirmed_equipment"}
                      />
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-1 tabular-nums">
                      Max Load: {item.maxLoadKg != null ? `${item.maxLoadKg} kg` : "Not set"} • Min
                      Increment: {item.minIncrementKg != null ? `${item.minIncrementKg} kg` : "Not set"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {!isEditingThis && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => onStartEdit(item)}
                    >
                      Set Limits
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant={item.isConfirmed ? "outline" : "primary"}
                    size="sm"
                    className="min-h-[44px]"
                    onClick={() => onToggleConfirm(item)}
                  >
                    {item.isConfirmed ? "Mark Unconfirmed" : "Confirm Available"}
                  </Button>
                </div>
              </div>

              {isEditingThis && (
                <div className="pt-3 border-t border-athloniq-border w-full flex flex-col sm:flex-row sm:items-end gap-3 animate-fade-in">
                  <div className="space-y-1 flex-1 w-full sm:w-auto">
                    <label htmlFor={maxInputId} className="text-[11px] text-slate-400 font-medium block">
                      Max Load (kg)
                    </label>
                    <input
                      id={maxInputId}
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="e.g. 70 (or leave blank)"
                      value={editMaxLoad}
                      onChange={(e) => onChangeMaxLoad(e.target.value)}
                      className="min-h-[44px] w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2.5 py-2 text-xs text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 flex-1 w-full sm:w-auto">
                    <label htmlFor={incInputId} className="text-[11px] text-slate-400 font-medium block">
                      Min Increment (kg)
                    </label>
                    <input
                      id={incInputId}
                      type="number"
                      step="0.25"
                      min="0"
                      placeholder="e.g. 2.5 (or leave blank)"
                      value={editMinIncrement}
                      onChange={(e) => onChangeMinIncrement(e.target.value)}
                      className="min-h-[44px] w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2.5 py-2 text-xs text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => onSaveEdit(item.id)}
                    >
                      Save & Confirm
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-athloniq-border">
        <Button type="button" variant="secondary" className="min-h-[44px]" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Button>
        <Button
          type="button"
          variant="primary"
          className="min-h-[44px]"
          onClick={onConfirmAllAndNext}
        >
          Confirm All Home Gym Equipment <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
};
