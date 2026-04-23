#!/usr/bin/env bash
# Simple proxy to android/gradlew
# Capacitor environment should handle the distribution
chmod +x android/gradlew 2>/dev/null || true
sh android/gradlew "$@"
