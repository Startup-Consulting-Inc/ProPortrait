# Manual Payment Flow Test Checklist

Use this checklist to verify the payment flow works correctly after deployment.

## Test 1: Anonymous User Platform Download

**Prerequisites:** 
- Incognito/private browser window
- No existing session

**Steps:**
1. [ ] Go to https://portrait.ai-biz.app
2. [ ] Upload a test photo
3. [ ] Click through to Step 4 (Export)
4. [ ] Click "Buy & Download" button
5. [ ] In BuyCreditsModal, select "1 Platform Export ($2.99)"
6. [ ] Complete Stripe payment in new tab
7. [ ] **VERIFY:** Payment tab auto-closes
8. [ ] **VERIFY:** Original tab shows "Payment confirmed!" briefly
9. [ ] **VERIFY:** Modal closes automatically
10. [ ] **VERIFY:** Click LinkedIn download → File downloads WITHOUT sign-in prompt

**Expected Result:** ✅ File downloads immediately, no sign-in required

---

## Test 2: Anonymous User HD Download

**Steps:**
1. [ ] New incognito window
2. [ ] Upload photo, go to Export step
3. [ ] Click "Buy & Download" 
4. [ ] Select "1 HD Download ($4.99)"
5. [ ] Complete payment
6. [ ] **VERIFY:** Modal auto-closes after payment
7. [ ] **VERIFY:** Click "Download HD Portrait" → File downloads

**Expected Result:** ✅ HD file downloads, no sign-in required

---

## Test 3: Already Has Credits

**Prerequisites:**
- Session with existing credits (from previous purchase or manual seeding)

**Steps:**
1. [ ] Go to Export step with portrait ready
2. [ ] Click LinkedIn download
3. [ ] **VERIFY:** File downloads immediately, no payment modal

**Expected Result:** ✅ Instant download

---

## Test 4: Credit Persistence After Refresh

**Steps:**
1. [ ] Complete Test 1 or 2 (buy credits)
2. [ ] Refresh the page (F5)
3. [ ] Upload new photo, go to Export
4. [ ] **VERIFY:** Credits still show in UI
5. [ ] **VERIFY:** Can download without buying again

**Expected Result:** ✅ Credits persist across page refreshes

---

## Common Issues & Debugging

### Issue: "Sign in" modal still appears after purchase

**Possible causes:**
1. Stale React state (should be fixed with `getFreshSessionCredits()`)
2. Credits not actually saved to Firestore (check server logs)
3. Wrong session ID after refresh

**Debug steps:**
```javascript
// Open browser console on Export page
// Check current session credits
fetch('/api/auth/me', {credentials: 'include'})
  .then(r => r.json())
  .then(console.log)
```

Should show: `{hdCredits: 0, platformCredits: 1, ...}`

### Issue: Payment tab doesn't auto-close

**Expected:** Most browsers block window.close() for tabs not opened by script. The payment tab should show a "Close This Tab" button instead.

### Issue: BuyCreditsModal stays open after payment

**Check:**
1. Open browser console in original tab
2. Look for: `[BuyCreditsModal] Payment detected...` log
3. Check localStorage: `localStorage.getItem('pp_payment_status')`

Should show completed status with recent timestamp.

---

## Automated Test (Limited)

```bash
# Run Playwright tests (basic flow only)
npm run test:e2e
```

Note: Automated tests cannot test actual Stripe payment due to cross-domain restrictions.

---

## Quick Verification Script

Paste this in browser console on the Export page to verify credits:

```javascript
(async () => {
  const res = await fetch('/api/auth/me', {credentials: 'include'});
  const data = await res.json();
  console.log('Session:', data.sessionId);
  console.log('HD Credits:', data.hdCredits);
  console.log('Platform Credits:', data.platformCredits);
  console.log('Is Firebase User:', data.isFirebaseUser);
})();
```

**Expected output after buying 1 platform credit:**
```
Session: "abc-123-xyz"
HD Credits: 0
Platform Credits: 1
Is Firebase User: false
```
