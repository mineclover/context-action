/** Selected public commands; payload-less actions take no argument. */
export type PublicActionMethods<
  Actions extends object,
  PublicKeys extends keyof Actions = keyof Actions,
  ReturnMap extends Partial<Record<PublicKeys, unknown>> = Record<never, never>,
> = {
  // biome-ignore lint/suspicious/noConfusingVoidType: action maps use void for payload-less commands.
  readonly [Key in PublicKeys]: [Actions[Key]] extends [void | undefined]
    ? () => Key extends keyof ReturnMap ? Promise<ReturnMap[Key]> : Promise<void>
    : (payload: Actions[Key]) => Key extends keyof ReturnMap ? Promise<ReturnMap[Key]> : Promise<void>;
};
