#!/bin/bash

# Simple audio test to verify hooks are working
echo "🔊 Hook test: Audio system active"

# Test if say command works
if command -v say >/dev/null 2>&1; then
    say -v Samantha -r 175 "Hook system active" &
    echo "✅ Audio: Hook system working"
else
    echo "❌ Audio: say command not available"
fi

# Log hook execution
echo "$(date): Hook executed" >> data/hook-test.log

exit 0