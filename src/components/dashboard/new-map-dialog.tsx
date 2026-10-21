"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, LifeBuoy, ShoppingCart, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { MAP_TEMPLATES } from "@/domain/templates";
import { useWorkspace } from "@/store/workspace";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError, FieldLabel, Input, Textarea } from "@/components/ui/input";

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  blank: <FilePlus2 className="h-4 w-4" aria-hidden="true" />,
  "support-escalation": <LifeBuoy className="h-4 w-4" aria-hidden="true" />,
  "new-hire-onboarding": <UserPlus className="h-4 w-4" aria-hidden="true" />,
  "purchase-order-approval": <ShoppingCart className="h-4 w-4" aria-hidden="true" />,
};

const TINT_BARS = [
  "bg-suppliers-tint",
  "bg-inputs-tint",
  "bg-process-tint",
  "bg-outputs-tint",
  "bg-customers-tint",
];

export function NewMapDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const createMap = useWorkspace((state) => state.createMap);
  const [selection, setSelection] = React.useState("blank");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [suggestedTitle, setSuggestedTitle] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const choose = (id: string, name: string) => {
    setSelection(id);
    if (!title.trim() || title === suggestedTitle) {
      setTitle(id === "blank" ? "" : name);
      setSuggestedTitle(id === "blank" ? "" : name);
    }
    setError(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("A map title is required.");
      return;
    }
    const id = createMap({
      title,
      description,
      templateId: selection === "blank" ? undefined : selection,
    });
    if (!id) {
      setError("The map could not be created.");
      return;
    }
    toast(selection === "blank" ? "Blank map created." : "Map created from template.");
    onOpenChange(false);
    router.push(`/maps/${id}`);
  };

  const options = [
    {
      id: "blank",
      name: "Blank map",
      summary: "Start with empty lanes and an empty flow.",
      icon: "blank",
    },
    ...MAP_TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      summary: template.summary,
      icon: template.id,
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogTitle>New map</DialogTitle>
        <DialogDescription>
          Start blank or use a complete template. Templates arrive with a SIPOC frame and a flow you
          can edit.
        </DialogDescription>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <fieldset>
            <legend className="eyebrow mb-2.5">Start from</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map((option) => {
                const selected = selection === option.id;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer flex-col rounded-card border p-3 transition-[border-color,background-color,box-shadow] duration-150",
                      "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
                      selected
                        ? "border-ink bg-surface shadow-soft"
                        : "border-line bg-surface/60 hover:border-line-strong hover:bg-surface",
                    )}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={option.id}
                      checked={selected}
                      onChange={() => choose(option.id, option.name)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-paper text-ink-soft">
                        {TEMPLATE_ICONS[option.icon]}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border",
                          selected ? "border-accent bg-accent" : "border-line-strong bg-surface",
                        )}
                        aria-hidden="true"
                      >
                        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-paper" /> : null}
                      </span>
                    </div>
                    <span className="mt-2 text-[13px] font-semibold text-ink">{option.name}</span>
                    <span className="mt-0.5 line-clamp-2 text-[11.5px] leading-4 text-muted">
                      {option.summary}
                    </span>
                    {option.id !== "blank" ? (
                      <span className="mt-2 flex gap-1" aria-hidden="true">
                        {TINT_BARS.map((tint) => (
                          <span key={tint} className={cn("h-1.5 flex-1 rounded-full", tint)} />
                        ))}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <FieldLabel htmlFor="new-map-title">Title</FieldLabel>
            <Input
              id="new-map-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setError(null);
              }}
              placeholder="Returns and refunds"
              aria-invalid={Boolean(error)}
              autoFocus
            />
            <FieldError>{error}</FieldError>
          </div>

          <div>
            <FieldLabel htmlFor="new-map-description" hint="Optional">
              Purpose
            </FieldLabel>
            <Textarea
              id="new-map-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What this process is for, who it serves, and where it starts."
              className="min-h-20"
            />
          </div>

          <DialogActions>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="primary">
              Create map
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
