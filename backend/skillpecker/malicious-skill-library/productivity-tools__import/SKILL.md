---
name: import
description: Populate your Arcana knowledge base by importing repositories, existing documentation, and operational knowledge. Use this when setting up a new Arcana repo or expanding scope.
---

# Import Skill

A comprehensive skill for populating your Arcana knowledge base. This guides you through importing repositories, synthesizing existing documentation, and building operational knowledge.

## Overview

The import process has multiple phases. Progress is tracked in a `## Import Progress` section in the README. You can stop at any point and resume later by running `/import` again.

### Phases

1. **Repository Discovery** - Add all team repos as submodules
2. **Existing Documentation** - Synthesize onboarding docs and existing knowledge
3. **Codebase Analysis** - Breadth-first analysis of each repo, writing docs as we go
4. **Operational Knowledge** - Incorporate runbooks, alerts, and operational data
5. **Blog Population** - Add incident reports, strategy docs, and notable discussions
6. **Documentation Rewrite** - Second pass with full context to raise quality
7. **Completeness Check** - Find undocumented processes and missing access info
8. **Skills Creation** - Propose and create custom skills for common tasks

## Instructions

When this skill is invoked:

### Step 0: Check Import State

Check if `## Import Progress` exists in README.md:
- If it exists, read it to determine current phase and pending tasks
- If not, this is a fresh start - proceed to Initial Setup

### Initial Setup: Team Name

**Goal:** Replace all `[Project Name]` placeholders with the actual team/project name.

Before starting Phase 1, check if `[Project Name]` placeholders still exist:

```bash
grep -r "\[Project Name\]" --include="*.md" --include="*.js" . 2>/dev/null | head -5
```

If placeholders exist:

1. Ask the user for their team/project name:

   ```
   Before we begin, what's your team or project name?

   This will replace "[Project Name]" throughout the knowledge base.
   Examples: "Payments", "Infrastructure", "Mobile App", "Acme Corp"
   ```

2. Replace `[Project Name]` in all files:
   - `README.md`
   - `CLAUDE.md`
   - `docs/docusaurus.config.js`
   - `docs/docs/intro.md`
   - `docs/blog/2025-01-01-welcome/index.md`
   - `docs/docs/specs/overview.md`
   - `docs/docs/reference/repos.md`
   - `docs/docs/runbooks/overview.md`
   - `docs/docs/architecture/overview.md`

3. Commit the change:
   ```
   Set project name to <name>

   Replaced [Project Name] placeholders throughout the knowledge base.
   ```

4. Proceed to Phase 1

### Phase 1: Repository Discovery

**Goal:** Add all team repositories as submodules with `update = none`.

1. Ask the user where their repositories are located:

   ```
   Let's start by finding all the repositories your team uses.

   The fastest way is for me to scan a folder for git repositories.
   Where do you keep your code?

   1. Scan ~/workspace (or specify a different folder)
   2. Scan my home folder (~)
   3. I'll provide repos another way (URLs, org scan, or file)
   ```

2. If the user chooses to scan a folder:
   - Use `find` to locate all `.git` directories under the specified path
   - Extract the remote URL from each repo's git config
   - Present the list to the user for confirmation/filtering
   - Skip repos the user doesn't want to include

   ```bash
   # Find all git repos and get their remote URLs
   find <path> -type d -name .git -prune 2>/dev/null | while read gitdir; do
       repo_path=$(dirname "$gitdir")
       url=$(git -C "$repo_path" remote get-url origin 2>/dev/null)
       if [ -n "$url" ]; then
           echo "$repo_path -> $url"
       fi
   done
   ```

3. If the user opts out of scanning, offer alternatives:
   - Paste a list of repository URLs (one per line)
   - Provide a GitHub org/user to scan (e.g., "github.com/your-org")
   - Point to a file or doc that lists repos

