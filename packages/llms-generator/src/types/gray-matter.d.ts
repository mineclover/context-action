declare module 'gray-matter' {
  interface GrayMatterFile<I extends string = string> {
    content: string;
    data: any;
    orig: Buffer | I;
    language: string;
    matter: string;
    stringify: (lang: string) => string;
  }

  interface GrayMatterOption<I extends string = string, O = GrayMatterFile<I>> {
    parser?: any;
    eval?: boolean;
    excerpt?: boolean | ((file: GrayMatterFile<I>, options: GrayMatterOption<I, O>) => string);
    excerpt_separator?: string;
    engines?: {
      [index: string]: ((input: string) => object) | { parse: (input: string) => object; stringify?: (obj: object) => string };
    };
    language?: string;
    delimiters?: string | [string, string];
  }

  function matter<I extends string = string, O = GrayMatterFile<I>>(
    input: I | GrayMatterFile<I>,
    options?: GrayMatterOption<I, O>
  ): GrayMatterFile<I>;

  namespace matter {
    function stringify<T = any>(str: string | GrayMatterFile, data?: T, options?: GrayMatterOption): string;
    function read<T = GrayMatterFile>(filepath: string, options?: GrayMatterOption): T;
  }

  export = matter;
}