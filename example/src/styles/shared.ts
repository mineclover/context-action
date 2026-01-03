/**
 * @fileoverview Shared Design System Styles
 * 페이지 간 공유되는 공통 스타일 정의
 */

import { css } from '../../styled-system/css';

// ================================
// Layout Styles
// ================================

export const layoutStyles = {
  container: css({ spaceY: '6' }),
  containerLarge: css({ maxW: '7xl', mx: 'auto', spaceY: '6' }),
  page: css({ minH: 'screen', bg: 'gray.50', p: '6' }),
  cardPadding: css({ p: '6' }),
  cardPaddingSm: css({ p: '4' }),
};

// ================================
// Grid Layouts
// ================================

export const gridStyles = {
  cols2: css({ display: 'grid', gridTemplateColumns: '1', gap: '4', md: { gridTemplateColumns: 'repeat(2, 1fr)' } }),
  cols3: css({ display: 'grid', gridTemplateColumns: '1', gap: '4', md: { gridTemplateColumns: 'repeat(3, 1fr)' } }),
  cols4: css({ display: 'grid', gridTemplateColumns: '1', gap: '4', md: { gridTemplateColumns: 'repeat(4, 1fr)' } }),
  cols5: css({ display: 'grid', gridTemplateColumns: '1', gap: '4', md: { gridTemplateColumns: 'repeat(2, 1fr)' }, lg: { gridTemplateColumns: 'repeat(5, 1fr)' } }),
  mainWithSidebar: css({ display: 'grid', gridTemplateColumns: '1', gap: '6', lg: { gridTemplateColumns: 'repeat(4, 1fr)' } }),
  mainColumn: css({ lg: { gridColumn: 'span 3' } }),
};

// ================================
// Typography Styles
// ================================

export const textStyles = {
  sectionTitle: css({ fontSize: 'lg', fontWeight: 'semibold', color: 'gray.900', mb: '4' }),
  cardTitle: css({ fontSize: 'xl', fontWeight: 'semibold', mb: '4' }),
  subsectionTitle: css({ fontWeight: 'semibold', color: 'gray.700', mb: '3' }),
  hint: css({ fontSize: 'sm', color: 'gray.600' }),
  hintXs: css({ fontSize: 'xs', color: 'gray.500' }),
  mono: css({ fontFamily: 'mono' }),
};

// ================================
// Stat Card Styles
// ================================

export const statStyles = {
  statTitle: css({ fontWeight: 'semibold', fontSize: 'sm', color: 'gray.600', mb: '2' }),
  statValue: (color: string) => css({ fontSize: '2xl', fontWeight: 'bold', color: `${color}.600` }),
  statValueLg: (color: string) => css({ fontSize: '3xl', fontWeight: 'bold', color: `${color}.600` }),
  statValueMono: (color: string) => css({ fontSize: '2xl', fontWeight: 'bold', color: `${color}.600`, fontFamily: 'mono' }),
  statHint: css({ fontSize: 'xs', color: 'gray.500', mt: '1' }),
};

// ================================
// Button Styles
// ================================

export const buttonStyles = {
  primary: css({ w: 'full', px: '4', py: '2', bg: 'blue.500', color: 'white', rounded: 'md', _hover: { bg: 'blue.600' }, transition: 'colors' }),
  success: css({ w: 'full', px: '4', py: '2', bg: 'green.500', color: 'white', rounded: 'md', _hover: { bg: 'green.600' }, transition: 'colors' }),
  danger: css({ w: 'full', px: '4', py: '2', bg: 'red.500', color: 'white', rounded: 'md', _hover: { bg: 'red.600' }, transition: 'colors' }),
  warning: css({ w: 'full', px: '4', py: '2', bg: 'orange.500', color: 'white', rounded: 'md', _hover: { bg: 'orange.600' }, transition: 'colors' }),
  purple: css({ w: 'full', px: '4', py: '2', bg: 'purple.500', color: 'white', rounded: 'md', _hover: { bg: 'purple.600' }, transition: 'colors' }),
  btnSm: css({ px: '3', py: '2', fontSize: 'sm' }),
  btnContainer: css({ spaceY: '2' }),
};

// ================================
// Form Input Styles
// ================================

export const inputStyles = {
  textInput: css({ w: 'full', px: '4', py: '3', border: '1px solid token(colors.gray.300)', rounded: 'lg', fontSize: 'lg', _focus: { outline: 'none', ring: '2px', ringColor: 'blue.500', borderColor: 'transparent' } }),
  rangeLabel: css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'gray.600', mb: '1' }),
  rangeInput: css({ w: 'full', h: '2', bg: 'gray.200', rounded: 'lg', appearance: 'none', cursor: 'pointer' }),
  settingsRow: css({ display: 'flex', alignItems: 'center', gap: '4', p: '3', bg: 'gray.50', rounded: 'lg' }),
  settingsLabel: css({ fontSize: 'sm', fontWeight: 'medium', color: 'gray.700' }),
};

