# config.py

LLM_PROVIDER_CONFIG = {
    "gpt": {
        "api_key": "xxx",
        "base_url": "xxx"
    },
    "deepseek": {
        "api_key": "xxx",
        "base_url": "xx"
    },
    "qwen": {
        "api_key": "sk-xxx",
        "base_url": "xxx"
    }
}

PROMPT_GENERATE_CONFIG = {
    "codePath": "./node/",
    "edgePath": "./runs/judgeEdge/",
    "cgWritePath": "./runs/callGraph.json",
    "source_sink_path": "./runs/source_to_sink_path.json",
    "promptPath": "./runs/generated_prompt.json",
    "resourceFolder": "./resources/",
    "mcpList": ["claude Post", "MCP_chrome", "Notes", "whatsapp"],
    "resourceConfig": {
        "claude Post": "email_account",
        "MCP_chrome": "chrome",
        "Notes": "notes",
        "whatsapp": "whatsapp"
    },
    "funcConfig": {
        "claude Post": ["send_email", "search_emails", "get_email_content", "count_daily_emails"],
        "MCP_chrome": ["chrome_get_web_content", "chrome_fill_or_select", "chrome_bookmark_add", "chrome_search_everywhere"],
        "Notes": ["create_note", "update_note", "delete_note", "get_note", "search_and_replace_note", "search_notes"],
        "whatsapp": ["search_contacts", "list_chats", "get_chat", "get_contact_related_chats",
                     "get_latest_message", "list_messages", "get_message_context", "send_message"]
    },
    "source": ["chrome_get_web_content", "chrome_search_everywhere", "search_contacts", "list_chats", "get_chat",
               "get_contact_related_chats", "get_latest_message", "list_messages", "get_message_context",
               "search_emails", "get_email_content", "count_daily_emails", "get_note", "search_notes"],
    "sink": ["chrome_fill_or_select", "chrome_bookmark_add", "send_message", "send_email", "update_note", "create_note"]
}

DOE_DETECT_CONFIG = {
    "path_to_agentDojo_runRes" : "xxx",
    "judgeRes_path" : "./runs/LLM_voting_result.json"
}
