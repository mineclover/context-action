/**
 * Panda CSS Recipes
 * Converted from class-variance-authority variants
 */
import { cva, type RecipeVariantProps } from '../../../styled-system/css';

// Container Recipe
export const containerRecipe = cva({
  base: {
    w: 'full',
    maxW: 'none',
  },
  variants: {
    size: {
      sm: { maxW: '2xl' },
      md: { maxW: '4xl' },
      lg: { maxW: '6xl' },
      xl: { maxW: '8xl' },
      full: { maxW: 'none' },
    },
    centered: {
      true: { mx: 'auto' },
      false: {},
    },
    padding: {
      none: { p: '0' },
      sm: { p: '4' },
      md: { p: '6' },
      lg: { p: '8' },
      xl: { p: '12' },
    },
  },
  defaultVariants: {
    size: 'lg',
    centered: true,
    padding: 'md',
  },
});

// Card Recipe
export const cardRecipe = cva({
  base: {
    bg: 'white',
    borderWidth: '1px',
    rounded: 'lg',
    transition: 'all 0.2s',
  },
  variants: {
    variant: {
      default: { borderColor: 'gray.200', shadow: 'sm' },
      elevated: { borderColor: 'gray.200', shadow: 'lg' },
      outlined: { borderColor: 'gray.300', shadow: 'none' },
      bordered: { borderWidth: '2px', borderColor: 'gray.200', shadow: 'none' },
    },
    size: {
      sm: { p: '4' },
      md: { p: '6' },
      lg: { p: '8' },
    },
    hover: {
      true: { _hover: { shadow: 'lg', transform: 'translateY(-4px)' } },
      false: {},
    },
    category: {
      core: { borderLeftWidth: '4px', borderLeftColor: 'danger.500' },
      store: { borderLeftWidth: '4px', borderLeftColor: 'success.600' },
      pipeline: { borderLeftWidth: '4px', borderLeftColor: 'orange.500' },
      react: { borderLeftWidth: '4px', borderLeftColor: 'purple.600' },
      logger: { borderLeftWidth: '4px', borderLeftColor: 'warning.600' },
      actionguard: { borderLeftWidth: '4px', borderLeftColor: 'pink.600' },
      conditional: { borderLeftWidth: '4px', borderLeftColor: 'cyan.600' },
      examples: { borderLeftWidth: '4px', borderLeftColor: 'orange.600' },
      refs: { borderLeftWidth: '4px', borderLeftColor: 'blue.600' },
      demos: { borderLeftWidth: '4px', borderLeftColor: 'emerald.600' },
      utilities: { borderLeftWidth: '4px', borderLeftColor: 'teal.600' },
      debug: { borderLeftWidth: '4px', borderLeftColor: 'indigo.600' },
      default: {},
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    hover: false,
    category: 'default',
  },
});

// Button Recipe
export const buttonRecipe = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'lg',
    borderWidth: '1px',
    fontWeight: 'medium',
    transition: 'all 0.2s',
    cursor: 'pointer',
    _focus: {
      outline: 'none',
      ring: '2',
      ringOffset: '2',
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  variants: {
    variant: {
      primary: {
        bg: 'primary.600',
        color: 'white',
        borderColor: 'primary.600',
        _hover: { bg: 'primary.700' },
        _focus: { ringColor: 'primary.500' },
      },
      secondary: {
        bg: 'gray.600',
        color: 'white',
        borderColor: 'gray.600',
        _hover: { bg: 'gray.700' },
        _focus: { ringColor: 'gray.500' },
      },
      success: {
        bg: 'success.600',
        color: 'white',
        borderColor: 'success.600',
        _hover: { bg: 'success.700' },
        _focus: { ringColor: 'success.500' },
      },
      warning: {
        bg: 'warning.600',
        color: 'white',
        borderColor: 'warning.600',
        _hover: { bg: 'warning.700' },
        _focus: { ringColor: 'warning.600' },
      },
      danger: {
        bg: 'danger.600',
        color: 'white',
        borderColor: 'danger.600',
        _hover: { bg: 'danger.700' },
        _focus: { ringColor: 'danger.500' },
      },
      info: {
        bg: 'blue.600',
        color: 'white',
        borderColor: 'blue.600',
        _hover: { bg: 'blue.700' },
        _focus: { ringColor: 'blue.500' },
      },
      outline: {
        bg: 'transparent',
        color: 'gray.700',
        borderColor: 'gray.300',
        _hover: { bg: 'gray.50' },
        _focus: { ringColor: 'primary.500' },
      },
      ghost: {
        bg: 'transparent',
        color: 'gray.700',
        borderColor: 'transparent',
        _hover: { bg: 'gray.100' },
        _focus: { ringColor: 'primary.500' },
      },
    },
    size: {
      xs: { px: '2.5', py: '1.5', fontSize: 'xs' },
      sm: { px: '3', py: '2', fontSize: 'sm' },
      md: { px: '4', py: '2.5', fontSize: 'sm' },
      lg: { px: '6', py: '3', fontSize: 'base' },
      xl: { px: '8', py: '4', fontSize: 'lg' },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

// Badge Recipe
export const badgeRecipe = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    rounded: 'full',
    px: '2.5',
    py: '0.5',
    fontSize: 'xs',
    fontWeight: 'medium',
  },
  variants: {
    variant: {
      default: { bg: 'gray.100', color: 'gray.800' },
      primary: { bg: 'primary.100', color: 'primary.800' },
      success: { bg: 'success.100', color: 'success.800' },
      warning: { bg: 'warning.100', color: 'warning.800' },
      danger: { bg: 'danger.100', color: 'danger.800' },
      outline: { borderWidth: '1px', borderColor: 'gray.300', color: 'gray.800' },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

// Input Recipe
export const inputRecipe = cva({
  base: {
    display: 'block',
    w: 'full',
    rounded: 'lg',
    borderWidth: '1px',
    transition: 'colors 0.2s',
    _focus: {
      outline: 'none',
      ring: '2',
      ringOffset: '2',
    },
  },
  variants: {
    variant: {
      default: {
        borderColor: 'gray.300',
        _focus: { borderColor: 'primary.500', ringColor: 'primary.500' },
      },
      error: {
        borderColor: 'danger.300',
        _focus: { borderColor: 'danger.500', ringColor: 'danger.500' },
      },
      success: {
        borderColor: 'success.300',
        _focus: { borderColor: 'success.500', ringColor: 'success.500' },
      },
    },
    size: {
      sm: { px: '3', py: '2', fontSize: 'sm' },
      md: { px: '4', py: '2.5', fontSize: 'sm' },
      lg: { px: '4', py: '3', fontSize: 'base' },
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

// Status Recipe
export const statusRecipe = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    rounded: 'lg',
    px: '3',
    py: '2',
    fontSize: 'sm',
    fontWeight: 'medium',
  },
  variants: {
    status: {
      safe: { bg: 'success.50', color: 'success.700', borderWidth: '1px', borderColor: 'success.200' },
      warning: { bg: 'warning.50', color: 'warning.700', borderWidth: '1px', borderColor: 'warning.200' },
      danger: { bg: 'danger.50', color: 'danger.700', borderWidth: '1px', borderColor: 'danger.200' },
      info: { bg: 'primary.50', color: 'primary.700', borderWidth: '1px', borderColor: 'primary.200' },
      neutral: { bg: 'gray.50', color: 'gray.700', borderWidth: '1px', borderColor: 'gray.200' },
    },
  },
  defaultVariants: {
    status: 'neutral',
  },
});

// Grid Recipe
export const gridRecipe = cva({
  base: {
    display: 'grid',
    gap: '6',
  },
  variants: {
    cols: {
      1: { gridTemplateColumns: '1' },
      2: { gridTemplateColumns: { base: '1', md: '2' } },
      3: { gridTemplateColumns: { base: '1', md: '2', lg: '3' } },
      4: { gridTemplateColumns: { base: '1', md: '2', lg: '4' } },
      auto: { gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' },
    },
    gap: {
      sm: { gap: '4' },
      md: { gap: '6' },
      lg: { gap: '8' },
    },
  },
  defaultVariants: {
    cols: 'auto',
    gap: 'md',
  },
});

// Layout Recipe
export const layoutRecipe = cva({
  base: {
    display: 'flex',
    minH: 'screen',
    bg: 'gray.50',
    w: 'full',
    maxW: 'full',
    overflow: 'hidden',
  },
  variants: {
    variant: {
      default: {},
      fullscreen: { h: 'screen', overflow: 'hidden' },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

// Sidebar Recipe
export const sidebarRecipe = cva({
  base: {
    position: 'fixed',
    h: 'full',
    overflowY: 'auto',
    bg: 'white',
    borderRightWidth: '1px',
    borderColor: 'gray.200',
    transition: 'all 0.2s',
    left: '0',
    top: '0',
    zIndex: 40,
    display: { base: 'none', md: 'block' }, // Hide on mobile, show on md+
  },
  variants: {
    width: {
      sm: { w: { base: '56', md: '64' } },
      md: { w: { base: '64', md: '72' } },
      lg: { w: { base: '72', md: '80' } },
    },
    collapsed: {
      true: { w: '16' },
      false: {},
    },
  },
  defaultVariants: {
    width: 'md',
    collapsed: false,
  },
});

// Main Content Recipe
export const mainContentRecipe = cva({
  base: {
    flex: '1',
    p: { base: '4', md: '8' },
    transition: 'all 0.2s',
    w: 'full',
    minW: '0',
    overflowX: 'hidden',
    ml: '0', // No margin on mobile
  },
  variants: {
    sidebarWidth: {
      sm: { ml: { base: '0', md: '64' } },
      md: { ml: { base: '0', md: '72' } },
      lg: { ml: { base: '0', md: '80' } },
    },
    sidebarCollapsed: {
      true: { ml: { base: '0', md: '16' } },
      false: {},
    },
    maxWidth: {
      none: { maxW: 'none' },
      sm: { maxW: '2xl' },
      md: { maxW: '4xl' },
      lg: { maxW: '6xl' },
      xl: { maxW: '7xl' },
    },
  },
  defaultVariants: {
    sidebarWidth: 'md',
    sidebarCollapsed: false,
    maxWidth: 'none',
  },
});

// Nav Item Recipe
export const navItemRecipe = cva({
  base: {
    display: 'block',
    w: 'full',
    px: '3',
    py: '2',
    rounded: 'lg',
    fontSize: 'sm',
    fontWeight: 'medium',
    transition: 'all 0.2s',
  },
  variants: {
    variant: {
      default: { color: 'gray.700', _hover: { bg: 'gray.100', color: 'gray.900' } },
      active: { bg: 'primary.100', color: 'primary.900', borderLeftWidth: '4px', borderLeftColor: 'primary.600' },
      disabled: { color: 'gray.400', cursor: 'not-allowed', opacity: 0.6 },
    },
    category: {
      main: {},
      core: { _hover: { bg: 'red.50', color: 'red.900' } },
      store: { _hover: { bg: 'green.50', color: 'green.900' } },
      action: { _hover: { bg: 'blue.50', color: 'blue.900' } },
      async: { _hover: { bg: 'purple.50', color: 'purple.900' } },
      architecture: { _hover: { bg: 'gray.50', color: 'gray.900' } },
      interaction: { _hover: { bg: 'indigo.50', color: 'indigo.900' } },
      pipeline: { _hover: { bg: 'orange.50', color: 'orange.900' } },
      react: { _hover: { bg: 'purple.50', color: 'purple.900' } },
      logger: { _hover: { bg: 'yellow.50', color: 'yellow.900' } },
      actionguard: { _hover: { bg: 'pink.50', color: 'pink.900' } },
      conditional: { _hover: { bg: 'cyan.50', color: 'cyan.900' } },
      examples: { _hover: { bg: 'orange.50', color: 'orange.900' } },
      refs: { _hover: { bg: 'blue.50', color: 'blue.900' } },
      demos: { _hover: { bg: 'emerald.50', color: 'emerald.900' } },
      performance: { _hover: { bg: 'red.50', color: 'red.900' } },
      utilities: { _hover: { bg: 'teal.50', color: 'teal.900' } },
      debug: { _hover: { bg: 'indigo.50', color: 'indigo.900' } },
      dev: { _hover: { bg: 'red.50', color: 'red.900' } },
      'coming-soon': { bg: 'gray.50', color: 'gray.500' },
    },
  },
  defaultVariants: {
    variant: 'default',
    category: 'main',
  },
});

// Toast Recipe
export const toastRecipe = cva({
  base: {
    position: 'relative',
    bg: 'white',
    rounded: 'lg',
    shadow: 'lg',
    borderWidth: '1px',
    transition: 'all 0.3s ease-out',
  },
  variants: {
    type: {
      action: { borderLeftWidth: '4px', borderLeftColor: 'blue.500' },
      system: { borderLeftWidth: '4px', borderLeftColor: 'gray.500' },
      error: { borderLeftWidth: '4px', borderLeftColor: 'red.500' },
      success: { borderLeftWidth: '4px', borderLeftColor: 'green.500' },
      info: { borderLeftWidth: '4px', borderLeftColor: 'sky.500' },
      default: { borderLeftWidth: '4px', borderLeftColor: 'gray.400' },
    },
    phase: {
      entering: { opacity: 0, transform: 'translateY(8px) scale(0.95)' },
      visible: { opacity: 1, transform: 'translateY(0) scale(1)' },
      exiting: { opacity: 0, transform: 'translateX(100%) scale(0.95)' },
    },
    executionStep: {
      start: { borderLeftColor: 'blue.500' },
      processing: { borderLeftColor: 'amber.500' },
      success: { borderLeftColor: 'green.500' },
      error: { borderLeftColor: 'red.500' },
    },
  },
  defaultVariants: {
    type: 'default',
    phase: 'visible',
  },
});

// Toast Container Recipe
export const toastContainerRecipe = cva({
  base: {
    position: 'fixed',
    zIndex: 50,
    p: '4',
    spaceY: '2',
    pointerEvents: 'none',
  },
  variants: {
    position: {
      'top-right': { top: '2', right: '2' },
      'top-left': { top: '2', left: '2' },
      'top-center': { top: '2', left: '50%', transform: 'translateX(-50%)' },
      'bottom-right': { bottom: '2', right: '2' },
      'bottom-left': { bottom: '2', left: '2' },
      'bottom-center': { bottom: '2', left: '50%', transform: 'translateX(-50%)' },
    },
    width: {
      sm: { w: '56' },
      md: { w: '64' },
      lg: { w: '80' },
    },
  },
  defaultVariants: {
    position: 'top-right',
    width: 'sm',
  },
});

// Toast Step Badge Recipe
export const toastStepBadgeRecipe = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    px: '2',
    py: '1',
    rounded: 'full',
    fontSize: 'xs',
    fontWeight: 'medium',
  },
  variants: {
    step: {
      start: { bg: 'blue.100', color: 'blue.800' },
      processing: { bg: 'amber.100', color: 'amber.800' },
      success: { bg: 'green.100', color: 'green.800' },
      error: { bg: 'red.100', color: 'red.800' },
    },
  },
  defaultVariants: {
    step: 'start',
  },
});

// Log Monitor Recipe
export const logMonitorRecipe = cva({
  base: {
    bg: 'white',
    rounded: 'lg',
    borderWidth: '1px',
    shadow: 'sm',
  },
  variants: {
    size: {
      sm: { fontSize: 'xs' },
      md: { fontSize: 'sm' },
      lg: { fontSize: 'base' },
    },
    variant: {
      default: { borderColor: 'gray.200' },
      compact: { borderColor: 'gray.200', p: '3' },
      expanded: { borderColor: 'gray.200', p: '6' },
    },
  },
  defaultVariants: {
    size: 'sm',
    variant: 'default',
  },
});

// Log Entry Recipe
export const logEntryRecipe = cva({
  base: {
    display: 'grid',
    gap: '2',
    p: '2',
    borderBottomWidth: '1px',
    borderColor: 'gray.100',
    fontSize: 'xs',
    fontFamily: 'mono',
  },
  variants: {
    type: {
      action: {},
      system: { bg: 'gray.50' },
      performance: { bg: 'blue.50' },
      error: { bg: 'red.50' },
    },
    level: {
      trace: { color: 'gray.500' },
      debug: { color: 'blue.600' },
      info: { color: 'green.600' },
      warn: { color: 'yellow.600' },
      error: { color: 'red.600' },
    },
  },
  defaultVariants: {
    type: 'action',
    level: 'info',
  },
});

// Log Level Badge Recipe
export const logLevelBadgeRecipe = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    px: '2',
    py: '1',
    rounded: 'md',
    fontSize: 'xs',
    fontWeight: 'medium',
  },
  variants: {
    level: {
      trace: { bg: 'gray.100', color: 'gray.700' },
      debug: { bg: 'blue.100', color: 'blue.700' },
      info: { bg: 'green.100', color: 'green.700' },
      warn: { bg: 'yellow.100', color: 'yellow.700' },
      error: { bg: 'red.100', color: 'red.700' },
    },
  },
  defaultVariants: {
    level: 'info',
  },
});

// Demo Card Recipe
export const demoCardRecipe = cva({
  base: {
    bg: 'white',
    rounded: 'lg',
    borderWidth: '1px',
    shadow: 'sm',
    transition: 'all 0.2s',
  },
  variants: {
    variant: {
      default: { borderColor: 'gray.200', p: '6' },
      info: { bg: 'blue.50', borderColor: 'blue.200', p: '6' },
      logger: { borderColor: 'gray.200', p: '6', position: 'relative' },
      monitor: { bg: 'gray.50', borderColor: 'gray.300', p: '6' },
      compact: { borderColor: 'gray.200', p: '4' },
    },
    spacing: {
      none: { p: '0' },
      sm: { p: '4' },
      md: { p: '6' },
      lg: { p: '8' },
    },
  },
  defaultVariants: {
    variant: 'default',
    spacing: 'md',
  },
});

// Code Example Recipe
export const codeExampleRecipe = cva({
  base: {
    mt: '8',
    bg: 'white',
    rounded: 'lg',
    borderWidth: '1px',
    borderColor: 'gray.200',
    shadow: 'sm',
  },
  variants: {
    size: {
      sm: { p: '4' },
      md: { p: '6' },
      lg: { p: '8' },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Code Block Recipe
export const codeBlockRecipe = cva({
  base: {
    bg: 'gray.900',
    color: 'gray.100',
    rounded: 'lg',
    overflowX: 'auto',
    fontFamily: 'mono',
    lineHeight: 'relaxed',
    maxW: 'full',
    w: 'full',
  },
  variants: {
    size: {
      xs: { p: '2', fontSize: 'xs' },
      sm: { p: '3', fontSize: 'sm' },
      md: { p: '4', fontSize: 'sm' },
      lg: { p: '6', fontSize: 'base' },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Export variant props types
export type ContainerRecipeProps = RecipeVariantProps<typeof containerRecipe>;
export type CardRecipeProps = RecipeVariantProps<typeof cardRecipe>;
export type ButtonRecipeProps = RecipeVariantProps<typeof buttonRecipe>;
export type BadgeRecipeProps = RecipeVariantProps<typeof badgeRecipe>;
export type InputRecipeProps = RecipeVariantProps<typeof inputRecipe>;
export type StatusRecipeProps = RecipeVariantProps<typeof statusRecipe>;
export type GridRecipeProps = RecipeVariantProps<typeof gridRecipe>;
export type LayoutRecipeProps = RecipeVariantProps<typeof layoutRecipe>;
export type SidebarRecipeProps = RecipeVariantProps<typeof sidebarRecipe>;
export type MainContentRecipeProps = RecipeVariantProps<typeof mainContentRecipe>;
export type NavItemRecipeProps = RecipeVariantProps<typeof navItemRecipe>;
export type ToastRecipeProps = RecipeVariantProps<typeof toastRecipe>;
export type ToastContainerRecipeProps = RecipeVariantProps<typeof toastContainerRecipe>;
export type ToastStepBadgeRecipeProps = RecipeVariantProps<typeof toastStepBadgeRecipe>;
export type LogMonitorRecipeProps = RecipeVariantProps<typeof logMonitorRecipe>;
export type LogEntryRecipeProps = RecipeVariantProps<typeof logEntryRecipe>;
export type LogLevelBadgeRecipeProps = RecipeVariantProps<typeof logLevelBadgeRecipe>;
export type DemoCardRecipeProps = RecipeVariantProps<typeof demoCardRecipe>;
export type CodeExampleRecipeProps = RecipeVariantProps<typeof codeExampleRecipe>;
export type CodeBlockRecipeProps = RecipeVariantProps<typeof codeBlockRecipe>;
