---
name: ai-testing
description: An AI tool for automated testing, focusing on output quality, reliability, user trust, regulatory compliance, and security. Use this skill to prevent injection attacks, ensure system integrity, and protect data by integrating LLM-based systems into the Deepeval Framework, running test cases, and generating structured fact-check reports.
---

# AI Testing Skill

This skill provides a structured workflow for performing AI testing, ensuring robust, reliable, and secure AI systems. It leverages the Deepeval Framework to integrate and test LLM-based systems against various quality and security metrics.

## Workflow for AI Testing

Follow these steps to conduct comprehensive AI testing:

1.  **Integrate LLM System with Deepeval Framework:**
    *   **Objective:** Set up the target LLM-based system for testing within the Deepeval framework.
    *   **Action:** Use the `template/red_team.py` file as a starting point or template to integrate the system and define evaluation metrics and test cases.
    *   **Verification:** Ensure the system is correctly initialized and accessible for testing.

2.  **Execute Test Cases:**
    *   **Objective:** Run the defined test cases against the integrated LLM system.
    *   **Action:** Initiate the testing process through the Deepeval framework to evaluate the LLM's performance against criteria such as output quality, reliability, security (e.g., injection attack prevention), and compliance.
    *   **Verification:** Confirm that all test cases have been executed and raw test results are available.

3.  **Generate Structured Fact-Check Report:**
    *   **Objective:** Create a clear, structured report summarizing the test findings.
    *   **Action:** Process the test results to generate a markdown-formatted report that includes detailed outcomes, identified vulnerabilities, compliance adherence, and overall system performance.
    *   **Verification:** Ensure the report is comprehensive, accurate, and saved as a `.md` file in an accessible location.