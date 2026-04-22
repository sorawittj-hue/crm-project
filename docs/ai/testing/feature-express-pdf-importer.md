---
title: Sales Leader UX Upgrade & Express PDF Importer Testing
status: draft
---

# Feature: Sales Leader UX Upgrade & Express PDF Importer

## Unit Test Cases / Manual Verifications
- **PDF Extraction:** Upload various standard PDFs to ensure text is captured.
- **AI Structuring:** Verify the prompt consistently returns valid JSON with all 5 fields.
- **Goal Calculation:** Ensure the 10M, 7M, and 3M progress bars correctly sum the `value` of deals where `stage === 'won'` and match the respective `assigned_to`.

## Integration Test Scenarios
- **End-to-End PDF Import:** 
  1. Upload PDF -> 2. Modal Opens -> 3. Edit a field slightly -> 4. Save -> 5. Verify Deal appears in "Proposal" column with correct edited data and an auto-created Task.

## UX Testing Steps
1. Navigate to Dashboard. Verify Goal bars look impressive and correctly reflect current won deals.
2. Navigate to Pipeline.
3. Create a test deal and set its `lastActivity` to 4 days ago. Verify the card turns "stagnant" (e.g., orange/red warning border).
4. Hover over a Deal Card. Verify quick action icons appear and clicking them opens the respective input without needing to open the full deal detail view.

## Verify Success Criteria
- [x] PDF Import workflow is smooth and includes human verification.
- [x] Leaderboard / Gamification bars accurately reflect the 10M (7M + 3M) targets.
- [x] Stagnant deals are visually glaring to the user.
- [x] Pipeline feels faster to use (Quick Actions).
- [x] Team Activity feed provides a clear summary of recent actions.
