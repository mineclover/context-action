/**
 * Help Display - Manages help text display
 */

export class HelpDisplay {
  show(): void {
    console.log('');
    console.log('🚀 LLMS Generator - Core Commands (Optimized)');
    console.log('');
    console.log('WORKFLOW MANAGEMENT:');
    console.log('  work-next [options]              Find next document to work on');
    console.log('                                   [-l, --language <lang>] [--show-completed] [-v, --verbose]');
    console.log('');
    console.log('LLMS GENERATION:');
    console.log('  clean-llms-generate [char-limit] [options]');
    console.log('                                   Generate clean LLMS files for LLM training (no metadata)');
    console.log('                                   [-l, --language <lang>] [-c, --category <cat>]');
    console.log('                                   [-p, --pattern clean|minimal|raw] [--dry-run] [-v, --verbose]');
    console.log('');
    console.log('  llms-generate [options]          Generate standard LLMS files with metadata');
    console.log('                                   [-c, --character-limit <num>] [--category <cat>]');
    console.log('                                   [-l, --language <lang>] [-p, --pattern standard|minimum|origin]');
    console.log('                                   [--dry-run] [-v, --verbose]');
    console.log('');
    console.log('EXAMPLES:');
    console.log('  # Find next document to work on');
    console.log('  npx @context-action/llms-generator work-next --language ko');
    console.log('');
    console.log('  # Generate clean LLMS for LLM training (recommended)');
    console.log('  npx @context-action/llms-generator clean-llms-generate 300 --language ko --pattern clean');
    console.log('  npx @context-action/llms-generator clean-llms-generate --category guide --pattern minimal');
    console.log('  npx @context-action/llms-generator clean-llms-generate 100 --pattern raw --dry-run');
    console.log('');
    console.log('  # Generate standard LLMS with metadata');
    console.log('  npx @context-action/llms-generator llms-generate --character-limit 300 --language ko');
    console.log('  npx @context-action/llms-generator llms-generate --category guide --pattern minimum');
    console.log('');
    console.log('For more detailed options, use --help with specific commands:');
    console.log('  npx @context-action/llms-generator clean-llms-generate --help');
    console.log('');
    console.log('💡 Note: This is the optimized CLI with only core, tested functionality');
    console.log('   Reduced from ~2000 lines to ~200 lines for better maintainability');
    console.log('');
  }
}