4. For each repository:
   - Detect the default branch (main/master/develop)
   - Add as submodule with detected branch
   - Configure `update = none` in .gitmodules
   - Add to the repos table in `docs/docs/reference/repos.md`

   ```bash
   # Example for each repo
   git submodule add -b <branch> <url> repos/<name>
   git config -f .gitmodules submodule.repos/<name>.update none
   ```

3. After all repos are added:
   ```bash
   git submodule deinit --all --force
   ```

4. Update README.md with Import Progress section:
   ```markdown
   ## Import Progress

   > This section tracks import progress. Remove when complete.

   ### Phase 1: Repository Discovery ✅
   - Added X repositories as submodules

   ### Phase 2: Existing Documentation 🔄
   - [ ] Onboarding documentation
   - [ ] Team wikis or knowledge bases
   - [ ] Architecture decision records (ADRs)

   ### Phase 3: Codebase Analysis ⏳
   - [ ] repo-name-1
   - [ ] repo-name-2
   ...

   ### Phase 4: Operational Knowledge ⏳
   - [ ] Runbooks
   - [ ] Alert definitions
   - [ ] Alert history

   ### Phase 5: Blog Population ⏳
   - [ ] Incident reports
   - [ ] Strategy docs
   - [ ] Notable discussions

   ### Phase 6: Documentation Rewrite ⏳

   ### Phase 7: Completeness Check ⏳

   ### Phase 8: Skills Creation ⏳
   ```

5. Commit the changes:
   ```
   Add team repositories as submodules

   Added X repositories with update=none configuration.
   Repos are documentation references - not checked out by default.
   ```

6. Proceed to Phase 2.

---

### Phase 2: Existing Documentation

**Goal:** Synthesize the most valuable existing documentation into the knowledge base.

1. Prompt the user for existing documentation:

   ```
   Before we analyze the codebases, let's incorporate your most valuable existing docs.

   The most useful documents are:
   - **Onboarding guides** - How new team members get up to speed
   - **Architecture overviews** - High-level system design docs
   - **Team wikis** - Confluence, Notion, or internal docs
   - **ADRs** - Architecture Decision Records

   Even if they're a bit out of date, they're valuable - we'll update them as we read code.

   Please paste or share:
   1. Your onboarding documentation (most important!)
   2. Any architecture or system design docs
   3. Links to wikis or other knowledge bases I should read
   ```

2. For each document provided:
   - Read and understand the content
   - Identify which parts map to architecture vs runbooks vs reference
   - Synthesize into the appropriate docs, noting source and date
   - Mark unclear or potentially outdated sections for verification during codebase analysis

3. Update `docs/docs/architecture/overview.md` with synthesized architecture knowledge

4. Create initial runbooks based on documented processes

5. Update Import Progress in README:
   - Mark Phase 2 items as complete
   - Note what was incorporated

6. Commit:
   ```
   Synthesize existing documentation

   Incorporated onboarding docs and architecture knowledge.
   Marked sections requiring verification against current code.
   ```

7. Proceed to Phase 3.

---

### Phase 3: Codebase Analysis

**Goal:** Breadth-first analysis of each repository, writing documentation as we go.

For each repository in the Import Progress checklist:

1. **Locate the code:**
   - Check CLAUDE.local.md for user-specified paths
   - Search by git remote origin (directory names are unreliable):
     ```bash
     .claude/scripts/find-repos.sh "<repo-name>" ~ 5
     ```
   - Use paths marked `[PREFERRED]` as candidates, but only treat a local checkout as canonical if it's on the canonical default branch, clean (`git status` empty), and not behind the canonical remote (fast-forward-only update is OK)
   - If the local checkout isn't trivially canonical (dirty tree, wrong branch, behind, fork ambiguity), prefer checking out the submodule instead: `git submodule update --checkout repos/<repo>`
   - If no local checkout is found and no submodule exists, ask the user where it is or clone it

