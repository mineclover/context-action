import React from 'react';
import { cn } from '../../lib/utils';
import { cardVariants, type CardVariants } from './variants';

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>, 
    CardVariants {}

export function Card({ 
  className, 
  variant, 
  size, 
  hover, 
  category, 
  children, 
  ...props 
}: CardProps) {
  return (
    <div 
      className={cn(cardVariants({ variant, size, hover, category }), className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold text-gray-900 mb-2", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-gray-600", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4 pt-4 border-t border-gray-200", className)} {...props}>
      {children}
    </div>
  );
}