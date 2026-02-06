import { useSession } from "@/context/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View, 
  Switch, 
  useColorScheme, 
  Platform, 
  Image, 
  Modal, 
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  IconUser,
  IconMail,
  IconLock,
  IconPalette,
  IconLanguage,
  IconBell,
  IconLogout,
  IconChevronRight,
  IconMoon,
  IconSun,
  IconCamera,
  IconX,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react-native";
import ThemedIcon from "@/components/ThemedIcon";
import { useTheme } from "@react-navigation/native";
import { changePassword } from "@/lib/firebase-service";

interface SectionItem {
  id: string;
  title: string;
  icon: typeof IconUser | typeof IconMail | typeof IconLock | typeof IconPalette | typeof IconLanguage | typeof IconBell | typeof IconLogout | typeof IconMoon | typeof IconSun | typeof IconChevronRight;
  value?: string | React.ReactNode;
  action?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
}

interface Section {
  title: string;
  data: SectionItem[];
}

const flags = [
  { lang: "es-MX", name: "Español" },
  { lang: "en-US", name: "English" },
];

const Profile = () => {
  // ============================================================================
  // Hooks
  // ============================================================================
  const { signOut, user } = useSession();
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language;
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Password change modal state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  
  // Refs for text inputs
  const confirmPasswordRef = useRef<TextInput>(null);

  // ============================================================================
  // Effects
  // ============================================================================
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem("language");
      if (savedLanguage) {
        i18n.changeLanguage(savedLanguage);
      }
    };
    loadLanguage();
  }, [i18n]);

  // ============================================================================
  // Handlers
  // ============================================================================
  const handleLogout = async () => {
    await signOut();
    router.replace("/signin");
  };

  const changeLanguage = async (lang: string) => {
    await AsyncStorage.setItem("language", lang);
    i18n.changeLanguage(lang);

    // Update date-fns locale when language changes
    const { updateDateFnsLocale } = require("@/lib/date-fns-config");
    updateDateFnsLocale(lang);
  };

  const handleChangePassword = () => {
    // Open password change modal
    setPasswordModalVisible(true);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };
  
  const handlePasswordSubmit = async () => {
    // Reset error state
    setPasswordError("");
    
    // Validate inputs
    if (!newPassword || !confirmPassword) {
      setPasswordError(t("PasswordFieldsRequired"));
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError(t("PasswordTooShort"));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError(t("PasswordsDoNotMatch"));
      return;
    }
    
    // Submit password change
    try {
      setIsSubmitting(true);
      
      if (!user) {
        throw new Error("No authenticated user");
      }
      
      await changePassword(user, newPassword);
      
      // Success
      setPasswordModalVisible(false);
      Alert.alert(
        t("Success"),
        t("PasswordChangedSuccessfully"),
        [{ text: "OK" }]
      );
    } catch (error: any) {
      // Handle Firebase errors
      console.error("Password change error:", error);
      
      // Check for specific Firebase error codes
      if (error.code === "auth/requires-recent-login") {
        setPasswordError(t("ReauthenticationRequired"));
      } else {
        setPasswordError(error.message || t("PasswordChangeError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleThemeChange = (value: boolean) => {
    setIsDarkMode(value);
    console.log("Theme changed to", value ? "dark" : "light");
  };

  const handleNotificationToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    // Implement notification toggle functionality
    console.log("Notifications", value ? "enabled" : "disabled");
  };

  // ============================================================================
  // Computed Values
  // ============================================================================
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Guest";

  // ============================================================================
  // Section Definitions
  // ============================================================================
  const sections: Section[] = [
    {
      title: "General",
      data: [
        {
          id: "username",
          title: t("username"),
          icon: IconUser,
          value: displayName,
        },
        {
          id: "email",
          title: t("Email"),
          icon: IconMail,
          value: user?.email || t("Not available"),
        },
        {
          id: "password",
          title: t("ChangePassword"),
          icon: IconLock,
          action: handleChangePassword,
        },
      ],
    },
    {
      title: t("Application"),
      data: [
        // {
        //   id: "theme",
        //   title: t("Theme"),
        //   icon: isDarkMode ? IconMoon : IconSun,
        //   toggle: true,
        //   toggleValue: isDarkMode,
        //   onToggleChange: handleThemeChange,
        //   value: isDarkMode ? t("Dark") : t("Light"),
        // },
        {
          id: "language",
          title: t("Language"),
          icon: IconLanguage,
          value: (
            <View className="flex-row">
              {flags.map(({ lang, name }) => (
                <TouchableOpacity
                  key={name}
                  onPressOut={Platform.OS === 'android' ? () => changeLanguage(lang) : undefined}
                  onPress={Platform.OS === 'ios' ? () => changeLanguage(lang) : undefined}
                  className={`px-3 py-1 mx-1 rounded-full ${currentLanguage === lang ? "bg-primary" : "bg-muted"}`}
                >
                  <Text className={`${currentLanguage === lang ? "text-primary-foreground" : "text-muted-foreground"} font-medium`}>
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ),
        },
        {
          id: "notifications",
          title: t("Notifications"),
          icon: IconBell,
          toggle: true,
          toggleValue: notificationsEnabled,
          onToggleChange: handleNotificationToggle,
        },
      ],
    },
    {
      title: "",
      data: [
        {
          id: "signout",
          title: t("SignOut"),
          icon: IconLogout,
          action: handleLogout,
        },
      ],
    },
  ];

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="px-4 py-6 mb-8">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-20 h-20 rounded-full bg-muted overflow-hidden border-2 border-primary">
                <Image 
                  source={{ uri: user?.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) }} 
                  className="w-full h-full"
                />
              </View>
              <TouchableOpacity 
                className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5"
                onPressOut={() => console.log('Change avatar')}
              >
                <ThemedIcon icon={IconCamera} size={14} />
              </TouchableOpacity>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-2xl font-bold text-primary">
                {displayName}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Sections */}
        <View className="px-4">
          {sections.map((section, sectionIndex) => (
            <View key={`section-${sectionIndex}`} className="mb-8">
              {section.title && (
                <Text className="text-xs font-medium uppercase text-muted-foreground mb-4 px-2">
                  {section.title}
                </Text>
              )}
              <View className="rounded-xl border border-muted-foreground/20 bg-card overflow-hidden shadow-sm">
                {section.data.map((item, itemIndex) => (
                  <View key={item.id}>
                    <TouchableOpacity
                      onPressOut={Platform.OS === 'android' ? item.action : undefined}
                      onPress={Platform.OS === 'ios' ? item.action : undefined}
                      disabled={!item.action && !item.toggle}
                      className="py-3 px-4 flex-row items-center"
                    >
                      {/* Icon at the left */}
                      <View className="w-8 justify-center items-center">
                        <ThemedIcon icon={item.icon} size={16} />
                      </View>
                      
                      {/* Value & Title in the middle */}
                      <View className="flex-col flex-1 ml-2">
                        {typeof item.value === "string" ? (
                          <>
                            <Text className="text-primary font-medium">{item.value}</Text>
                            <Text className="text-muted-foreground text-xs">{item.title}</Text>
                          </>
                        ) : (
                          <Text className="text-primary font-medium">{item.title}</Text>
                        )}
                      </View>
                      
                      {/* Toggle or arrow at the right */}
                      {typeof item.value !== "string" && !item.toggle && !item.action && item.value}
                      {item.toggle && (
                        <Switch
                          value={item.toggleValue}
                          onValueChange={item.onToggleChange}
                          trackColor={{ false: "#d1d5db", true: "#0F1729" }}
                        />
                      )}
                      {item.action && !item.toggle && <Text className="text-gray-400 ml-2">›</Text>}
                    </TouchableOpacity>
                    {itemIndex < section.data.length - 1 && (
                      <View className="h-px bg-muted-foreground/10 ml-12" />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* Password Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={closePasswordModal}
      >
        <TouchableWithoutFeedback onPressOut={Platform.OS === 'android' ? Keyboard.dismiss : undefined} onPress={Platform.OS === 'ios' ? Keyboard.dismiss : undefined}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-background rounded-t-3xl p-6 pb-8">
              <View className="flex-row justify-start items-center mb-6">
              <TouchableOpacity
                  onPressOut={Platform.OS === 'android' ? closePasswordModal : undefined}
                  onPress={Platform.OS === 'ios' ? closePasswordModal : undefined}
                  className="p-2"
                >
                  <ThemedIcon icon={IconX} size={20} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-primary">
                  {t("ChangePassword")}
                </Text>
              </View>
              
              {/* Error message */}
              {passwordError ? (
                <View className="bg-red-100 border border-red-400 rounded p-3 mb-4">
                  <Text className="text-red-800">{passwordError}</Text>
                </View>
              ) : null}
              
              {/* New Password Input */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2">
                  {t("NewPassword")}
                </Text>
                <View className="flex-row items-center border border-border rounded-lg bg-card overflow-hidden">
                  <TextInput
                    className="flex-1 py-3 px-4 text-primary"
                    placeholder={t("EnterNewPassword")}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  />
                  <TouchableOpacity 
                    onPressOut={Platform.OS === 'android' ? () => setShowPassword(!showPassword) : undefined}
                    onPress={Platform.OS === 'ios' ? () => setShowPassword(!showPassword) : undefined}
                    className="px-4"
                  >
                    <ThemedIcon icon={showPassword ? IconEyeOff : IconEye} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Confirm Password Input */}
              <View className="mb-6">
                <Text className="text-sm text-muted-foreground mb-2">
                  {t("ConfirmPassword")}
                </Text>
                <View className="flex-row items-center border border-border rounded-lg bg-card overflow-hidden">
                  <TextInput
                    ref={confirmPasswordRef}
                    className="flex-1 py-3 px-4 text-primary"
                    placeholder={t("ConfirmNewPassword")}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handlePasswordSubmit}
                  />
                </View>
              </View>
              
              {/* Submit Button */}
              <TouchableOpacity
                onPressOut={Platform.OS === 'android' ? handlePasswordSubmit : undefined}
                onPress={Platform.OS === 'ios' ? handlePasswordSubmit : undefined}
                disabled={isSubmitting}
                className={`py-3 px-4 rounded-lg ${isSubmitting ? 'bg-primary/70' : 'bg-primary'} flex-row justify-center items-center`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-primary-foreground font-medium">
                    {t("UpdatePassword")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;