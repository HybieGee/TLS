# 🚀 GO LIVE CHECKLIST

## 1. **Domain Setup**
- [ ] Add custom domain in Cloudflare Pages Dashboard
- [ ] Update DNS records (automatic if domain is on Cloudflare)
- [ ] Enable SSL/TLS (automatic with Cloudflare)

## 2. **Database Check**
- [ ] Verify D1 database is working on production
- [ ] Clear test data if needed: `POST /api/gallery/clear`
- [ ] Initialize gallery positions (already done)

## 3. **Environment Variables in Cloudflare Pages**
Already configured:
- ✅ `DB` binding to D1 database
- ✅ `KV_SESSIONS` binding to KV namespace
- ✅ `SESSION_COOKIE_NAME` = "sb_session"

## 4. **Features Working**
Test these on production (tls-9vb.pages.dev):
- [ ] Character creation and submission
- [ ] Voting system
- [ ] Hourly winner deployment
- [ ] Gallery display
- [ ] Hall of Fame
- [ ] Multiplayer (if enabled)

## 5. **Image Domains to Update (if custom domain)**
In `next.config.ts`, add your domain:
```typescript
{
  protocol: 'https',
  hostname: 'yourdomain.com', // Add your domain here
}
```

## 6. **No Code Changes Needed for:**
- ✅ Database connections (using D1 bindings)
- ✅ Session management (using KV)
- ✅ API routes (all use relative paths)
- ✅ Image uploads (stored in database as base64)

## 7. **Quick Commands**

### Clear Gallery for Fresh Start:
```bash
curl -X POST "https://yourdomain.com/api/gallery/clear"
```

### Test Period Resolution:
```bash
curl -X POST "https://yourdomain.com/api/test-resolution" \
  -H "Content-Type: application/json" \
  -d "{\"periodKey\":\"2025-08-23T14\"}"
```

### Check Current Period:
```bash
curl "https://yourdomain.com/api/periods/current"
```

## 8. **After Domain is Connected**
1. Test all features on your custom domain
2. Share the link!
3. Monitor the first few hourly cycles

## 9. **Monitoring**
- Check Cloudflare Pages logs for any errors
- Monitor D1 database queries in Cloudflare Dashboard
- Watch for the first automatic winner deployment

## 10. **Emergency Fixes**
If something breaks:
1. Rollback: Go to Cloudflare Pages > Deployments > Rollback to previous
2. Debug: Check logs at Cloudflare Dashboard > Pages > Functions > Real-time logs
3. Quick fix: Make changes, push to GitHub (auto-deploys)

---

**READY TO GO LIVE?** 
Just add your domain in Cloudflare Pages Dashboard and you're set! 🎉