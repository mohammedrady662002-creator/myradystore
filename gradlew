#!/usr/bin/env bash
# Root proxy for Gradle with auto-recovery for corrupt wrapper jar
WRAPPER_DIR="android/gradle/wrapper"
WRAPPER_JAR="$WRAPPER_DIR/gradle-wrapper.jar"

if [ ! -f "$WRAPPER_JAR" ] || [ ! -s "$WRAPPER_JAR" ]; then
  echo "Gradle wrapper jar missing or empty. Attempting to download from official Gradle services..."
  mkdir -p "$WRAPPER_DIR"
  curl -L "https://services.gradle.org/distributions/gradle-8.2-bin.zip" -o "gradle-dist.zip"
  # Since we only need the jar, we'll try to get it from a reliable mirror or direct link
  curl -L "https://raw.githubusercontent.com/gradle/gradle/v8.2.0/gradle/wrapper/gradle-wrapper.jar" -o "$WRAPPER_JAR"
fi

if [ ! -f "$WRAPPER_JAR" ] || [ ! -s "$WRAPPER_JAR" ]; then
  echo "Error: Could not download gradle-wrapper.jar. Build may fail."
fi

# Ensure android/gradlew is executable
chmod +x android/gradlew 2>/dev/null || true

sh android/gradlew "$@"
