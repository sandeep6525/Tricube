## Goal
Let you sign in immediately and access the Admin dashboard.

## Problem
Sign-up succeeds but sign-in fails with "Email not confirmed". Until you confirm the email, the `claim_first_admin` function can't run (no session), so no admin exists yet.

## Plan

1. **Disable email confirmation** on the auth settings so new sign-ups can log in instantly.
2. **Sign in** with your existing account (`sandeepkanna796@gmail.com` / `Tricube@3`). On first successful login, the app automatically calls `claim_first_admin`, which promotes you to **Admin** since no admin exists yet.
3. **Verify Admin access** — you should land on the Admin dashboard with full access to Income, Expenses, Staff, Partners, Events, Payslips, and Reports.

## Alternative (if you prefer to keep email confirmation on)
Open the confirmation email sent to `sandeepkanna796@gmail.com`, click the link, then sign in. Same admin bootstrap happens on first login.

## Notes
- Only the **first** user to sign in becomes Admin. All later sign-ups default to Staff.
- You can re-enable email confirmation anytime later from Cloud → Users → Auth settings.