#!/usr/bin/env bash
# Root proxy for Gradle with auto-recovery for corrupt wrapper jar
WRAPPER_DIR="android/gradle/wrapper"
WRAPPER_JAR="$WRAPPER_DIR/gradle-wrapper.jar"

if [ ! -f "$WRAPPER_JAR" ] || [ ! -s "$WRAPPER_JAR" ]; then
  echo "Gradle wrapper jar missing or empty. Attempting to download..."
  mkdir -p "$WRAPPER_DIR"
  # Try curl then wget
  curl -L https://github.com/gradle/gradle/raw/v8.2.0/gradle/wrapper/gradle-wrapper.jar -o "$WRAPPER_JAR" || \
  wget -O "$WRAPPER_JAR" https://github.com/gradle/gradle/raw/v8.2.0/gradle/wrapper/gradle-wrapper.jar
fi

if [ ! -f "$WRAPPER_JAR" ] || [ ! -s "$WRAPPER_JAR" ]; then
  echo "Error: Could not download gradle-wrapper.jar. Build may fail."
fi

# Ensure android/gradlew is executable
chmod +x android/gradlew 2>/dev/null || true

sh android/gradlew "$@"
