# Merge and Deployment Guide

## Current Status
- **Branch**: `implement-stage-one`
- **Target**: `main`
- **Repository**: techtribe01/Employee-Tracker-Skillarion

## Option 1: Force Merge via Command Line

If GitHub UI shows merge errors, use git commands:

```bash
# 1. Clone the repository (if not already cloned)
git clone https://github.com/techtribe01/Employee-Tracker-Skillarion.git
cd Employee-Tracker-Skillarion

# 2. Fetch all branches
git fetch origin

# 3. Checkout main branch
git checkout main

# 4. Merge implement-stage-one into main
git merge origin/implement-stage-one

# 5. If there are conflicts, resolve them and commit
git add .
git commit -m "Merge implement-stage-one into main"

# 6. Push to GitHub
git push origin main
```

## Option 2: Create New PR with Specific Base

1. Go to: https://github.com/techtribe01/Employee-Tracker-Skillarion/compare
2. Select:
   - **Base**: `main`
   - **Compare**: `implement-stage-one`
3. Click "Create Pull Request"
4. Add title: "Merge Phase 1-6 Implementation with Logo and Auth Updates"
5. Click "Create Pull Request" → "Merge Pull Request"

## Option 3: Direct Push to Main (Use with caution)

If you have the repository locally with all changes:

```bash
# Ensure you're on implement-stage-one with all changes
git checkout implement-stage-one
git pull origin implement-stage-one

# Force push to main (WARNING: This overwrites main)
git checkout main
git reset --hard implement-stage-one
git push origin main --force
```

## Option 4: Download and Re-upload

1. Download the v0 project as ZIP from the UI
2. Extract and initialize new git repo
3. Push to main branch directly

## After Successful Merge

### Deploy to Vercel:

1. **Connect Repository to Vercel**:
   - Visit https://vercel.com/new
   - Import `techtribe01/Employee-Tracker-Skillarion`
   - Select `main` branch
   - Click "Deploy"

2. **Set Environment Variables** in Vercel Dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Redeploy** after adding environment variables

## Troubleshooting Common Merge Errors

### Error: "Merge conflict"
- Manually resolve conflicts in GitHub UI
- Or use command line merge with conflict resolution

### Error: "Protected branch"
- Check repository settings → Branches
- Temporarily disable branch protection
- Merge, then re-enable protection

### Error: "Review required"
- Add reviewers to the PR
- Or remove review requirements temporarily

### Error: "Checks must pass"
- Check GitHub Actions/CI logs
- Fix any failing tests
- Or temporarily disable status checks

## Verify Deployment

After merging and deploying:

1. Visit your Vercel deployment URL
2. Test login with: `manoj@skillariondevelopment.in` / `TechTribe01`
3. Verify logo appears correctly
4. Check all Phase 1-6 features

## Latest Changes Included

- ✅ SkillArion Development logo with proper branding
- ✅ Company name color styling (#1E2058 and #AF9457)
- ✅ Password reset functionality
- ✅ Fixed login redirect issues
- ✅ Phase 1-6 complete implementations
- ✅ Production deployment infrastructure
- ✅ Monitoring and security features
