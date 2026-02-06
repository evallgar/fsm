import {
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppointmentByIdQueryOptions } from "@/services/appointments/queries";
import { useUpdateAppointmentMutation } from "@/services/appointments/mutations";
import { WorkOrder, Material } from "@/services/appointments/interfaces";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import {
  IconTrash,
  IconPlus,
  IconDeviceFloppy,
  IconX,
  IconUserStar,
  IconUserPin,
  IconBuildingCog,
} from "@tabler/icons-react-native";
import ThemedIcon from "@/components/ThemedIcon";
// Using a string-based UUID generator since we don't have @types/uuid
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function WorkOrderSpareParts() {
  const { id } = useLocalSearchParams() as { id: string };
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const queryClient = useQueryClient();

  // State for materials list and modal
  const [materials, setMaterials] = useState<Material[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Material>({
    id: generateUUID(),
    name: "",
    quantity: 1,
    unit: "",
    notes: "",
    providedByUser: true,
    providedByCustomer: false,
  });

  // Query to get the WorkOrder data
  const {
    data: workOrder,
    isFetching,
    isError,
  } = useQuery(useAppointmentByIdQueryOptions(id)) as {
    data: WorkOrder;
    isFetching: boolean;
    isError: boolean;
  };

  // Mutation to update the WorkOrder
  const updateAppointmentMutation = useUpdateAppointmentMutation();

  // Initialize materials from workOrder data
  useEffect(() => {
    console.log("workorder data: ", workOrder);
    if (workOrder?.materials) {
      setMaterials(workOrder.materials);
    }
  }, [workOrder]);

  // Add a new material to the list
  const addMaterial = () => {
    // Validate required fields
    if (!newMaterial.name || newMaterial.name.trim() === "") {
      Alert.alert(t("errorTitle"), t("MaterialNameRequired"));
      return;
    }

    // Ensure quantity is a positive number
    if (newMaterial.quantity <= 0) {
      Alert.alert(t("errorTitle"), t("QuantityGreaterThanZero"));
      return;
    }

    // Add the new material to the list
    setMaterials([...materials, newMaterial]);

    // Reset the form
    setNewMaterial({
      id: generateUUID(),
      name: "",
      quantity: 1,
      unit: "",
      notes: "",
      providedByUser: true,
      providedByCustomer: false,
    });

    // Close the modal
    setModalVisible(false);
  };

  // Remove a material from the list
  const removeMaterial = (materialId: string) => {
    // Confirm before removing
    Alert.alert(
      t("Confirm"),
      t("AreYouSureYouWantToRemoveThisMaterial"),
      [
        { text: t("sharedCancel"), style: "cancel" },
        {
          text: t("sharedRemove"),
          style: "destructive",
          onPress: () => {
            setMaterials(
              materials.filter((material) => material.id !== materialId)
            );
          },
        },
      ]
    );
  };

  // Save materials to the WorkOrder
  const saveMaterials = async () => {
    if (!workOrder) return;

    // Confirm if there are no materials
    if (materials.length === 0) {
      Alert.alert(
        t("Confirm"),
        t("NoMaterialsAddedConfirmation"),
        [
          { text: t("sharedCancel"), style: "cancel" },
          { text: t("SaveConfirm"), onPress: () => saveWorkOrder() },
        ]
      );
      return;
    }

    // If there are materials, save directly
    saveWorkOrder();
  };

  // Helper function to save the work order
  const saveWorkOrder = async () => {
    try {
      await updateAppointmentMutation.mutateAsync({
        ...workOrder,
        materials: materials,
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ["appointment", id] });

      // Show success message
      Alert.alert(t("Success"), t("MaterialSaved"));

      // Navigate back
      router.back();
    } catch (error) {
      console.error("Error saving materials:", error);
      Alert.alert(t("errorTitle"), t("MaterialSaveError"));
    }
  };

  // Loading state
  if (isFetching) {
    return (
      <SafeAreaView className="flex-1 p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Skeleton className="h-8 w-40" />
        </View>
        <View className="mb-4">
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-4">
        <Text className="text-destructive text-lg mb-4">
          {t("ErrorLoadingData")}
        </Text>
        <Button
          label={t("GoBack")}
          variant="secondary"
          onPressOut={Platform.OS === 'android' ? () => router.back() : undefined}
          onPress={Platform.OS === 'ios' ? () => router.back() : undefined}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
        style={{
          paddingTop: Platform.OS === "android" ? 16 : 0,
        }}
      >
        {/* Materials List */}
        <View className="mb-4 px-4">
          {materials.length === 0 ? (
            <View className="bg-card rounded-lg p-4 mb-4 items-center justify-center">
              <Text className="text-muted-foreground">
                {t("NoMaterials")}
              </Text>
            </View>
          ) : (
            <View className="mb-4">
              <Text className="text-xs font-manrope-regular uppercase text-muted-foreground mb-4 px-2">
                {t("Materials")}
              </Text>

              {materials.length > 0 ? (
                <View className="rounded-xl border border-muted-foreground/20 bg-card overflow-hidden shadow-sm">
                  {materials.map((material, itemIndex) => (
                    <View key={material.id}>
                      <View className="py-3 px-4 flex-row items-center">
                        {/* Icon at the left */}
                        <View className="w-8 justify-center items-center">
                          {material.providedByCustomer ? (
                            <ThemedIcon icon={IconUserStar} size={16} />
                          ) : material.providedByUser ? (
                            <ThemedIcon icon={IconUserPin} size={16} />
                          ) : (
                            <ThemedIcon icon={IconBuildingCog} size={16} />
                          )}
                        </View>

                        {/* Material info in the middle */}
                        <View className="flex-col flex-1 ml-2">
                          <Text className="text-primary font-manrope-regular">
                            {material.name}
                          </Text>
                          <Text className="text-muted-foreground text-xs font-manrope-regular">
                            {material.quantity} {material.unit || ""}
                          </Text>
                          {material.notes && (
                            <Text className="text-muted-foreground text-xs mt-1">
                              {material.notes}
                            </Text>
                          )}
                          <Text className="text-muted-foreground text-xs mt-1">
                            {material.providedByCustomer
                              ? t("ProvidedByCustomer")
                              : material.providedByUser
                              ? t("ProvidedByUser")
                              : t("ProvidedByOffice")}
                          </Text>
                        </View>

                        {/* Delete button */}
                        <TouchableOpacity
                          onPressOut={Platform.OS === 'android' ? () => removeMaterial(material.id) : undefined}
                          onPress={Platform.OS === 'ios' ? () => removeMaterial(material.id) : undefined}
                          className="p-2"
                        >
                          <ThemedIcon
                            icon={IconTrash}
                            size={16}
                            className="opacity-50"
                          />
                        </TouchableOpacity>
                      </View>
                      {itemIndex < materials.length - 1 && (
                        <View className="h-px bg-muted-foreground/10 ml-4" />
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View className="rounded-xl border border-muted-foreground/20 bg-card p-4 items-center justify-center">
                  <Text className="text-muted-foreground">
                    {t("NoMaterials")}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Add Material Button */}
          <View className="mb-4">
            <TouchableOpacity
              onPressOut={Platform.OS === 'android' ? () => setModalVisible(true) : undefined}
              onPress={Platform.OS === 'ios' ? () => setModalVisible(true) : undefined}
              disabled={updateAppointmentMutation.isPending}
              className="bg-card py-3 rounded-md flex-row justify-center items-center"
              style={{ opacity: updateAppointmentMutation.isPending ? 0.7 : 1 }}
            >
              {updateAppointmentMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <View className="flex-row items-center">
                  <ThemedIcon icon={IconPlus} size={20} />
                  <Text className="text-primary font-manrope-semibold">
                    {t("AddMaterial")}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Save button with activity indicator */}
          <View className="bottom-4 left-0 right-0 p-4 bg-background border-t border-muted-foreground/10">
            <TouchableOpacity
              onPressOut={Platform.OS === 'android' ? () => saveMaterials() : undefined}
              onPress={Platform.OS === 'ios' ? () => saveMaterials() : undefined}
              disabled={updateAppointmentMutation.isPending}
              className="bg-primary py-3 rounded-md flex-row justify-center items-center"
              style={{ opacity: updateAppointmentMutation.isPending ? 0.7 : 1 }}
            >
              {updateAppointmentMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-primary-foreground font-manrope-semibold">
                  {t("sharedSave")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Add Material Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <TouchableWithoutFeedback onPressOut={Platform.OS === 'android' ? () => Keyboard.dismiss : undefined} onPress={Platform.OS === 'ios' ? () => Keyboard.dismiss : undefined}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-4 pb-8">
            <View className="flex-row justify-start items-center mb-4">
              <TouchableOpacity
                onPressOut={Platform.OS === 'android' ? () => {
                  setModalVisible(false);
                } : undefined}
                onPress={Platform.OS === 'ios' ? () => {
                  setModalVisible(false);
                } : undefined}
                className="p-2"
              >
                <ThemedIcon icon={IconX} size={24} />
              </TouchableOpacity>
              <Text className="text-lg text-primary font-manrope-semibold">
                {t("AddMaterialDetails")}
              </Text>
            </View>

            <Text className="font-manrope-regular text-xs text-muted-foreground mb-1">{t("sharedName")}</Text>
            <TextInput
              className={`bg-card border border-muted-foreground/30 h-16 p-3 text-primary rounded-md mb-3`}
              placeholder={t("MaterialName")}
              value={newMaterial.name}
              onChangeText={(text) =>
                setNewMaterial({ ...newMaterial, name: text })
              }
            />

            <View className="flex-row mb-3">
              <View className="flex-1 mr-2">
                <Text className="font-manrope-regular text-xs text-muted-foreground mb-1">
                  {t("Quantity")}
                </Text>
                <TextInput
                  className={`bg-card border border-muted-foreground/30 h-16 p-3 text-primary rounded-md mb-3`}
                  placeholder="1"
                  keyboardType="numeric"
                  value={newMaterial.quantity.toString()}
                  onChangeText={(text) =>
                    setNewMaterial({
                      ...newMaterial,
                      quantity: Number(text) || 1,
                    })
                  }
                />
              </View>
              <View className="flex-1 ml-2">
                <Text className="font-manrope-regular text-xs text-muted-foreground mb-1">{t("Unit")}</Text>
                <TextInput
                  className={`bg-card border border-muted-foreground/30 h-16 p-3 text-primary rounded-md mb-3`}
                  placeholder={t("unitPlaceholder")}
                  value={newMaterial.unit}
                  onChangeText={(text) =>
                    setNewMaterial({ ...newMaterial, unit: text })
                  }
                />
              </View>
            </View>

            <Text className="font-manrope-regular text-xs text-muted-foreground mb-1">{t("Notes")}</Text>
            <TextInput
              className={`bg-card border border-muted-foreground/30 h-16 p-3 text-primary rounded-md mb-3`}
              placeholder={t("AddMaterialDetails")}
              multiline
              numberOfLines={3}
              value={newMaterial.notes}
              onChangeText={(text) =>
                setNewMaterial({ ...newMaterial, notes: text })
              }
            />

            <View className="flex-row justify-between mb-3">
              <Text className="font-manrope-regular text-sm text-muted-foreground mb-1">
                {t("ProvidedByUser")}
              </Text>
              <TouchableOpacity
                onPressOut={Platform.OS === 'android' ? () =>
                  setNewMaterial({
                    ...newMaterial,
                    providedByUser: !newMaterial.providedByUser,
                  }) : undefined}
                onPress={Platform.OS === 'ios' ? () =>
                  setNewMaterial({
                    ...newMaterial,
                    providedByUser: !newMaterial.providedByUser,
                  }) : undefined}
              >
                <View
                  className={`w-6 h-6 rounded ${
                    newMaterial.providedByUser
                      ? "border border-primary"
                      : "border border-muted-foreground"
                  } items-center justify-center`}
                >
                  {newMaterial.providedByUser && (
                    <Text className="text-primary">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between mb-5">
              <Text className="font-manrope-regular text-sm text-muted-foreground mb-1">
                {t("ProvidedByCustomer")}
              </Text>
              <TouchableOpacity
                onPressOut={Platform.OS === 'android' ? () =>
                  setNewMaterial({
                    ...newMaterial,
                    providedByCustomer: !newMaterial.providedByCustomer,
                  }) : undefined}
                onPress={Platform.OS === 'ios' ? () =>
                  setNewMaterial({
                    ...newMaterial,
                    providedByCustomer: !newMaterial.providedByCustomer,
                  }) : undefined}
              >
                <View
                  className={`w-6 h-6 rounded ${
                    newMaterial.providedByCustomer
                      ? "border border-primary"
                      : "border border-muted-foreground"
                  } items-center justify-center`}
                >
                  {newMaterial.providedByCustomer && (
                    <Text className="text-primary">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View className="flex-row">
              <Button
                label={t("sharedCancel")}
                variant="secondary"
                className="flex-1 mr-2"
                onPressOut={Platform.OS === 'android' ? () => setModalVisible(false) : undefined}
                onPress={Platform.OS === 'ios' ? () => setModalVisible(false) : undefined}
              />
              <Button
                label={t("sharedAdd")}
                variant="default"
                className="flex-1 ml-2"
                onPressOut={Platform.OS === 'android' ? () => addMaterial() : undefined}
                onPress={Platform.OS === 'ios' ? () => addMaterial() : undefined}
              />
            </View>
          </View>
        </View>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    padding: 24,
    flex: 1,
    justifyContent: 'space-around',
  },
  header: {
    fontSize: 36,
    marginBottom: 48,
  },
  textInput: {
    height: 40,
    borderColor: '#000000',
    borderBottomWidth: 1,
    marginBottom: 36,
  },
  btnContainer: {
    backgroundColor: 'white',
    marginTop: 12,
  },
});