import pandacss from '@pandacss/dev/postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    pandacss(),
    tailwindcss,
    autoprefixer,
  ],
}