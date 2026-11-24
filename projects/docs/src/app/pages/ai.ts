import { Component } from '@angular/core';

@Component({
  template: `
    <h1>AI &amp; LLMs</h1>
    <p>Machine-readable docs so coding assistants generate correct Momentra code instead of guessing selectors, inputs and theming.</p>

    <table>
      <thead><tr><th scope="col">File</th><th scope="col">For</th><th scope="col">What it holds</th></tr></thead>
      <tbody>
        <tr><th scope="row"><a href="llms.txt"><code>/llms.txt</code></a></th><td>Any LLM, chat or agent</td><td>Short summary, key rules and links to every guide (<a href="https://llmstxt.org" rel="noopener">llmstxt.org</a> format).</td></tr>
        <tr><th scope="row"><a href="llms-full.txt"><code>/llms-full.txt</code></a></th><td>Pasting into a chat or a RAG index</td><td>The README and every guide in one plain-text file.</td></tr>
        <tr><th scope="row"><a [href]="repo + '/blob/main/AGENTS.md'" rel="noopener"><code>AGENTS.md</code></a></th><td>Codex, Copilot, Cursor, Gemini, Windsurf…</td><td>Commands, structure and rules for agents changing the library itself.</td></tr>
        <tr><th scope="row"><a [href]="repo + '/blob/main/CLAUDE.md'" rel="noopener"><code>CLAUDE.md</code></a></th><td>Claude Code</td><td>Imports <code>AGENTS.md</code>.</td></tr>
      </tbody>
    </table>

    <h2>In your own app</h2>
    <p>Give your assistant the summary as context. For example, in your app's <code>AGENTS.md</code> or <code>CLAUDE.md</code>:</p>
    <pre><code>{{ appRule }}</code></pre>
    <p>Or in a chat, paste the contents of <code>llms-full.txt</code> before your question.</p>
  `,
})
export class AiPage {
  readonly repo = 'https://github.com/oscarandrespabonestrella/momentra';
  readonly appRule = `## Date and time UI
Use momentra for every date/time field.
Docs for LLMs: <docs-site>/llms.txt (full text: <docs-site>/llms-full.txt).
- Theme with --mtr-* custom properties on :root, never .mtr-* classes or ::ng-deep.
- Always set ariaLabel on Momentra fields.`;
}
