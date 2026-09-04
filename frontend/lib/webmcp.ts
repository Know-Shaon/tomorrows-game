import { useEffect } from 'react';

interface WebMcpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute(input: unknown): unknown;
}

interface ModelContext {
  registerTool(tool: WebMcpTool, options: { signal: AbortSignal }): void | Promise<void>;
}

declare global {
  interface Document {
    readonly modelContext?: ModelContext;
  }
}

export function useStartGameTool(startGame: () => void, title: string): void {
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) {
      return undefined;
    }
    const lifecycle = new AbortController();
    const registration = context.registerTool(
      {
        name: 'start_daily_game',
        title: "Start today's game",
        description: "Open today's challenge instructions so the player can begin the daily game.",
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (
            typeof input !== 'object' ||
            input === null ||
            Array.isArray(input) ||
            Object.keys(input).length !== 0
          ) {
            throw new Error('start_daily_game accepts an empty object.');
          }
          startGame();
          return { status: 'ready', challenge: title };
        },
      },
      { signal: lifecycle.signal },
    );
    void Promise.resolve(registration).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.warn('Could not register the browser game tool.', error);
    });
    return () => lifecycle.abort();
  }, [startGame, title]);
}
