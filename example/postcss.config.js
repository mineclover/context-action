import tailwindcss from 'tailwindcss';
import pandacss from '@pandacss/dev/postcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss,
    pandacss(),
    autoprefixer,
  ],
}