// ================================
// Info Box Styles (colored boxes)
// ================================

export const infoBoxStyles = {
  box: (color: string) => css({ p: '3', rounded: 'lg', border: '1px solid', bg: `${color}.50`, borderColor: `${color}.200` }),
  title: (color: string) => css({ fontWeight: 'medium', color: `${color}.800` }),
  text: (color: string) => css({ color: `${color}.700`, mt: '1' }),

  // Pre-defined variants
  info: css({ p: '4', bg: 'blue.50', border: '1px solid token(colors.blue.200)', rounded: 'lg', color: 'blue.800', fontSize: 'sm' }),
  success: css({ p: '4', bg: 'green.50', border: '1px solid token(colors.green.200)', rounded: 'lg', color: 'green.800', fontSize: 'sm' }),
  warning: css({ p: '4', bg: 'yellow.50', border: '1px solid token(colors.yellow.200)', rounded: 'lg', color: 'yellow.800', fontSize: 'sm' }),
  error: css({ p: '4', bg: 'red.50', border: '1px solid token(colors.red.200)', rounded: 'lg', color: 'red.800', fontSize: 'sm' }),
};

// ================================
// Badge Styles
// ================================

export const badgeStyles = {
  container: css({ display: 'flex', flexWrap: 'wrap', gap: '2', mt: '4' }),
  badge: (color: string) => css({ bg: `${color}.50`, color: `${color}.800` }),
};

// ================================
// List Styles
// ================================

export const listStyles = {
  spaced: css({ spaceY: '2', fontSize: 'sm', color: 'gray.700' }),
  spacedSm: css({ spaceY: '1', fontSize: 'sm' }),
  disc: css({ listStyleType: 'disc', listStylePosition: 'inside', spaceY: '1', ml: '2' }),
};

// ================================
// Empty State Styles
// ================================

export const emptyStyles = {
  container: css({ textAlign: 'center', color: 'gray.400', py: '8' }),
  icon: css({ mb: '2', fontSize: '4xl' }),
  text: css({ fontSize: 'lg', mb: '2' }),
  hint: css({ fontSize: 'sm', color: 'gray.500' }),
};

// ================================
// Progress Bar Styles
// ================================

export const progressStyles = {
  container: css({ mb: '4' }),
  track: css({ w: 'full', bg: 'gray.200', rounded: 'full', h: '2' }),
  fill: (color: string = 'blue') => css({ bg: `${color}.500`, h: '2', rounded: 'full', transition: 'all 300ms ease-out' }),
};

// ================================
// Code Block Styles
// ================================

export const codeStyles = {
  block: css({ bg: 'gray.900', color: 'gray.100', p: '4', rounded: 'lg', overflowX: 'auto' }),
  pre: css({ fontSize: 'sm' }),
  inline: css({ px: '2', py: '1', bg: 'gray.100', rounded: 'md', fontFamily: 'mono', fontSize: 'sm' }),
};

// ================================
// Loading Styles
// ================================

export const loadingStyles = {
  container: css({ display: 'flex', justifyContent: 'center', alignItems: 'center', py: '8' }),
  content: css({ display: 'flex', alignItems: 'center', gap: '3' }),
  spinner: css({ animation: 'spin 1s linear infinite', rounded: 'full', h: '6', w: '6', borderBottom: '2px solid token(colors.blue.500)' }),
  text: css({ color: 'gray.600' }),
};

// ================================
// Tech/Analysis Section Styles
// ================================

export const techStyles = {
  grid: css({ display: 'grid', gridTemplateColumns: '1', gap: '6', lg: { gridTemplateColumns: 'repeat(2, 1fr)' } }),
  titleBlue: css({ fontWeight: 'semibold', color: 'blue.600', mb: '3' }),
  titleGreen: css({ fontWeight: 'semibold', color: 'green.600', mb: '3' }),
  list: css({ spaceY: '2', fontSize: 'sm', color: 'gray.700' }),
};

// ================================
// Export all styles as single object
// ================================

export const sharedStyles = {
  layout: layoutStyles,
  grid: gridStyles,
  text: textStyles,
  stat: statStyles,
  button: buttonStyles,
  input: inputStyles,
  infoBox: infoBoxStyles,
  badge: badgeStyles,
  list: listStyles,
  empty: emptyStyles,
  progress: progressStyles,
  code: codeStyles,
  loading: loadingStyles,
  tech: techStyles,
};

export default sharedStyles;
