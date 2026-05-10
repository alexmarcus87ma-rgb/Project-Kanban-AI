# CLAUDE.md - AI Agent Instructions

## 🚀 TECH_POWER Global Rule - MANDATORY PROPAGATION

**CRITICAL RULE:** Every conversation from now on:

### 1️⃣ **Encounter Technical Obstacle?**
   ✅ BEFORE solving: Check TECH_POWER knowledge base
   - Location: `~/.claude/projects/C--Users-inter-Desktop-Claude-Code-Project-3/memory/TECH_POWER.md`
   - If similar problem exists → apply INSTANTLY
   - If new problem → solve it THEN UPDATE TECH_POWER (same response)

### 2️⃣ **Learn New Technical Concept?**
   ✅ IMMEDIATELY update TECH_POWER before continuing
   - Do NOT wait for end of session
   - Add to "CONCEPTS LEARNED" section
   - Include examples from project
   - Reference related obstacles
   - Format: Same as obstacles (Problem, Root Cause, Solution, Testing)

### 3️⃣ **INSTANT UPDATE REQUIREMENT:**
   ⚠️ **AS SOON AS** something new is solved/learned:
   - Update TECH_POWER.md IMMEDIATELY (use Edit tool)
   - Include: Problem, Root Cause, Solution, Testing verification
   - Format matching existing entries
   - Do NOT batch updates until session end
   - DO NOT suggest/ask - EXECUTE the update

### 4️⃣ **Propagation Method:**
   When updating TECH_POWER:
   ```
   1. Solve/learn something new
   2. Immediately read TECH_POWER.md
   3. Find correct section (Solved Obstacles or Concepts)
   4. Add new entry with full details
   5. Save to file
   6. Confirm: "✅ Updated TECH_POWER: [name]"
   ```

### 5️⃣ **Version Control:**
   - TECH_POWER updates = critical knowledge
   - Always include Git commit with updates:
     ```
     git add ~/.claude/projects/C--Users-inter-Desktop-Claude-Code-Project-3/memory/TECH_POWER.md
     git commit -m "TECH_POWER: Add [Obstacle/Concept] - [description]"
     ```

---

## Project Context

- **Framework:** NextJS (React) Frontend + FastAPI Backend
- **Database:** SQLite with SQLAlchemy ORM
- **AI Integration:** OpenRouter API (Gemma/Mistral/Llama models)
- **Auth:** Simple session-based (username: "user", password: "password")
- **Git Remote:** https://github.com/alexmarcus87ma-rgb/Project-Kanban-AI

---

## Important Files

- `.env` - OpenRouter API key (NEVER push to GitHub)
- `backend/config.py` - Model configuration
- `backend/services/ai_service.py` - AI call logic with retry
- `backend/routes/ai.py` - API endpoints for AI chat
- `database.db` - SQLite database (auto-created on first run)

---

## 📊 TECH_POWER Propagation Rules

### When I Solve Something New:
```
STEP 1: Solve the problem
STEP 2: Document solution
STEP 3: READ TECH_POWER.md
STEP 4: EDIT TECH_POWER.md with new entry
STEP 5: COMMIT to git
STEP 6: Report: "✅ Added to TECH_POWER: [name]"
```

### When I Learn a New Concept:
```
STEP 1: Learn concept
STEP 2: Understand root cause
STEP 3: READ TECH_POWER.md
STEP 4: EDIT under "CONCEPTS LEARNED"
STEP 5: COMMIT to git
STEP 6: Report: "✅ Propagated concept to TECH_POWER: [name]"
```

### Auto-Propagation Format:
Every update MUST include:
- **Name:** Clear identifier
- **Problem/Concept:** What is it?
- **Root Cause/Why:** Why did it happen?
- **Solution:** How to fix it (with code if applicable)
- **Testing:** How to verify it works
- **When to Use:** Context for when this applies

### Git Commit Format:
```bash
git add ~/.claude/projects/C--Users-inter-Desktop-Claude-Code-Project-3/memory/TECH_POWER.md
git commit -m "TECH_POWER: Add [Obstacle/Concept] - [1-line description]"
git push origin main
```

---

## Status

✅ AI working with openrouter/auto  
✅ Retry logic with exponential backoff active  
✅ Git remote changed to alexmarcus87ma-rgb/Project-Kanban-AI  
✅ TECH_POWER auto-propagation system active  
⏳ Next: Push code to GitHub with TECH_POWER