2. **Initial analysis:**
   - Read README, CLAUDE.md, any docs/ folder
   - Identify the main entry points
   - Understand the project structure
   - Document: What is this? What does it do? How does it fit with other repos?

3. **Deep dive:**
   - Trace key code paths
   - Identify external dependencies and integrations
   - Find configuration patterns
   - Look for operational concerns (logging, metrics, error handling)

4. **Write documentation:**
   - Create or update architecture doc for major components
   - Create runbook stubs for operational tasks you discover
   - Update the repos table with accurate descriptions

5. **Mark progress:**
   - Check off the repo in Import Progress
   - Note any cross-cutting concerns or patterns discovered

6. After each repo, commit:
   ```
   Document <repo-name>

   - Added architecture docs for <components>
   - Created runbook stubs for <operations>
   - Identified integrations with <other-repos>
   ```

7. After all repos are analyzed, proceed to Phase 4.

---

### Phase 4: Operational Knowledge

**Goal:** Incorporate runbooks, alerting, and operational data.

1. Prompt for operational documentation:

   ```
   Now let's build operational knowledge. This helps me understand how your systems
   behave in production and how you respond to issues.

   Please share any of the following:

   1. **Runbooks** - Existing operational procedures for your services
   2. **Alert definitions** - Your alerting rules or monitor configurations
   3. **Alert history** - Recent triggered alerts (Slack channel export, PagerDuty, etc.)
   4. **Dashboards** - Links to observability dashboards
   5. **On-call documentation** - How your on-call rotation works
   ```

2. For runbooks:
   - Convert to the standard runbook template format
   - Verify commands and procedures against current code
   - Add links to relevant architecture docs
   - Place in `docs/docs/runbooks/`

3. For alerts:
   - Create an alerts reference doc (`docs/docs/reference/alerts.md`)
   - Map alerts to runbooks (create runbooks for alerts without procedures)
   - Document thresholds and expected responses

4. For alert history:
   - Identify patterns in recent incidents
   - Note which alerts fire frequently
   - Use this to prioritize runbook completeness

5. Update Import Progress and commit:
   ```
   Add operational knowledge

   - Converted X runbooks to standard format
   - Created alerts reference with Y alert definitions
   - Identified gaps: <list any alerts without runbooks>
   ```

6. Proceed to Phase 5.

---

### Phase 5: Blog Population

**Goal:** Add historical documents that don't need ongoing updates.

1. Prompt for blog content:

   ```
   The blog captures point-in-time knowledge: incidents, decisions, and insights.

   Please share:

   1. **Incident reports / Post-mortems** - Past incidents and what was learned
   2. **Strategy docs** - Design docs, RFCs, proposals that were implemented
   3. **Notable Slack threads** - Useful discussions worth preserving
   4. **Retrospectives** - Team learnings that should be documented

   I'll format these as blog posts with appropriate tags.
   ```

2. For each document:
   - Create a blog post with appropriate frontmatter
   - Use tags: `incident`, `architecture`, `decision`, `insight`
   - Extract actionable learnings into runbooks or architecture docs
   - Link to related documentation

3. Update authors.yml with team members mentioned

4. Update Import Progress and commit:
   ```
   Populate blog with historical knowledge

   Added X incident reports, Y decision docs, Z insights.
   Cross-referenced with architecture and runbooks.
   ```

5. Proceed to Phase 6.

---

### Phase 6: Documentation Rewrite

**Goal:** Second pass to significantly raise documentation quality.

With the full context from all phases, revisit each section:

1. **Architecture docs:**
   - Are diagrams accurate and complete?
   - Are component relationships clear?
   - Do they explain "why" not just "what"?
   - Are integration points documented?

2. **Runbooks:**
   - Are prerequisites complete?
   - Do procedures have verification steps?
   - Are troubleshooting sections comprehensive?
   - Are alerts linked to procedures?

3. **Reference docs:**
   - Is the repo map complete and accurate?
   - Are configuration references current?

