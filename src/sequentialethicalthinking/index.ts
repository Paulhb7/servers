#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  ethicalPhase: "deontological" | "consequentialist";
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean;
}

class SequentialEthicalThinkingServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};

  private validateThoughtData(input: unknown): ThoughtData {
    const data = input as Record<string, unknown>;

    if (!data.thought || typeof data.thought !== 'string') {
      throw new Error('Invalid thought: must be a string');
    }
    if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
      throw new Error('Invalid thoughtNumber: must be a number');
    }
    if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
      throw new Error('Invalid totalThoughts: must be a number');
    }
    if (typeof data.nextThoughtNeeded !== 'boolean') {
      throw new Error('Invalid nextThoughtNeeded: must be a boolean');
    }
    if (data.ethicalPhase !== 'deontological' && data.ethicalPhase !== 'consequentialist') {
      throw new Error('Invalid ethicalPhase: must be "deontological" or "consequentialist"');
    }

    return {
      thought: data.thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded,
      ethicalPhase: data.ethicalPhase as "deontological" | "consequentialist",
      isRevision: data.isRevision as boolean | undefined,
      revisesThought: data.revisesThought as number | undefined,
      branchFromThought: data.branchFromThought as number | undefined,
      branchId: data.branchId as string | undefined,
      needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
    };
  }

  private formatThought(thoughtData: ThoughtData): string {
    const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId, ethicalPhase } = thoughtData;

    let prefix = '';
    let context = '';

    if (isRevision) {
      prefix = chalk.yellow('🔄 Revision');
      context = ` (revising thought ${revisesThought})`;
    } else if (branchFromThought) {
      prefix = chalk.green('🌿 Branch');
      context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
    } else if (ethicalPhase === 'deontological') {
      prefix = chalk.magenta('⚖️ Deontological');
    } else {
      prefix = chalk.cyan('📊 Consequentialist');
    }

    const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
    const border = '─'.repeat(Math.max(header.length, thought.length) + 4);

    return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thought.padEnd(border.length - 2)} │
└${border}┘`;
  }

  private evaluateJudgment(): string | null {
    const deon = this.thoughtHistory.filter(t => t.ethicalPhase === 'deontological');
    const cons = this.thoughtHistory.filter(t => t.ethicalPhase === 'consequentialist');

    if (deon.length > 0 && cons.length > 0) {
      const lastDeon = deon[deon.length - 1].thought.toLowerCase();
      const lastCons = cons[cons.length - 1].thought.toLowerCase();

      if (lastDeon.includes("acceptable") && lastCons.includes("acceptable")) {
        return "✅ Final ethical judgment: Action is acceptable under both frameworks.";
      }
      if (lastDeon.includes("unacceptable") || lastCons.includes("unacceptable")) {
        return "❌ Final ethical judgment: Action is ethically problematic under at least one framework.";
      }
      return "⚠️ Ethical judgment: Mixed results, further clarification may be required.";
    }
    return null;
  }

  public processThought(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const validatedInput = this.validateThoughtData(input);

      if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
        validatedInput.totalThoughts = validatedInput.thoughtNumber;
      }

      this.thoughtHistory.push(validatedInput);

      if (validatedInput.branchFromThought && validatedInput.branchId) {
        if (!this.branches[validatedInput.branchId]) {
          this.branches[validatedInput.branchId] = [];
        }
        this.branches[validatedInput.branchId].push(validatedInput);
      }

      const formattedThought = this.formatThought(validatedInput);
      console.error(formattedThought);

      const judgment = this.evaluateJudgment();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              thoughtNumber: validatedInput.thoughtNumber,
              totalThoughts: validatedInput.totalThoughts,
              nextThoughtNeeded: validatedInput.nextThoughtNeeded,
              branches: Object.keys(this.branches),
              ethicalPhase: validatedInput.ethicalPhase,
              judgment,
              thoughtHistoryLength: this.thoughtHistory.length
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
              status: 'failed'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
}

const SEQUENTIAL_ETHICAL_THINKING_TOOL: Tool = {
  name: "sequentialethicalthinking",
  description: `A structured tool for ethical reasoning through sequential steps.
This tool helps analyze moral questions by examining both duties and consequences.

Phases:
1. Deontological analysis: Is the action morally right in itself?
2. Consequentialist analysis: What are the likely outcomes of the action?

Use this tool for:
- Evaluating ethical dilemmas
- Decision-making involving conflicting values
- AI alignment and value-sensitive design

Each step logs context, and a final judgment is suggested based on the reasoning.`,
  inputSchema: {
    type: "object",
    properties: {
      thought: { type: "string", description: "Ethical reasoning step" },
      nextThoughtNeeded: { type: "boolean", description: "Is further ethical analysis needed?" },
      thoughtNumber: { type: "integer", description: "Current step number", minimum: 1 },
      totalThoughts: { type: "integer", description: "Estimated total steps", minimum: 1 },
      isRevision: { type: "boolean", description: "Does this revise a previous step?" },
      revisesThought: { type: "integer", description: "Which step is revised?", minimum: 1 },
      branchFromThought: { type: "integer", description: "Branching from step", minimum: 1 },
      branchId: { type: "string", description: "Branch identifier" },
      needsMoreThoughts: { type: "boolean", description: "Do we need more thinking?" },
      ethicalPhase: {
        type: "string",
        enum: ["deontological", "consequentialist"],
        description: "Type of ethical reasoning used in this step"
      }
    },
    required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts", "ethicalPhase"]
  }
};

const server = new Server(
  {
    name: "sequential-ethical-thinking-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const ethicalThinkingServer = new SequentialEthicalThinkingServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [SEQUENTIAL_ETHICAL_THINKING_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "sequentialethicalthinking") {
    return ethicalThinkingServer.processThought(request.params.arguments);
  }

  return {
    content: [{
      type: "text",
      text: `Unknown tool: ${request.params.name}`
    }],
    isError: true
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sequential Ethical Thinking MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});