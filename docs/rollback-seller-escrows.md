# Rollback Plan: Seller Escrows Feature

If issues arise after enabling seller escrows, follow this rollback plan:

## 1. Disable Feature Flag
- Set `FF_SELLER_ESCROWS=false` in the `.env` file.
- Restart backend services to apply the change.

## 2. Communicate to Stakeholders
- Notify sellers and buyers that escrow functionality is temporarily disabled.
- Update documentation and user-facing messages as needed.

## 3. Data Integrity
- Ensure all active escrows are either completed or paused.
- No new escrows should be created while the flag is off.

## 4. Revert Code Changes (if needed)
- If disabling the flag does not resolve issues, revert related code changes using version control (e.g., `git revert`).
- Deploy the previous stable version.

## 5. Monitor
- Closely monitor system logs and user reports for any residual issues.

---

For urgent issues, escalate to the engineering lead and follow incident response procedures.