4. **Intro and overview pages:**
   - Do they provide a good starting point?
   - Are navigation paths clear?

For each section:
- Rewrite with the benefit of full context
- Add cross-references between related docs
- Ensure consistent terminology
- Fill in gaps identified during analysis

Commit after each major section:
```
Rewrite <section> documentation

Improved clarity, added diagrams, cross-referenced related docs.
```

Proceed to Phase 7.

---

### Phase 7: Completeness Check

**Goal:** Find undocumented processes and missing access information.

1. Analyze all documentation for gaps:
   - What processes are mentioned but not documented?
   - What systems are referenced without access instructions?
   - What tools are assumed but not explained?
   - What permissions are needed but not documented?

2. For each gap, ask the user:

   ```
   I found some gaps in the documentation:

   **Missing Access Documentation:**
   - How do I get access to <system>?
   - What credentials/permissions are needed for <operation>?

   **Undocumented Processes:**
   - How do you <process mentioned in runbook>?
   - What's the procedure for <referenced task>?

   **Assumed Knowledge:**
   - What is <tool> and how do I set it up?
   - Where is <referenced resource>?
   ```

3. Document each answer in the appropriate location:
   - Access procedures → runbooks or dedicated access doc
   - Processes → runbooks
   - Tool setup → runbooks or reference docs

4. Update Import Progress and commit:
   ```
   Fill documentation gaps

   Added access documentation for X systems.
   Documented Y previously assumed processes.
   ```

5. Proceed to Phase 8.

---

### Phase 8: Skills Creation

**Goal:** Create custom skills for common tasks based on the knowledge base.

1. Analyze the documentation to propose skills:

   ```
   Based on your knowledge base, here are skills that might be useful:

   **Recommended:**
   - `/onboarding` - Interactive onboarding for new team members
   - `/incident` - Guided incident response with your specific procedures
   - `/health-check` - Check the status of your systems

   **Based on your runbooks:**
   - `/<operation>` - For frequently performed operations

   Which skills would you like me to create?
   ```

2. For each requested skill:
   - Create `.claude/skills/<name>/SKILL.md`
   - If the skill needs to run commands, create supporting scripts
   - Reference actual systems, namespaces, and procedures from the docs
   - Test the skill works as expected

3. Skills should:
   - Use AskUserQuestion for interactive choices
   - Delegate to scripts for repeatable operations
   - Reference the knowledge base for procedures
   - Provide guidance, not just execute commands

4. After creating each skill, commit:
   ```
   Add <skill-name> skill

   Interactive skill for <description>.
   ```

5. When the user is satisfied, finalize:
   - Remove the `## Import Progress` section from README
   - Update README with final skill list
   - Commit:
     ```
     Complete initial import

     Knowledge base populated with:
     - X architecture docs
     - Y runbooks
     - Z blog posts
     - N custom skills
     ```

---

## Resuming Import

When `/import` is run on a partially completed import:

1. Read the Import Progress section from README
2. Identify the current phase (🔄) and pending items
3. Ask the user if they want to:
   - Continue where they left off
   - Jump to a specific phase
   - Start a specific task

Example:
```
I see you're in the middle of importing. Current status:

✅ Phase 1: Repository Discovery - Complete (12 repos)
✅ Phase 2: Existing Documentation - Complete
🔄 Phase 3: Codebase Analysis - 5/12 repos done
⏳ Phases 4-8: Pending

Would you like to:
1. Continue with codebase analysis (next: repo-name-6)
2. Jump to a different phase
3. See detailed progress
```

---

## Tips

- **Take breaks:** This is a lot of work. Commit frequently so progress isn't lost.
- **Iterate:** First-pass docs don't need to be perfect. Phase 6 is for polish.
- **Ask questions:** When something is unclear, ask. Wrong assumptions compound.
- **Trust the code:** When docs conflict with code, code wins. Update the docs.
