# Sequential Ethical Thinking MCP Server

An experimental MCP server that provides a tool for structured ethical reasoning using both deontological and consequentialist analysis.

Based on Anthropic's sequential thinking server, this version is extended to reason about actions from a moral perspective, step by step.

## Features

- Structure ethical reasoning in two distinct phases:
  - ⚖️ Deontological: Is the action right in itself?
  - 📈 Consequentialist: What are the likely outcomes?
- Track revisions and branches in ethical reasoning
- Suggest a final moral judgment based on combined reasoning
- Flexible and interactive analysis of ethical dilemmas

## Tool

### `sequentialethicalthinking`

Facilitates a detailed ethical reasoning process with sequential steps.

**Inputs:**

- `thought` (string): The ethical reasoning step
- `ethicalPhase` (string): `"deontological"` or `"consequentialist"`
- `nextThoughtNeeded` (boolean): Whether another reasoning step is needed
- `thoughtNumber` (integer): Current reasoning step number
- `totalThoughts` (integer): Estimated total steps needed
- `isRevision` (boolean, optional): Whether this revises a previous thought
- `revisesThought` (integer, optional): Which thought is being reconsidered
- `branchFromThought` (integer, optional): Branching point thought number
- `branchId` (string, optional): Branch identifier
- `needsMoreThoughts` (boolean, optional): Whether further analysis is needed

## Usage

This ethical reasoning tool is designed for:

- Analyzing ethical dilemmas
- Making decisions under uncertainty or conflicting values
- AI alignment and moral judgment simulation
- Exploring both duty-based and consequence-based perspectives

## Configuration

### Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

#### npx

```json
{
  "mcpServers": {
    "sequentialethicalthinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-ethical-thinking"
      ]
    }
  }
}
```

#### docker

```json
{
  "mcpServers": {
    "sequentialethicalthinking": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "mcp/sequentialethicalthinking"
      ]
    }
  }
}
```

### Usage with VS Code

You can also configure this server in VS Code.

For NPX installation:

```json
{
  "mcp": {
    "servers": {
      "sequentialethicalthinking": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-sequential-ethical-thinking"
        ]
      }
    }
  }
}
```

For Docker installation:

```json
{
  "mcp": {
    "servers": {
      "sequentialethicalthinking": {
        "command": "docker",
        "args": [
          "run",
          "--rm",
          "-i",
          "mcp/sequentialethicalthinking"
        ]
      }
    }
  }
}
```

## Building

To build the Docker image:

```bash
docker build -t mcp/sequentialethicalthinking -f src/sequentialethicalthinking/Dockerfile .
```

## License

This MCP server is licensed under the MIT License. This is an experimental implementation based on the original sequential thinking server by Anthropic.