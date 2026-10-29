/** Context-Action IDs are retained-entry identities, not reusable cursor positions. */
export class RetainedEntryIndex {
  private sequence = 0;
  private entries: number[];

  constructor(length: number) {
    this.entries = this.allocate(length);
  }

  private allocate(length: number): number[] {
    return Array.from({ length }, () => ++this.sequence);
  }

  commit(previousPosition: number, retainedStates: number): void {
    this.entries = [...this.entries.slice(0, previousPosition + 1), ++this.sequence]
      .slice(-retainedStates);
  }

  reset(length: number): void {
    this.entries = this.allocate(length);
  }

  get length(): number { return this.entries.length; }
  at(position: number): number { return this.entries[position]!; }
  has(id: number): boolean { return this.entries.includes(id); }
  positionOf(id: number): number {
    const position = this.entries.indexOf(id);
    if (position < 0) throw new Error(`History entry ${id} is no longer retained`);
    return position;
  }
}
