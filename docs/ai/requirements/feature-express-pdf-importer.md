---
title: Sales Leader UX Upgrade & Express PDF Importer Requirements
status: draft
---

# Feature: Sales Leader UX Upgrade & Express PDF Importer

## Problem Statement
1. **Manual Data Entry Friction:** The sales team currently manually enters deal data from Express software quotes into the CRM application. This process is tedious, time-consuming, and prone to human error.
2. **Lack of Visual Motivation (Gamification):** As a new Sales Team Leader with a 10M THB target (7M personal, 3M team), the current UI does not visually drive daily performance or show clear progress towards this critical goal.
3. **Inefficient Pipeline UX:** The current pipeline requires too many clicks for simple actions, lacks visual urgency for stagnant deals, and doesn't clearly show what needs immediate attention.
4. **Poor Team Visibility:** The leader needs to see what the team (e.g., "Nong Off") is doing without micromanaging or constantly asking for updates.

## Goals
- **Automated Express PDF Import:** Extract Contact Name, Company Name, Deal Value, Date, and Deal Title from Express PDFs using AI.
- **Smart Placement & Automation:** Automatically place the imported deal into the "Proposal" stage and create a follow-up task (e.g., "Call about proposal in 2 days").
- **Data Verification:** Show a modal for the user to review and edit the AI-extracted data before saving it to the database to ensure 100% accuracy.
- **Gamified Goal Tracking:** Implement highly visible progress bars on the main Dashboard showing the 10M goal (divided into 7M Leader and 3M Team) to create daily motivation.
- **Enhanced Pipeline UI:** Add visual cues for stagnant deals (e.g., highlighting deals inactive for > 3 days) and Quick Action buttons directly on deal cards.
- **Team Activity Feed:** Provide a quick summary of team activities (deals created, moved, notes added) for the Leader.

## Non-Goals
- Building a full accounting system or deep integration with the Express database API (sticking to PDF import).
- Extracting itemized product details inside the quote.
- Complex hierarchical permissions (keep it simple for Leader and Team).

## User Stories
- As a Salesperson, I want to drag and drop an Express PDF quote into the system so that it automatically drafts a new deal in the "Proposal" stage.
- As a Salesperson, I want to verify the extracted data before saving, so I can confidently rely on the system without worrying about AI hallucinations.
- As a Sales Leader, I want to see a massive, beautiful progress bar of our 10M target when I open the app, so I feel motivated and know exactly where we stand.
- As a Sales Leader, I want to see visually distinct deal cards if a deal has been ignored for too long, so I can jump in and close it.
- As a Sales Leader, I want to see a feed of my team's actions today so I can offer timely coaching.

## Success Criteria
- [ ] Users can upload an Express PDF, review the 5 fields in a modal, and save it to the "Proposal" stage.
- [ ] Dashboard displays the 10M goal progress accurately based on "Won" deals, broken down by assignee.
- [ ] Deal cards highlight visually if inactive for a set period.
- [ ] Quick actions (Add Note/Task, Call) are available directly on the deal card.
- [ ] An Activity Feed component shows recent actions by team members.

## Constraints and Assumptions
- Express PDFs have text that can be extracted via browser technologies (`pdf.js`).
- Gemini API is used to intelligently parse the unstructured text output from the PDF into structured JSON.
- The app operates primarily on a single-page architecture (React), and state is managed locally/Supabase.
