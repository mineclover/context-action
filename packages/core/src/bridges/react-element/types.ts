import type * as React from 'react';

export type ReactElementComponent<Props, Element extends HTMLElement, Handle = Element> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<Props & Omit<React.HTMLAttributes<Element>, keyof Props>> & React.RefAttributes<Handle>
>;
