# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Hide source file attributes
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable

# Capacitor core and plugin protections
-keep public class * extends com.getcapacitor.BridgeActivity { *; }
-keep public class com.yazri.focus.MainActivity { *; }
-keep public class * extends com.getcapacitor.Plugin
-keep public class com.getcapacitor.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-dontwarn com.getcapacitor.**

# Foreground Service plugin
-keep class io.capawesome.capacitorjs.plugins.foregroundservice.** { *; }
