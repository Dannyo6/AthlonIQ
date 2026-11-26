import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileJson,
  FileSpreadsheet,
  Shield,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ProfileDataPortabilitySectionProps {
  exportNotice: string | null;
  showDeleteModal: boolean;
  deleteConfirmText: string;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onOpenDeleteModal: () => void;
  onChangeDeleteConfirmText: (val: string) => void;
  onCancelDeleteModal: () => void;
  onConfirmDelete: () => void;
}

export const ProfileDataPortabilitySection: React.FC<ProfileDataPortabilitySectionProps> = ({
  exportNotice,
  showDeleteModal,
  deleteConfirmText,
  onExportJSON,
  onExportCSV,
  onOpenDeleteModal,
  onChangeDeleteConfirmText,
  onCancelDeleteModal,
  onConfirmDelete,
}) => {
  return (
    <>
      {exportNotice && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{exportNotice}</span>
        </div>
      )}

      <Card className="space-y-4 border-athloniq-border">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-athloniq-lime shrink-0" aria-hidden="true" />
          <div>
            <h3 className="font-bold text-white text-base">
              Data Portability, Export & Account Controls
            </h3>
            <p className="text-xs text-slate-400">
              Full athlete sovereignty. Export your logs as JSON or CSV spreadsheets, or securely wipe all personal data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] flex items-center justify-center gap-2"
            onClick={onExportJSON}
          >
            <FileJson className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
            <span>Export Complete JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] flex items-center justify-center gap-2"
            onClick={onExportCSV}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>Export CSV Spreadsheets</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] flex items-center justify-center gap-2 text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
            onClick={onOpenDeleteModal}
          >
            <Trash2 className="h-4 w-4 text-rose-400 shrink-0" aria-hidden="true" />
            <span>Reset / Delete All Data</span>
          </Button>
        </div>
      </Card>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-delete-modal-title"
            className="w-full max-w-md space-y-4 border-rose-500/40 bg-athloniq-card shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 id="profile-delete-modal-title" className="font-bold text-white text-lg">
                  Reset & Delete All Personal Data
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  This action will permanently purge all nutrition entries, weigh-ins, progress photos, workout routines, and AI conversation history from this device and local storage.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs text-rose-300">
              To confirm permanent deletion, please type{" "}
              <strong className="font-mono text-white">DELETE</strong> below:
            </div>

            <div className="space-y-1">
              <label htmlFor="profile-delete-confirm" className="text-xs font-medium text-slate-300 block">
                Confirmation Phrase
              </label>
              <input
                id="profile-delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => onChangeDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="min-h-[44px] w-full px-3 py-2 text-sm rounded-lg bg-athloniq-surface border border-athloniq-border text-white focus:outline-none focus:border-rose-400 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="min-h-[44px]"
                onClick={onCancelDeleteModal}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={deleteConfirmText.trim() !== "DELETE"}
                className="min-h-[44px] bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 disabled:cursor-not-allowed border-rose-600"
                onClick={onConfirmDelete}
              >
                Permanently Delete Data
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
