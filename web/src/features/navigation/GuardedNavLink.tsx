import React from "react";
import { NavLink as RouterNavLink, NavLinkProps, useNavigate } from "react-router-dom";
import { useUnsavedWork } from "./UnsavedWorkContext";
import { navigateWithTransition } from "@/lib/viewTransition";

export interface GuardedNavLinkProps extends Omit<NavLinkProps, "children"> {
  children?: React.ReactNode | ((props: { isActive: boolean; isPending: boolean }) => React.ReactNode);
}

export const GuardedNavLink = React.forwardRef<HTMLAnchorElement, GuardedNavLinkProps>(
  ({ to, onClick, target, ...props }, ref) => {
    const { isDirty, confirmNavigation } = useUnsavedWork();
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isDirty) {
        e.preventDefault();
        confirmNavigation(() => {
          if (typeof to === "string") {
            navigateWithTransition(() => navigate(to));
          }
        });
        return;
      }

      if (onClick) {
        onClick(e);
      }

      const isPlainLeftClick =
        !e.defaultPrevented &&
        e.button === 0 &&
        !e.metaKey &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        (!target || target === "_self");

      if (isPlainLeftClick && typeof to === "string") {
        e.preventDefault();
        navigateWithTransition(() => navigate(to));
      }
    };

    return <RouterNavLink ref={ref} to={to} target={target} onClick={handleClick} {...props} />;
  }
);

GuardedNavLink.displayName = "GuardedNavLink";
