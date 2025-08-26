// Export all UI components

// Export utilities
export { cn } from '../../lib/utils';
// Export layout components
export {
  FeatureHighlight,
  PageLayout,
  PageSection,
} from '../layout/PageLayout';
export { Badge } from './Badge';
export { Button } from './Button';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './Card';
export { CodeBlock, CodeExample } from './CodeExample';
// Export specialized components
export * from './ComparisonComponents';
export { Container } from './Container';
export { DemoCard } from './DemoCard';
export { Grid } from './Grid';
export { Input, Textarea } from './Input';
export { Label } from './Label';
// Re-export from shared components for compatibility
// export { Section } from '../../domains/shared/components'; // Removed - domain restructured
export {
  ActionPatternBadge,
  ContextPatternBadge,
  HOCPatternBadge,
  PatternBadge,
  ProviderPatternBadge,
  StorePatternBadge,
  UnifiedPatternBadge,
} from './PatternBadge';
export { Status } from './Status';
export { Section } from './Section';
export { StatusIndicator } from './StatusIndicator';
export { MetricsDisplay } from './MetricsDisplay';
// Export variants and types
export * from './variants';
