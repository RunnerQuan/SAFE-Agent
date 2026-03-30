# Example Skill

Demonstrates skill structure and best practices for Claude Code plugin development.

## When This Skill Activates

Claude automatically invokes this skill when you:
- Ask about "skill examples" or "skill templates"
- Mention "how to create skills" or "skill structure"
- Want to learn about Claude Code skill development
- Say "show me skill structure" or "skill format"
- Ask questions like "What's the difference between skills and commands?"

## Features

- **Comprehensive Structure Demonstration**: Shows complete SKILL.md format with proper frontmatter
- **Component Differentiation**: Explains differences between skills, commands, and agents
- **Tool Restriction Patterns**: Demonstrates allowed-tools configuration for security
- **Supporting File Organization**: Shows how skills can include additional files
- **Educational Content**: Provides learning material for skill developers

## Usage Examples

### Example 1: Learning About Skills

```
You: "How do I create a skill for Claude Code?"

Claude: I'll explain the skill structure using the example-skill as reference.
[Provides detailed explanation with code examples from this skill]
```

**Result**: User understands SKILL.md structure, frontmatter requirements, and when to use skills vs other component types.

### Example 2: Understanding Component Types

```
You: "What's the difference between skills and commands?"

Claude: Let me explain using concrete examples from the starter plugin.
[Uses this skill to show autonomous vs explicit invocation patterns]
```

**Result**: User learns that skills are autonomous (Claude decides) while commands are explicit (user types `/command`).

### Example 3: Getting Template Code

```
You: "Show me a skill template I can copy"

Claude: Here's a template based on the example-skill structure...
[Provides copyable template from this skill's content]
```

**Result**: User has working template to create their own skill.

## How It Works

When activated, this skill:

1. **Explains Skill Architecture**: Shows YAML frontmatter structure and required fields
2. **Demonstrates Best Practices**: Illustrates clear descriptions with trigger conditions
3. **Provides Templates**: Offers copyable examples developers can adapt
4. **Differentiates Components**: Clarifies when to use skills vs commands vs agents
5. **Documents Patterns**: Shows tool restrictions, directory structure, and naming conventions

## Allowed Tools

This skill uses read-only tools for safe exploration:

- **Read**: Read example files and reference implementations
- **Grep**: Search for patterns in the codebase
- **Glob**: Find files matching specific patterns

### Tool Restrictions

For security and focus, this skill is restricted to:
- Read-only operations (Read, Grep, Glob)
- No file modifications to prevent unintended changes
- No command execution for safety

## Structure

The skill directory contains:

```
skills/example-skill/
├── SKILL.md     # Required skill definition with system prompt
└── README.md    # This file, providing user-facing documentation
```

Skills can include additional supporting files in their directory as needed:
- Configuration files (config.json)
- Templates (templates/*.md)
- Reference documentation
- Helper scripts (scripts/*.sh)

## Key Concepts

### Skill vs Command vs Agent

**Skills** (This Component Type):
- **Invocation**: Autonomous - Claude decides based on context
- **User Interaction**: Transparent - user may not know skill was used
- **Purpose**: Enhance Claude's capabilities automatically
- **Trigger**: Description must clearly state "when to use"

**Commands**:
- **Invocation**: Explicit - user types `/command-name`
- **User Interaction**: Direct - user knows they're running a command
- **Purpose**: User-triggered workflows and actions
- **Trigger**: User explicitly calls the command

**Agents**:
- **Invocation**: Via Task tool - Claude launches specialized subagents
- **User Interaction**: Explicit subagent execution
- **Purpose**: Complex, isolated multi-step tasks
- **Trigger**: Task tool with subagent_type parameter

### Effective Skill Descriptions

The description field in SKILL.md frontmatter MUST include:

1. **What it does**: "Example skill demonstrating skill structure"
2. **When to use**: "Use when user asks about 'skill examples', 'skill templates'"
3. **Trigger keywords**: Specific phrases users might say

**Good Example**:
```yaml
description: Analyzes code quality and suggests improvements. Use when user asks to "review code", "check quality", or mentions "code analysis".
```

**Bad Example** (missing triggers):
```yaml
description: Analyzes code quality.
```

## Best Practices

To get the most out of this skill:

- **Reference Real Examples**: Look at SKILL.md in this directory for working code
- **Understand Triggers**: Note how the description includes specific user phrases
- **Study Tool Restrictions**: See how allowed-tools limits capabilities
- **Explore Directory Structure**: Note skills live in `skills/skill-name/` directories
- **Check Frontmatter**: All required fields must be present and valid YAML

## Troubleshooting

### Issue: Skill Not Being Referenced

**Problem**: Claude doesn't mention this skill when explaining skill development

**Solutions**:
- Ensure plugin is installed: `/plugin list`
- Check YAML frontmatter is valid in SKILL.md
- Try explicit phrases: "Show me the example skill"
- Verify description includes trigger keywords

### Issue: Don't Understand When Skills Activate

**Problem**: Unclear when Claude uses skills vs when user must invoke commands

**Solutions**:
- Skills activate automatically based on description matching
- Commands require user to type `/command-name`
- Ask: "What's the difference between skills and commands?"
- Review this README's "Key Concepts" section

## Related Documentation

- [Official Plugin Reference](https://code.claude.com/docs/en/plugins-reference)
- [Skill Template](../../../templates/skill-readme-template.md)
- [Project CLAUDE.md](../../../CLAUDE.md)
- [Contributing Guide](../../../CONTRIBUTING.md)
- [plugin-setup Skill](../../plugin-dev/skills/plugin-setup/) - For creating new skills

## Contributing

To improve this skill:
1. Ensure examples remain current with latest Claude Code features
2. Add clarifying content for common confusion points
3. Test that trigger keywords accurately capture user intent
4. Keep template examples simple and copyable

## Version History

### v1.0.0 (Initial Release)
- Complete skill structure example
- Comprehensive SKILL.md with all fields
- Documentation of component differences
- Tool restriction demonstration
- Template for developers

### v1.1.0 (2025-12-18)
- Added comprehensive README documentation
- Included usage examples and scenarios
- Documented key concepts and differentiation
- Added troubleshooting guidance
- Referenced related skills and templates

## License

MIT License - Inherits from project license

---

**Tip**: This skill serves as both a working example and educational resource. When creating your own skills, use this as a reference for structure, but customize the content to match your skill's specific purpose and capabilities.
