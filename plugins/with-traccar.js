const fs = require("fs");
const path = require("path");
const { withDangerousMod, withProjectBuildGradle } = require("expo/config-plugins");

/**
 * react-native-traccar-client-sdk is built with a newer Kotlin than React Native pins: the host build has to skip the
 * Kotlin metadata version check (see the module's "Android build setup"). Added to the root android/build.gradle on
 * every prebuild, so it survives the native folders being regenerated.
 */
const MARK = "// traccar-client-sdk: skip the Kotlin metadata version check";
const BLOCK = `
${MARK}
allprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        compilerOptions {
            freeCompilerArgs.add("-Xskip-metadata-version-check")
        }
    }
}
`;

const withAndroid = (config) =>
  withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language === "groovy" && !cfg.modResults.contents.includes(MARK)) {
      cfg.modResults.contents += BLOCK;
    }
    return cfg;
  });

/**
 * The pod lists everything under ios/ as a source file, headers inside the prebuilt TraccarClientSDK.xcframework
 * included (one copy per slice), and Xcode refuses to build with "Multiple commands produce ...TraccarClientSDK.h".
 * The framework brings its own headers, so those copies are taken out of the pod's header phase after pod install.
 */
const PODFILE_MARK = "# traccar-client-sdk: keep the xcframework headers out of the pod's header phase";
const PODFILE_FIX = `
    ${PODFILE_MARK}
    installer.pods_project.targets.each do |target|
      next unless target.name == 'react-native-traccar-client-sdk'
      target.headers_build_phase.files.to_a.each do |file|
        file.remove_from_project if file.file_ref && file.file_ref.real_path.to_s.include?('.xcframework')
      end
    end
`;

const withIos = (config) =>
  withDangerousMod(config, [
    "ios",
    (cfg) => {
      const file = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      const text = fs.readFileSync(file, "utf8");
      if (!text.includes(PODFILE_MARK)) {
        // right after the post_install block opens, so the Pods project is still being configured
        fs.writeFileSync(file, text.replace(/post_install do \|installer\|\n/, (m) => m + PODFILE_FIX));
      }
      return cfg;
    },
  ]);

module.exports = (config) => withIos(withAndroid(config));
