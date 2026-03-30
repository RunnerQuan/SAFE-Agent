# Notion Block Reference

Notion API 블록 타입별 JSON 구조.

## Table of Contents
1. [Heading](#heading)
2. [Paragraph & Text Styling](#paragraph--text-styling)
3. [Lists](#lists)
4. [Image](#image)
5. [Code Block](#code-block)
6. [Callout](#callout)
7. [Table](#table)
8. [Toggle (FAQ)](#toggle-faq)
9. [Quote](#quote)
10. [Divider](#divider)
11. [To-Do](#to-do)

---

## Heading

```json
{ "type": "heading_2", "heading_2": { "rich_text": [{ "type": "text", "text": { "content": "제목" } }] } }
{ "type": "heading_3", "heading_3": { "rich_text": [{ "type": "text", "text": { "content": "소제목" } }] } }
```

**컬러 헤딩:**
```json
{
  "type": "heading_2",
  "heading_2": {
    "rich_text": [{ "type": "text", "text": { "content": "🎯 핵심 기능" } }],
    "color": "blue"
  }
}
```

색상: `blue`, `green`, `yellow`, `red`, `purple`, `pink`, `orange`, `gray`, `brown`

---

## Paragraph & Text Styling

**기본:**
```json
{ "type": "paragraph", "paragraph": { "rich_text": [{ "type": "text", "text": { "content": "내용" } }] } }
```

**스타일 조합 (굵은 텍스트 + 색상):**
```json
{
  "type": "paragraph",
  "paragraph": {
    "rich_text": [
      { "type": "text", "text": { "content": "좌측 메뉴에서 " } },
      { "type": "text", "text": { "content": "'원비청구'" }, "annotations": { "bold": true, "color": "blue" } },
      { "type": "text", "text": { "content": " → " } },
      { "type": "text", "text": { "content": "'청구서 생성'" }, "annotations": { "bold": true, "color": "blue" } },
      { "type": "text", "text": { "content": " 버튼을 클릭합니다." } }
    ]
  }
}
```

**인라인 코드:**
```json
{ "type": "text", "text": { "content": "010-1234-5678" }, "annotations": { "code": true } }
```

**annotations 옵션:**
- `bold`: true
- `italic`: true
- `strikethrough`: true
- `underline`: true
- `code`: true (인라인 코드)
- `color`: 텍스트/배경색

**색상:**
- 텍스트: `blue`, `green`, `yellow`, `red`, `purple`, `pink`, `orange`, `gray`, `brown`
- 배경: `{color}_background` (예: `blue_background`)

---

## Lists

```json
{ "type": "bulleted_list_item", "bulleted_list_item": { "rich_text": [{ "type": "text", "text": { "content": "항목" } }] } }
{ "type": "numbered_list_item", "numbered_list_item": { "rich_text": [{ "type": "text", "text": { "content": "항목" } }] } }
```

---

## Image

**스크린샷 플레이스홀더 (caption으로 필요 이미지 설명):**
```json
{
  "type": "image",
  "image": {
    "type": "external",
    "external": { "url": "" },
    "caption": [{ "type": "text", "text": { "content": "[이미지 필요: 좌측 사이드바에서 '원비청구' 메뉴 위치]" } }]
  }
}
```

caption 형식: `[이미지 필요: 화면/UI 설명]`

---

## Code Block

```json
{
  "type": "code",
  "code": {
    "rich_text": [{ "type": "text", "text": { "content": "예시:\n학생명: 홍길동\n전화번호: 010-1234-5678" } }],
    "language": "plain text"
  }
}
```

language: `plain text`, `json`, `javascript`, `html` 등

---

## Callout

```json
{
  "type": "callout",
  "callout": {
    "icon": { "type": "emoji", "emoji": "💡" },
    "color": "blue_background",
    "rich_text": [
      { "type": "text", "text": { "content": "Tip" }, "annotations": { "bold": true } },
      { "type": "text", "text": { "content": ": 기본적으로 현재 월이 선택되어 있습니다." } }
    ]
  }
}
```

**용도별 가이드:**

| 아이콘 | 색상 | 용도 |
|--------|------|------|
| 💡 | blue_background | 유용한 팁 |
| ⚠️ | yellow_background | 주의사항 |
| 🚨 | red_background | 위험/필수 확인 |
| ⚡ | green_background | 자동화 기능 |
| 📱 | green_background | 알림톡 발송 |
| ⏰ | yellow_background | 시간/마감 관련 |
| ✅ | green_background | 성공/완료 |
| 📌 | gray_background | 참고사항 |

---

## Table

**컬럼 설명:**
```json
{
  "type": "table",
  "table": {
    "table_width": 2,
    "has_column_header": true,
    "children": [
      { "type": "table_row", "table_row": { "cells": [[{ "type": "text", "text": { "content": "컬럼명" } }], [{ "type": "text", "text": { "content": "설명" } }]] } },
      { "type": "table_row", "table_row": { "cells": [[{ "type": "text", "text": { "content": "학생명" } }], [{ "type": "text", "text": { "content": "청구 대상 학생" } }]] } }
    ]
  }
}
```

**상태값 (이모지+색상):**
```json
{
  "type": "table",
  "table": {
    "table_width": 3,
    "has_column_header": true,
    "children": [
      { "type": "table_row", "table_row": { "cells": [[{ "type": "text", "text": { "content": "상태" } }], [{ "type": "text", "text": { "content": "색상" } }], [{ "type": "text", "text": { "content": "설명" } }]] } },
      { "type": "table_row", "table_row": { "cells": [[{ "type": "text", "text": { "content": "✅ 완납" } }], [{ "type": "text", "text": { "content": "🟢 초록" } }], [{ "type": "text", "text": { "content": "전액 납부 완료" } }]] } },
      { "type": "table_row", "table_row": { "cells": [[{ "type": "text", "text": { "content": "⏳ 미납" } }], [{ "type": "text", "text": { "content": "🔴 빨강" } }], [{ "type": "text", "text": { "content": "미납 상태" } }]] } }
    ]
  }
}
```

**입력 필드:**
```json
{
  "type": "table",
  "table": {
    "table_width": 4,
    "has_column_header": true,
    "children": [
      { "type": "table_row", "table_row": { "cells": [[{ "type": "text", "text": { "content": "필드명" } }], [{ "type": "text", "text": { "content": "필수" } }], [{ "type": "text", "text": { "content": "형식" } }], [{ "type": "text", "text": { "content": "설명" } }]] } },
      { "type": "table_row", "table_row": { "cells": [[{ "type": "text", "text": { "content": "전화번호" } }], [{ "type": "text", "text": { "content": "✅" } }], [{ "type": "text", "text": { "content": "010-0000-0000" } }], [{ "type": "text", "text": { "content": "연락처" } }]] } }
    ]
  }
}
```

---

## Toggle (FAQ)

```json
{
  "type": "toggle",
  "toggle": {
    "rich_text": [{ "type": "text", "text": { "content": "Q: 청구서를 잘못 생성했어요. 어떻게 해야 하나요?" } }],
    "children": [
      { "type": "paragraph", "paragraph": { "rich_text": [{ "type": "text", "text": { "content": "A: 청구서 상세에서 '삭제' 버튼을 클릭하면 삭제할 수 있습니다." } }] } }
    ]
  }
}
```

---

## Quote

```json
{
  "type": "quote",
  "quote": {
    "rich_text": [{ "type": "text", "text": { "content": "중요: 청구서 발송 전 금액을 반드시 확인하세요." } }],
    "color": "yellow_background"
  }
}
```

---

## Divider

```json
{ "type": "divider", "divider": {} }
```

---

## To-Do

```json
{
  "type": "to_do",
  "to_do": {
    "rich_text": [{ "type": "text", "text": { "content": "학생 정보 확인" } }],
    "checked": false
  }
}
```
