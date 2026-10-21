"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface SortableHandleProps {
  handleProps: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: React.Ref<HTMLButtonElement>;
  };
  isDragging: boolean;
}

export function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (props: SortableHandleProps) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : undefined,
    zIndex: isDragging ? 20 : undefined,
    position: "relative",
  };

  const handleProps = {
    ...attributes,
    ...(listeners ?? {}),
    ref: setActivatorNodeRef,
  } as SortableHandleProps["handleProps"];

  return (
    <div ref={setNodeRef} style={style}>
      {children({ handleProps, isDragging })}
    </div>
  );
}
