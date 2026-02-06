import { useEffect, useState } from "react";
import { 
  SafeAreaView, 
  Text, 
  View, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Platform,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
  Dimensions,
  Pressable
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { Image as ImageExpoComponent } from "expo-image";
import { ImagePickerAsset } from "expo-image-picker";
import { IconCamera, IconTrash, IconPlus, IconX } from "@tabler/icons-react-native";
import ThemedIcon from "@/components/ThemedIcon";
import { storageService } from "@/services/storage/api";
import { WorkOrder } from "@/services/appointments/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppointmentByIdQueryOptions } from "@/services/appointments/queries";
import { useUpdateAppointmentMutation } from "@/services/appointments/mutations";
import ToggleIcon from "@/components/ToggleIcon";

type Appointment = WorkOrder;

export default function WorkOrderFindings() {
  const { id } = useLocalSearchParams() as { id: string };
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: appointment, isFetched} = useQuery(useAppointmentByIdQueryOptions(id)) as { data: Appointment, isFetched: boolean };
  const updateAppointmentMutation = useUpdateAppointmentMutation();

  // State for notes and images
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<ImagePickerAsset[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (isFetched) {
      const uploadedImages = appointment?.findings?.images || [];
      uploadedImages.map(async (image) => {
        const asset = await ImageExpoComponent.loadAsync(image);
        const imageAsset: ImagePickerAsset = {
          uri: image,
          width: asset.width,
          height: asset.height,
          type: "image",
          fileName: image,
        };
        setImages((prevImages) => [...prevImages, imageAsset]);
      });
      const uploadedNotes = appointment?.findings?.notes || "";
      setNotes(uploadedNotes);
    }
  }, [isFetched]);

  // Request permission and take a picture
  const takePicture = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert(
        t("Permission required"),
        t("Camera permission is required to take pictures"),
        [{ text: t("OK") }]
      );
      return;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0]]);
    }
  };
  
  // Select image from library
  const pickImage = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert(
        t("Permission required"),
        t("Media library permission is required to select pictures"),
        [{ text: t("OK") }]
      );
      return;
    }
    
    // Launch image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0]]);
    }
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    Alert.alert(
      t("Remove image"),
      t("Are you sure you want to remove this image?"),
      [
        { text: t("Cancel"), style: "cancel" },
        { 
          text: t("Remove"), 
          style: "destructive",
          onPress: () => {
            const newImages = [...images];
            newImages.splice(index, 1);
            setImages(newImages);
          }
        }
      ]
    );
  };
  
  // Save findings
  const saveFindings = async () => {
    // Prevent multiple save attempts
    if (isSaving) return;
    
    try {
      // Show loading indicator
      setIsSaving(true);
      
      // 1. Upload all images to Firebase Storage
      let imageUrls: string[] = [];
      if (images.length > 0) {
        // Create a unique path for this finding's images
        const storagePath = `findings/${id}`;
        
        // Upload all images at once and get their download URLs
        imageUrls = await storageService.uploadMultipleImages(images, storagePath);
      }
      
      // 2. Update appointment with findings
      await updateAppointmentMutation.mutateAsync({
        ...appointment,
        findings: {
          notes,
          images: imageUrls,
          measurements: appointment.findings?.measurements || [],
        },
      });

      // 3. invalidate query
      queryClient.invalidateQueries({
        queryKey: ["appointment", id],
      });
      
      setTimeout(() => {
        router.back();
      }, 300);
    } catch (error) {
      
      // Show error message
      Alert.alert(
        t("Error"),
        t("Failed to save findings. Please try again."),
        [{ text: t("OK") }]
      );
    } finally {
      // Hide loading indicator
      setIsSaving(false);
    }
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView 
          className="flex-1"
          contentContainerClassName="pb-24"
          style={{
            paddingTop: Platform.OS === "android" ? 16 : 0,
          }}
        >
          <View className="px-4">
            {/* Notes input */}
            <View className="mb-8 mt-4">
              <View className="rounded-xl border border-muted-foreground/20 bg-card overflow-hidden shadow-sm">
                <TextInput
                  className="p-4 text-primary font-manrope-regular min-h-[120px]"
                  placeholder={t("writeYourFindingsHere")}
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>
            
            {/* Images section */}
            <Text className="text-xs font-manrope-regular uppercase text-muted-foreground mb-4 px-2">
              {t("pictures")}
            </Text>
            
            <View className="flex-row mb-4 gap-2">
              <Pressable 
                onPressOut={Platform.OS === 'android' ? takePicture : null}
                onPress={Platform.OS === 'ios' ? takePicture : null}
                className="flex-row items-center bg-primary rounded-md py-2 px-4"
              >
                <ToggleIcon icon={IconCamera} size={16} active={true} />
                <Text className="text-primary-foreground font-manrope-medium ml-2">{t("takePicture")}</Text>
              </Pressable>
              
              <Pressable 
                onPressOut={Platform.OS === 'android' ? pickImage : null}
                onPress={Platform.OS === 'ios' ? pickImage : null}
                className="flex-row items-center bg-card border border-muted-foreground/20 rounded-md py-2 px-4"
              >
                <ThemedIcon icon={IconPlus} size={16} />
                <Text className="text-primary font-manrope-medium ml-2">{t("fromGallery")}</Text>
              </Pressable>
            </View>
            
            {/* Images gallery */}
            {images.length > 0 ? (
              <View className="mb-8">
                <FlatList
                  data={images}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View className="mr-4 rounded-xl overflow-hidden border border-muted-foreground/20 bg-card shadow-sm">
                      <TouchableOpacity
                        onPressOut={() => Platform.OS === 'android' ? setFullscreenImage(item.uri) : null}
                        onPress={() => Platform.OS === 'ios' ? setFullscreenImage(item.uri) : null}
                        activeOpacity={0.9}
                      >
                        <Image 
                          source={{ uri: item.uri }} 
                          className="w-[200px] h-[150px]" 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPressOut={() => Platform.OS === 'android' ? removeImage(index) : null}
                        onPress={() => Platform.OS === 'ios' ? removeImage(index) : null}
                        className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
                      >
                        <IconTrash size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            ) : (
              <View className="items-center justify-center py-8 mb-8 rounded-xl border border-dashed border-muted-foreground/20">
                <Text className="text-muted-foreground">{t("noimagesaddedyet")}</Text>
              </View>
            )}
            
          </View>
        </ScrollView>
        
        {/* Save button with activity indicator */}
        <View className="bottom-4 left-0 right-0 p-4 bg-background border-t border-muted-foreground/10">
          <TouchableOpacity 
            onPressOut={Platform.OS === 'android' ? saveFindings : undefined}
            onPress={Platform.OS === 'ios' ? saveFindings : undefined}
            disabled={isSaving}
            className="bg-primary py-3 rounded-md flex-row h-16 justify-center items-center"
            style={{ opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-primary-foreground font-manrope-semibold">{t("sharedSave")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      {/* Fullscreen Image Modal */}
      <Modal
        visible={fullscreenImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={{ flex: 1, backgroundColor: 'black' }}
          onPressOut={() => Platform.OS === 'android' ? setFullscreenImage(null) : null}
          onPress={() => Platform.OS === 'ios' ? setFullscreenImage(null) : null}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <TouchableOpacity
              onPressOut={() => Platform.OS === 'android' ? setFullscreenImage(null) : null}
              onPress={() => Platform.OS === 'ios' ? setFullscreenImage(null) : null}
              style={{ 
                position: 'absolute', 
                top: 40, 
                right: 20, 
                zIndex: 10,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 20,
                padding: 8
              }}
            >
              <IconX size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {fullscreenImage && (
                <TouchableOpacity
                  activeOpacity={1}
                  onPressOut={Platform.OS === 'android' ? (e) => {
                    // Prevent click from bubbling to parent
                    e.stopPropagation();
                    // Still allow tap to close
                    setFullscreenImage(null);
                  } : undefined}
                  onPress={Platform.OS === 'ios' ? (e) => {
                    // Prevent click from bubbling to parent
                    e.stopPropagation();
                    // Still allow tap to close
                    setFullscreenImage(null);
                  } : undefined}
                >
                  <Image
                    source={{ uri: fullscreenImage }}
                    style={{
                      width: screenWidth,
                      height: screenHeight * 0.8,
                      resizeMode: 'contain'
                    }}
                  />
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

