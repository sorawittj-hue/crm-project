import { test, expect } from '@playwright/test';

test.describe('Zenith CRM E2E Smoke Test', () => {
  test('should login, create a deal, move it to won, and verify pipeline value updates', async ({ page }) => {
    // 1. Go to Login page
    await page.goto('/login');
    
    // Fill credentials (assuming mock login or test environment)
    await page.fill('input[type="email"]', 'sorawittj@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for redirection to dashboard (Command Center)
    await page.waitForURL('**/command-center');
    await expect(page.locator('text=ศูนย์ควบคุม')).toBeVisible();

    // 2. Navigate to Pipeline Page
    await page.click('a[href="/pipeline"]');
    await page.waitForURL('**/pipeline');
    await expect(page.locator('text=ดีลทั้งหมด')).toBeVisible();

    // 3. Create a new deal
    await page.click('button:has-text("สร้างดีล"), button:has-text("ดีลใหม่")');
    await page.fill('input[placeholder*="ชื่อดีล"]', 'E2E Smoke Test Deal');
    await page.fill('input[placeholder*="มูลค่า"]', '100000');
    await page.click('button[type="submit"]:has-text("สร้างดีล"), button:has-text("สร้าง")');

    // Verify the deal card exists in the list/board
    const dealCard = page.locator('text=E2E Smoke Test Deal').first();
    await expect(dealCard).toBeVisible();

    // 4. Drag & Drop deal from "lead" stage to "won" stage
    // Locate columns
    const wonColumn = page.locator('[droppableid="won"]');
    
    // Drag card to won column
    await dealCard.dragTo(wonColumn);

    // Wait for Won Reason modal and fill it
    await expect(page.locator('text=บันทึกดีลสำเร็จ, text=ปิดดีลสำเร็จ')).toBeVisible();
    await page.fill('textarea', 'Won via Playwright E2E automation');
    await page.click('button:has-text("บันทึก"), button:has-text("ตกลง")');

    // Verify deal is in the Won stage
    await expect(wonColumn.locator('text=E2E Smoke Test Deal')).toBeVisible();

    // 5. Verify the updated won value on CommandCenter/Analytics
    await page.click('a[href="/command-center"]');
    await page.waitForURL('**/command-center');

    // Expect the total won value card to include or reflect the new deal value
    const wonValueWidget = page.locator('text=฿100,000');
    await expect(wonValueWidget).toBeVisible();
  });
});
