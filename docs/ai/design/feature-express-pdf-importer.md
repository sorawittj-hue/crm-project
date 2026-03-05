---
title: Sales Leader UX Upgrade & Express PDF Importer Design
status: draft
---

# Feature: Sales Leader UX Upgrade & Express PDF Importer

## System Architecture Changes
- **Client-Side PDF Processing:** Integrate `pdfjs-dist` to read the PDF file directly in the user's browser without sending the file to a server.
- **AI-Powered Parsing:** Send the raw text extracted from `pdf.js` to the existing `callGeminiAPI` integration with a tailored Prompt to return a structured JSON object.
- **UI State Management:** Expand `App.jsx` to manage the modal state for PDF verification and the new visual states for goals.

## Data Models/Schema Changes
- No schema changes required for `deals` table. We will use the existing `assigned_to`, `value`, `stage`, and `createdAt` fields to calculate metrics.
- The `deals` table already supports `notes` and `tasks` fields (JSONB), which will be used for the Activity Feed and Auto-Task generation.

## API Endpoints or Interfaces
- New Utility: `extractTextFromPDF(file)` - Returns raw text.
- New Prompt for Gemini: `Review this raw text from an Express quote and extract: Contact, Company, Total Value, Date, and summarize a Title. Return JSON.`

## Components to Create/Modify
- **Create:** 
  - `ExpressPdfUploader` (Dropzone + logic).
  - `DataVerificationModal` (Form to review and correct AI output before saving).
  - `GoalProgressWidget` (Beautiful, animated progress bar for 10M target).
  - `TeamActivityFeed` (List of recent actions derived from deal updates).
- **Modify:**
  - `CommandCenter` or equivalent Dashboard component to include the `GoalProgressWidget` and `TeamActivityFeed`.
  - `Pipeline` and `DealCard` components to add Quick Actions (icons on hover) and Stagnant Deal Highlighting (CSS classes based on `lastActivity`).

## Key Design Decisions
- **Verification Step is Mandatory:** To prevent garbage data in the CRM, the AI will not silently create deals. It will pre-fill a form, and the user must click "Confirm & Create".
- **Visual Gamification:** The 10M target progress bar will use vibrant colors (e.g., gradients to represent success) and smooth CSS animations to feel rewarding.
- **Micro-interactions:** Drag-and-drop actions and button clicks will have improved hover states and active states to make the app feel "premium".

## Security and Performance Considerations
- Ensure `pdfjs-dist` is loaded efficiently (e.g., using a web worker or dynamic import) so it doesn't block the main thread.
- Protect Gemini API usage by strictly handling errors and avoiding infinite loops if the PDF is unreadable.
