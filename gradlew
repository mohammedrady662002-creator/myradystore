#!/usr/bin/env bash
# Root proxy for Gradle with auto-recovery for corrupt wrapper jar
WRAPPER_DIR="android/gradle/wrapper"
WRAPPER_JAR="$WRAPPER_DIR/gradle-wrapper.jar"

if [ ! -f "$WRAPPER_JAR" ] || [ ! -s "$WRAPPER_JAR" ]; then
  echo "Gradle wrapper jar missing or corrupt. Attempting to download from a reliable binary mirror..."
  mkdir -p "$WRAPPER_DIR"
  # Using a direct link to the binary jar from a reliable source
  curl -L "https://raw.githubusercontent.com/gradle/gradle/v8.2.0/gradle/wrapper/gradle-wrapper.jar" -o "$WRAPPER_JAR"
  
  # Check if downloaded file is actually a jar (should be around 50-70kb)
  # If it failed or is too small/large, use the Maven central backup
  SIZE=$(wc -c <"$WRAPPER_JAR")
  if [ "$SIZE" -lt 50000 ] || [ "$SIZE" -gt 70000 ]; then
    echo "Download from GitHub failed or returned incorrect file. Trying Maven Central backup..."
    curl -L "https://repo1.maven.org/maven2/com/android/tools/build/gradle/8.1.0/gradle-8.1.0.jar" -o "$WRAPPER_JAR" || \
    curl -L "https://services.gradle.org/distributions/gradle-8.2-bin.zip" -o "gradle-dist.zip"
  fi
fi

if [ ! -f "$WRAPPER_JAR" ] || [ ! -s "$WRAPPER_JAR" ]; then
  echo "Error: Could not download gradle-wrapper.jar. Build may fail."
fi

# Ensure android/gradlew is executable
chmod +x android/gradlew 2>/dev/null || true

sh android/gradlew "$@"
