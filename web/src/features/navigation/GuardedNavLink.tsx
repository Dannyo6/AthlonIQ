import React from "react";
import { NavLink as RouterNavLink, NavLinkProps, useNavigate } from "react-router-dom";
import { useUnsavedWork } from "./UnsavedWorkContext";

export interface GuardedNavLinkProps extends Omit<NavLinkProps, "children"> {
  children?: React.ReactNode | ((props: { isActive: boolean; isPending: boolean }) => React.ReactNode);
}

export const GuardedNavLink = React.forwardRef<HTMLAnchorElement, GuardedNavLinkProps>(
  ({ to, onClick, ...props }, ref) => {
    const { isDirty, confirmNavigation } = useUnsavedWork();
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isDirty) {
        e.preventDefault();
        confirmNavigation(() => {
          if (typeof to === "string") {
            navigate(to);
          }
        });
        return;
      }
      if (onClick) {
        onClick(e);
      }
    };

    return <RouterNavLink ref={ref} to={to} onClick={handleClick} {...props} />;
  }
);

GuardedNavLink.displayName = "GuardedNavLink";
