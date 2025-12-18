import type { Components, JSX } from "../types/components";

interface MyStatusBadge extends Components.MyStatusBadge, HTMLElement {}
export const MyStatusBadge: {
    prototype: MyStatusBadge;
    new (): MyStatusBadge;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
