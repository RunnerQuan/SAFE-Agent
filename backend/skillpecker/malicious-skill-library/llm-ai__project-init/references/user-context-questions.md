# User Context Questions

This reference provides a structured approach to gathering user context during project initialization.

## Purpose

These questions help the AI understand the user's background, goals, and constraints to provide personalized guidance throughout the project.

## Question Flow

### 1. Preferred Language (Communication)
**Question**: "어떤 언어로 대화하는 것이 편하세요? (한국어 / English)"

**Purpose**: Set the language for all AI communication

**Default**: If user starts in Korean → Korean; If English → English

---

### 2. Work Domain & Purpose
**Question**:
- Korean: "어떤 분야에서 일하시나요? 그리고 이 도구로 무엇을 자동화하고 싶으신가요?"
- English: "What field do you work in? What would you like to automate with this tool?"

**Examples to share**:
- "마케팅 - 매일 하는 리포트 자동화" (Marketing - Daily report automation)
- "재무 - 엑셀 데이터 정리 및 분석" (Finance - Excel data processing and analysis)
- "영업 - CRM 데이터 업데이트" (Sales - CRM data updates)
- "인사 - 입퇴사 처리 자동화" (HR - Onboarding/offboarding automation)

**Purpose**: Understand domain context to provide relevant examples and suggestions

---

### 3. Technical Background
**Question**:
- Korean: "프로그래밍 경험이 있으신가요?"
- English: "Do you have any programming experience?"

**Options**:
1. "전혀 없음" / "None"
2. "조금 (엑셀 함수, 간단한 스크립트)" / "Some (Excel formulas, simple scripts)"
3. "있음 (다른 언어로 코딩 경험)" / "Yes (coding experience in other languages)"

**Purpose**: Adjust explanation depth and assumptions

---

### 4. Project Type Confirmation
**Statement** (not a question):
- Korean: "이 프로젝트는 Python 기반 로컬 실행 도구로 진행됩니다."
- English: "This project will be a Python-based local execution tool."

**Follow-up**:
- Korean: "나중에 TypeScript 지원도 추가할 수 있습니다 (예: n8n 워크플로우)"
- English: "TypeScript support can be added later if needed (e.g., for n8n workflows)"

**Purpose**: Set clear expectations about technology constraints

---

## How to Use This Reference

1. **Ask questions naturally**: Don't just copy-paste. Integrate into conversation flow.
2. **Adapt based on context**: If user already mentioned something, skip that question.
3. **Store answers**: Save in CLAUDE.md using the template placeholders.
4. **Use throughout project**: Refer back to these answers when making decisions.

## Template Mapping

The answers to these questions fill the CLAUDE.md template:

```markdown
### Preferred Language
{{PREFERRED_LANGUAGE}}  ← Question 1

### Work Domain & Purpose
{{WORK_DOMAIN}} - {{TOOL_PURPOSE}}  ← Question 2

### Technical Background
{{TECHNICAL_BACKGROUND}}  ← Question 3

### Project Type
{{PROJECT_TYPE}} - local execution  ← Confirmed in Question 4
```

## Example Conversation Flow

```
AI: 안녕하세요! 새 프로젝트를 시작하겠습니다. 어떤 분야에서 일하시나요?
    그리고 이 도구로 무엇을 자동화하고 싶으신가요?

User: 저는 마케팅팀에서 일하고 있고, 매일 여러 플랫폼에서 데이터를 모아서
      리포트를 만드는데 이걸 자동화하고 싶어요.

AI: 좋습니다! 프로그래밍 경험이 있으신가요?

User: 엑셀 함수는 쓸 줄 알지만 코딩은 해본 적 없어요.

AI: 알겠습니다. 이 프로젝트는 Python 기반으로 진행되며, 컴퓨터에서
    직접 실행되는 도구를 만들게 됩니다. 먼저 Python을 설치해야 하는데...
```

## Notes

- **Don't overwhelm**: Gather context progressively, not all at once
- **Be conversational**: Questions should feel natural, not like a form
- **Validate understanding**: Repeat back what you understood to confirm
