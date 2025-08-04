#!/bin/bash

# Script to commit each modified file individually with descriptive commit messages
# This will create multiple git contributions

echo "Starting individual file commits..."

# Add and commit package.json
git add package.json
git commit -m "feat: add schedule package dependency for cron jobs"

# Add and commit package-lock.json
git add package-lock.json
git commit -m "feat: update package-lock with nestjs schedule deps"

# Add and commit app.module.ts
git add src/app.module.ts
git commit -m "feat: configure ScheduleModule for cron tasks"

# Add and commit main.ts
git add src/main.ts
git commit -m "feat: add startup hook for expired requests cleanup"

# Add and commit buyer-requests module
git add src/modules/buyer-requests/buyer-requests.module.ts
git commit -m "feat: integrate scheduler service in buyer requests module"

# Add and commit buyer-requests controller
git add src/modules/buyer-requests/controllers/buyer-requests.controller.ts
git commit -m "feat: add close endpoint for buyer requests"

# Add and commit buyer-requests service
git add src/modules/buyer-requests/services/buyer-requests.service.ts
git commit -m "feat: implement manual close request functionality"

# Add and commit scheduler service (new file)
git add src/modules/buyer-requests/services/buyer-request-scheduler.service.ts
git commit -m "feat: create auto-expire scheduler for buyer requests"

# Add and commit controller tests
git add src/modules/buyer-requests/tests/buyer-requests.controller.spec.ts
git commit -m "test: add tests for close request endpoint"

# Add and commit service tests
git add src/modules/buyer-requests/tests/buyer-requests.service.spec.ts
git commit -m "test: add comprehensive tests for close request method"

# Add and commit scheduler service tests (new file)
git add src/modules/buyer-requests/tests/buyer-request-scheduler.service.spec.ts
git commit -m "test: add scheduler service tests with error handling"

# Add and commit the script itself
git add commit_files.sh
git commit -m "feat: add script for individual file commits"

echo "All files committed individually!"
echo "Total commits created: 12"

# Show recent commit history
echo ""
echo "Recent commit history:"
git log --oneline -15