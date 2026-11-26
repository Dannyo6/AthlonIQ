import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressPhotoAsset } from "@/types";
import { ArrowLeftRight, Camera, CheckCircle2, Info, Trash2, X } from "lucide-react";

interface PhotoFormErrors {
  weight?: string;
  image?: string;
}

interface ProgressPhotosSectionProps {
  progressPhotos: ProgressPhotoAsset[];
  showPhotoForm: boolean;
  photoDate: string;
  photoWeight: string;
  photoUrl: string;
  photoNotes: string;
  compareIdA: string;
  compareIdB: string;
  onPhotoDateChange: (val: string) => void;
  onPhotoWeightChange: (val: string) => void;
  onPhotoUrlChange: (val: string) => void;
  onPhotoNotesChange: (val: string) => void;
  onCompareIdAChange: (val: string) => void;
  onCompareIdBChange: (val: string) => void;
  onSubmitPhoto: (payload: {
    loggedDate: string;
    weightKg: number;
    imageUrl: string;
    notes?: string;
  }) => void;
  onCancelPhotoForm: () => void;
  onDeletePhoto: (id: string) => void;
}

export const ProgressPhotosSection: React.FC<ProgressPhotosSectionProps> = ({
  progressPhotos,
  showPhotoForm,
  photoDate,
  photoWeight,
  photoUrl,
  photoNotes,
  compareIdA,
  compareIdB,
  onPhotoDateChange,
  onPhotoWeightChange,
  onPhotoUrlChange,
  onPhotoNotesChange,
  onCompareIdAChange,
  onCompareIdBChange,
  onSubmitPhoto,
  onCancelPhotoForm,
  onDeletePhoto,
}) => {
  const weightInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<PhotoFormErrors>({});

  useEffect(() => {
    if (showPhotoForm) {
      setErrors({});
      weightInputRef.current?.focus();
    }
  }, [showPhotoForm]);

  const validatePhotoFields = (): PhotoFormErrors => {
    const next: PhotoFormErrors = {};
    const wt = photoWeight.trim() ? Number(photoWeight.trim()) : NaN;
    if (!photoWeight.trim() || !Number.isFinite(wt) || wt < 25 || wt > 250) {
      next.weight = "Enter weight between 25 and 250 kg.";
    }
    if (!photoUrl.trim()) {
      next.image = "Select an image file or provide an image URL.";
    }
    return next;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const res = uploadEvent.target?.result;
      if (typeof res === "string") {
        onPhotoUrlChange(res);
        setErrors((prev) => ({ ...prev, image: undefined }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validatePhotoFields();
    setErrors(next);
    if (next.weight || next.image) return;

    onSubmitPhoto({
      loggedDate: photoDate,
      weightKg: Number(photoWeight.trim()),
      imageUrl: photoUrl.trim(),
      notes: photoNotes.trim() || undefined,
    });
  };

  const selectedPhotoA =
    progressPhotos.find((p) => p.id === compareIdA) || progressPhotos[progressPhotos.length - 1];
  const selectedPhotoB = progressPhotos.find((p) => p.id === compareIdB) || progressPhotos[0];

  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-athloniq-border pb-3">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-athloniq-lime shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold text-white">Private Progress Photo Timeline</h3>
            <p className="text-xs text-slate-400">
              Private, tenant-isolated visual records anchored by date and body weight.
            </p>
          </div>
        </div>
        <Badge variant="lime">PRIVATE STORAGE</Badge>
      </div>

      <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200 leading-relaxed">
        <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <span className="font-bold text-white">Visual Progress Reference Only: </span>
          Body-fat percentage and lean muscle mass cannot be accurately calculated from ordinary
          photographs or scale weight alone.
        </div>
      </div>

      {showPhotoForm && (
        <form
          onSubmit={handleFormSubmit}
          noValidate
          className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-athloniq-lime" aria-hidden="true" />
              <span>Upload Progress Photo</span>
            </h4>
            <button
              type="button"
              aria-label="Close photo upload form"
              onClick={onCancelPhotoForm}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-athloniq-card transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="progress-photo-date" className="text-xs text-slate-400 font-medium">
                Date
              </label>
              <input
                id="progress-photo-date"
                type="date"
                value={photoDate}
                onChange={(e) => onPhotoDateChange(e.target.value)}
                className="w-full min-h-[44px] mt-1 bg-athloniq-card border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="progress-photo-weight" className="text-xs text-slate-400 font-medium">
                Weight Badge (kg)
              </label>
              <input
                ref={weightInputRef}
                id="progress-photo-weight"
                type="number"
                min="25"
                max="250"
                step="0.1"
                value={photoWeight}
                aria-invalid={Boolean(errors.weight)}
                aria-describedby={errors.weight ? "photo-weight-error" : undefined}
                onChange={(e) => {
                  onPhotoWeightChange(e.target.value);
                  if (errors.weight) {
                    setErrors((prev) => ({ ...prev, weight: undefined }));
                  }
                }}
                className="w-full min-h-[44px] mt-1 bg-athloniq-card border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
              />
              {errors.weight && (
                <p id="photo-weight-error" role="alert" className="text-xs text-rose-400 mt-1">
                  {errors.weight}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="progress-photo-notes" className="text-xs text-slate-400 font-medium">
                Lighting / Pose Notes
              </label>
              <input
                id="progress-photo-notes"
                type="text"
                placeholder="e.g. Fasted AM, relaxed front pose"
                value={photoNotes}
                onChange={(e) => onPhotoNotesChange(e.target.value)}
                className="w-full min-h-[44px] mt-1 bg-athloniq-card border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label htmlFor="progress-photo-file" className="text-xs text-slate-400 font-medium">
              Select Image File or Paste URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="progress-photo-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="min-h-[44px] text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-athloniq-card file:text-athloniq-lime hover:file:bg-athloniq-surface-alt cursor-pointer"
              />
              <input
                id="progress-photo-url"
                aria-label="Progress photo image URL"
                type="text"
                placeholder="Or paste image URL / data URL..."
                value={photoUrl}
                aria-invalid={Boolean(errors.image)}
                aria-describedby={errors.image ? "photo-url-error" : undefined}
                onChange={(e) => {
                  onPhotoUrlChange(e.target.value);
                  if (errors.image) setErrors((prev) => ({ ...prev, image: undefined }));
                }}
                className="flex-1 min-h-[44px] bg-athloniq-card border border-athloniq-border rounded-xl px-3 py-2 text-xs text-white focus:border-athloniq-lime focus:outline-none"
              />
            </div>
            {errors.image && (
              <p id="photo-url-error" role="alert" className="text-xs text-rose-400 mt-1">
                {errors.image}
              </p>
            )}
          </div>

          {photoUrl && (
            <div className="w-28 h-36 rounded-xl overflow-hidden border border-athloniq-border bg-athloniq-card">
              <img src={photoUrl} alt="Selected progress photo preview" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" variant="primary" size="md" className="min-h-[44px]">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Save Photo Record
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              className="min-h-[44px]"
              onClick={onCancelPhotoForm}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {progressPhotos.length >= 2 && (
        <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ArrowLeftRight className="h-4 w-4 text-athloniq-lime" aria-hidden="true" />
              <span>Side-by-Side Comparison</span>
            </h4>
            <span className="text-[11px] text-slate-400">Comparing 2 Check-Ins</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="compare-photo-a" className="text-[11px] text-slate-400 font-medium">
                Baseline / Prior Date
              </label>
              <select
                id="compare-photo-a"
                value={selectedPhotoA?.id ?? ""}
                onChange={(e) => onCompareIdAChange(e.target.value)}
                className="w-full min-h-[44px] mt-1 bg-athloniq-card border border-athloniq-border rounded-xl px-3 py-2 text-xs text-white focus:border-athloniq-lime focus:outline-none"
              >
                {progressPhotos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.loggedDate} ({p.weightKg.toFixed(1)} kg) — {p.notes || "Check-in"}
                  </option>
                ))}
              </select>
              {selectedPhotoA && (
                <div className="mt-3 p-3 rounded-xl bg-athloniq-card border border-athloniq-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-white font-bold tabular-nums">
                      {selectedPhotoA.loggedDate}
                    </span>
                    <Badge variant="lime" className="font-mono tabular-nums">
                      {selectedPhotoA.weightKg.toFixed(1)} kg
                    </Badge>
                  </div>
                  <div className="h-48 rounded-lg overflow-hidden bg-athloniq-surface border border-athloniq-border flex items-center justify-center">
                    <img
                      src={selectedPhotoA.imageUrl}
                      alt={`Baseline progress photo from ${selectedPhotoA.loggedDate} (${selectedPhotoA.weightKg.toFixed(1)} kg)`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {selectedPhotoA.notes && (
                    <div className="text-[11px] text-slate-400">{selectedPhotoA.notes}</div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="compare-photo-b" className="text-[11px] text-slate-400 font-medium">
                Recent / Latest Date
              </label>
              <select
                id="compare-photo-b"
                value={selectedPhotoB?.id ?? ""}
                onChange={(e) => onCompareIdBChange(e.target.value)}
                className="w-full min-h-[44px] mt-1 bg-athloniq-card border border-athloniq-border rounded-xl px-3 py-2 text-xs text-white focus:border-athloniq-lime focus:outline-none"
              >
                {progressPhotos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.loggedDate} ({p.weightKg.toFixed(1)} kg) — {p.notes || "Check-in"}
                  </option>
                ))}
              </select>
              {selectedPhotoB && (
                <div className="mt-3 p-3 rounded-xl bg-athloniq-card border border-athloniq-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-white font-bold tabular-nums">
                      {selectedPhotoB.loggedDate}
                    </span>
                    <Badge variant="lime" className="font-mono tabular-nums">
                      {selectedPhotoB.weightKg.toFixed(1)} kg
                    </Badge>
                  </div>
                  <div className="h-48 rounded-lg overflow-hidden bg-athloniq-surface border border-athloniq-border flex items-center justify-center">
                    <img
                      src={selectedPhotoB.imageUrl}
                      alt={`Recent progress photo from ${selectedPhotoB.loggedDate} (${selectedPhotoB.weightKg.toFixed(1)} kg)`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {selectedPhotoB.notes && (
                    <div className="text-[11px] text-slate-400">{selectedPhotoB.notes}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {progressPhotos.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl bg-athloniq-surface/50 border border-athloniq-border text-slate-400 space-y-1.5">
          <Camera className="h-8 w-8 mx-auto text-slate-600" aria-hidden="true" />
          <p className="text-xs font-medium text-slate-300">No progress photos logged yet.</p>
          <p className="text-[11px] text-slate-500">
            Use Add Photo above to store private visual check-ins with date and scale weight.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {progressPhotos.map((photo) => (
            <div
              key={photo.id}
              className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2 relative"
            >
              <div className="h-40 rounded-lg overflow-hidden bg-athloniq-card flex items-center justify-center">
                <img
                  src={photo.imageUrl}
                  alt={`Progress photo logged on ${photo.loggedDate} (${photo.weightKg.toFixed(1)} kg)`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-mono text-white tabular-nums">{photo.loggedDate}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-athloniq-card text-athloniq-lime tabular-nums">
                  {photo.weightKg.toFixed(1)} kg
                </span>
              </div>
              {photo.notes && <div className="text-[11px] text-slate-400 truncate">{photo.notes}</div>}
              <button
                type="button"
                aria-label={`Delete progress photo from ${photo.loggedDate}`}
                onClick={() => onDeletePhoto(photo.id)}
                className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 rounded-lg bg-slate-950/80 text-slate-400 hover:text-rose-400 transition-colors"
                title="Delete photo record"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
