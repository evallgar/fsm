import {
  TouchableOpacity,
  Text,
  View,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MIN_SIGNATURE_LENGTH, signatureLength } from "@/lib/signature";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkOrderPoint } from "@/services/appointments/use-work-order-point";
import { useAppointmentByIdQueryOptions } from "@/services/appointments/queries";
import { Skeleton } from "@/components/Skeleton";
import { useTranslation } from "react-i18next";
import ThemedIcon from "@/components/ThemedIcon";
import * as TablerIcons from "@tabler/icons-react-native";
import { formatDate } from "@/lib/date-fns-config";
import { useState, useRef, useEffect } from "react";
import ToggleIcon from "@/components/ToggleIcon";
import SignatureCanvas from "react-native-signature-canvas";
import { storageService } from "@/services/storage/api";
import { appointments } from "@/services/appointments/api";
import { WorkOrder } from "@/services/appointments/interfaces";
import { format } from "date-fns";


type Appointment = WorkOrder;
type Section = {
  title: string;
  data: {
    id: string;
    title: string;
    icon?: TablerIcons.Icon;
    value?: string | (() => string);
    link?: string | false;
    params?: Record<string, string>;
    /** a tap runs this (and the row shows a pencil) instead of opening a screen */
    action?: () => void;
  }[];
};
const AppointmentDetails = () => {
  const { id } = useLocalSearchParams() as { id: string };
  const queryClient = useQueryClient();
  const { data, isFetching, isError } = useQuery(
    useAppointmentByIdQueryOptions(id)
  ) as { data: Appointment; isFetching: boolean; isError: boolean };

  const { t } = useTranslation();
  // the sheets reach the bottom of the screen, under the system navigation bar
  const insets = useSafeAreaInsets();
  const { point: workOrderPoint } = useWorkOrderPoint(data);

  // Status dialog state
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // Signature modal state
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  // how much was drawn: a tap or a dot is not a signature
  const [drawnLength, setDrawnLength] = useState(0);
  const [noSignatureReason, setNoSignatureReason] = useState("");
  const [noSignatureChecked, setNoSignatureChecked] = useState(false);
  // the equipment being serviced: the engineer fills in or corrects what the work order says about it
  const [equipmentSheetVisible, setEquipmentSheetVisible] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState({ manufacturer: "", model: "", serialNumber: "" });
  const [isEquipmentSaving, setIsEquipmentSaving] = useState(false);

  const openEquipmentSheet = () => {
    setEquipmentForm({
      manufacturer: data?.equipment?.manufacturer ?? "",
      model: data?.equipment?.model ?? "",
      serialNumber: data?.equipment?.serialNumber ?? "",
    });
    setEquipmentSheetVisible(true);
  };

  const saveEquipment = async () => {
    try {
      setIsEquipmentSaving(true);
      await appointments.update(id, {
        // what else the equipment holds (name, notes...) is kept
        equipment: {
          ...(data?.equipment ?? {}),
          manufacturer: equipmentForm.manufacturer.trim(),
          model: equipmentForm.model.trim(),
          serialNumber: equipmentForm.serialNumber.trim(),
        },
      } as Partial<WorkOrder>);
      await queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      setEquipmentSheetVisible(false);
    } catch (error) {
      console.error("Failed to save equipment:", error);
      Alert.alert(t("errorTitle"), t("errorGeneral"), [{ text: t("sharedOk") }]);
    } finally {
      setIsEquipmentSaving(false);
    }
  };

  // what the field user writes about the job (the "Observations" area of the service sheet)
  const [observations, setObservations] = useState("");
  // someone else signs when the person who asked for the work is not there
  const [signedByOther, setSignedByOther] = useState(false);
  const [signedByName, setSignedByName] = useState("");
  // the sheet scrolls, except while a signature is being drawn
  const [sheetScrollEnabled, setSheetScrollEnabled] = useState(true);
  const [isSignatureSaving, setIsSignatureSaving] = useState(false);
  const signatureRef = useRef<any>(null);

  // Mutation for updating appointment status
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({
      appointmentId,
      statusData,
    }: {
      appointmentId: string;
      statusData: {
        completed: boolean;
        status: string;
        signatureProvided?: boolean;
        signedAt?: Date;
        noSignatureReason?: string;
        signatureUrl?: string | null;
        notes?: string;
        signedByOther?: boolean;
        signedByName?: string;
      };
    }) => {
      // Replace with your actual API call
      // For example: return api.put(`/appointments/${appointmentId}`, statusData);
      console.log(
        `Updating appointment ${appointmentId} with status:`,
        statusData
      );
      return appointments.update(appointmentId, statusData as Partial<WorkOrder>);
    },
    onSuccess: () => {
      // Optionally refetch data or show success message
      console.log("Status updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update status:", error);
      // Revert to previous status on error
      setStatus(
        (data?.status as
          | "new"
          | "open"
          | "onHold"
          | "inProgress"
          | "completed") || "new"
      );
    },
  });

  const handleSave = () => {
    signatureRef.current.readSignature();
  };

  // Handle signature save
  const handleSignatureSave = async (actualSignature: any) => {
    try {
      setIsSignatureSaving(true);

      let signatureUrl = "";
      // a dot or a tap is not a signature, even when the pad holds one
      const signed = !!signature && signature !== "pending" && drawnLength >= MIN_SIGNATURE_LENGTH;

      // If signature is provided, save it
      if (signed) {
        // The signature is attached to the work order (a ticket) on the server
        signatureUrl = await storageService.uploadSignature(id, actualSignature);
        console.log("Signature uploaded successfully:", signatureUrl);
      }

      // Close modal
      setSignatureModalVisible(false);

      // Update appointment status
      if (id) {
        updateAppointmentMutation.mutate({
          appointmentId: id,
          statusData: {
            completed: true,
            status: "completed",
            signatureProvided: signed,
            noSignatureReason:
              !signature || signature === "pending" ? noSignatureReason : "",
            signatureUrl: signatureUrl || null,
            notes: observations.trim(),
            // someone else only counts when somebody did sign
            signedByOther: signed && signedByOther,
            signedByName: signed && signedByOther ? signedByName.trim() : "",
            signedAt: new Date(),
          },
        });
      }

      // Update local state
      setStatus("completed");
      setPendingStatus(null);
    } catch (error) {
      console.error("Failed to save signature:", error);
      Alert.alert(
        t("errorTitle"),
        t("errorGeneral"),
        [{ text: t("sharedOk") }]
      );
    } finally {
      setIsSignatureSaving(false);
    }
  };

  // Handle signature
  const handleSignature = (signature: string) => {
    // The signature comes as a base64 data URI
    // Make sure it starts with the correct prefix for React Native image handling
    if (!signature.startsWith("data:")) {
      setSignature("data:image/png;base64," + signature);
    } else {
      setSignature(signature);
    }
    console.log("Signature received, length:", signature.length);
  };

  // Clear signature
  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
    setSignature(null);
    setDrawnLength(0);
  };

  // Check if form is valid
  const isSignatureFormValid = () => {
    // Either signature is provided OR no signature checkbox is checked AND reason is provided
    const hasSignature = !!signature && signature !== "pending" && drawnLength >= MIN_SIGNATURE_LENGTH;
    // when somebody else signs, who they are has to be written down
    if (hasSignature && signedByOther && signedByName.trim().length === 0) return false;
    return (
      hasSignature ||
      (noSignatureChecked && noSignatureReason.trim().length > 0)
    );
  };

    // Status state for the toggle buttons
    const [status, setStatus] = useState<string>("open");
    
    // Update status when data becomes available
    useEffect(() => {
      if (data && data.status) {
        if (data.status === "new") {
          console.log("Status is new");
          setStatus("open");
        } else {
          console.log("Status is not new");
          setStatus(data.status);
        }
      }
    }, [data]);

  // Helper function to check if status is 'completed'
  const isStatusCompleted = (checkStatus: string): boolean => {
    return checkStatus === "completed";
  };

  // Handle status change
  const onStatusChange = (newStatus: string) => {
    // If clicking the same status, do nothing
    if (status === newStatus) {
      return;
    }

    // Store the pending status
    setPendingStatus(newStatus);

    // If status is changing to completed, show signature modal
    if (newStatus === "completed") {
      // Reset signature state
      setSignature(null);
      setDrawnLength(0);
      setNoSignatureReason("");
      setNoSignatureChecked(false);
      setSignedByOther(false);
      setSignedByName("");
      // what was already written is kept; otherwise the usual outcome is suggested
      setObservations(data?.notes?.trim() || t("ObservationsDefault"));
      setSignatureModalVisible(true);
      return;
    }

    // For other statuses, show confirmation dialog
    Alert.alert(
      t("statusChangeTitle"),
      t("statusChangeConfirmation", {
        from: t(status),
        to: t(newStatus),
      }),
      [
        {
          text: t("cancel"),
          style: "cancel",
          onPress: () => {
            console.log("Status change canceled");
            setPendingStatus(null);
          },
        },
        {
          text: t("change"),
          style: "default",
          onPress: async () => {
            console.log("Status change confirmed");
            // Update local state
            setStatus(newStatus);
            setPendingStatus(null);

            // Update via API if we have an appointment ID
            if (id) {
              try {
                await updateAppointmentMutation.mutate({
                  appointmentId: id,
                  statusData: {
                    completed: newStatus === "completed",
                    status: newStatus,
                  },
                });
                await queryClient.invalidateQueries({ queryKey: ['new-appointments'] });
                await queryClient.invalidateQueries({ queryKey: ['latest-appointments'] });
              } catch (error) {
                console.error('Failed to update appointment status:', error);
              }
            }
          },
        },
      ]
    );
  };

  if (isFetching)
    return (
      <View className="flex-col gap-4">
        <View className="flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </View>
        <View className="flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </View>
        <View className="flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </View>
      </View>
    );
    

  const sections: Section[] = [
    {
      title: "sharedInfoTitle",
      data: [
        {
          id: "0",
          title: "ticketNumber",
          icon: TablerIcons.IconHash,
          value: data?.number || data?.id,
        },
        {
          id: "1",
          title: "sharedName",
          icon: TablerIcons.IconFileCheck,
          value: data?.title,
        },
        {
          id: "2",
          title: "sharedLocation",
          icon: TablerIcons.IconMap,
          value:
            data.serviced === "remote"
              ? t("remote")
              : data?.branchName ?? "",
          link: data.serviced === "location" && workOrderPoint ? `/(maps)/${id}` : false,
        },
        {
          id: "21",
          title: "EventType",
          icon: TablerIcons.IconTool,
          value: data?.eventType ? t(data.eventType) : data?.type ? t(data.type) : "",
        },
        {
          id: "23",
          title: "Priority",
          icon: TablerIcons.IconAlertCircle,
          value: data?.priorityName || data?.priority,
        },
      ],
    },
    {
      title: "dateTime",
      data: [
        {
          id: "31",
          title: "reportStartDate",
          icon: TablerIcons.IconCalendar,
          value: formatDate(data?.startDate.toDate(), "PPP p")
        },
        {
          id: "32",
          title: "reportEndDate",
          icon: TablerIcons.IconCalendar,
          value: formatDate(data?.endDate.toDate(), "PPP p")
        },
      ],
    },
    {
      title: "Customer",
      data: [
        {
          id: "22",
          title: "Customer",
          icon: TablerIcons.IconUserShield,
          value: data.customerName || "",
        },
        {
          id: "23",
          title: "contactPerson",
          icon: TablerIcons.IconUserShield,
          value: data?.primaryContactName || "",
        },
        {
          id: "231",
          title: "workOrderUser",
          icon: TablerIcons.IconUserExclamation,
          value: data?.user,
        },
      ],
    },
    {
      title: "sharedDescription",
      data: [
        {
          id: "3",
          title: "sharedDescription",
          icon: TablerIcons.IconMessageCircle,
          value: data?.description,
        },
      ],
    },
    {
      title: "equipment.Singular",
      data: [
        {
          id: "5",
          title: "equipment.Manufacturer",
          icon: TablerIcons.IconTrademark,
          value: data?.equipment?.manufacturer,
          action: openEquipmentSheet,
        },
        {
          id: "6",
          title: "equipment.Model",
          icon: TablerIcons.IconBlocks,
          value: data?.equipment?.model,
          action: openEquipmentSheet,
        },
        {
          id: "61",
          title: "equipment.SerialNumber",
          icon: TablerIcons.IconBarcode,
          value: data?.equipment?.serialNumber,
          action: openEquipmentSheet,
        },
      ],
    },
    {
      title: "actions.Title",
      data: [
        {
          id: "7",
          title: "Procedures",
          // procedures belong to the equipment: without one there is nothing to open
          link: data?.equipmentId ? `/(actions)/procedures/${data.equipmentId}` : undefined,
        },
        {
          id: "8",
          title: "spareParts",
          link: `/(actions)/spare-parts/${id}`,
        },
        {
          id: "9",
          title: "Findings",
          link: `/(actions)/findings/${id}`,
        },
        {
          id: "10",
          title: "Results",
          link: `/(actions)/results/${id}`,
        },
      ],
    },
    {
      title: "RegisterLocation",
      data: [
        {
          id: "11",
          title: "CheckIn",
          icon: TablerIcons.IconDoorEnter,
          link: `/(modal)/register-location/${id}`,
          params: {
            action: "checkIn",
          },
        },
        {
          id: "12",
          title: "CheckOut",
          icon: TablerIcons.IconDoorExit,
          link: `/(modal)/register-location/${id}`,
          params: {
            action: "checkOut",
          },
        },
      ],
    },
  ];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="bg-card p-4"
    >
      <SafeAreaView>
      <Text className="text-2xl font-manrope-semibold tracking-tight text-primary mb-4">
        {t("status")}
      </Text>

      <View className="flex-row px-2 gap-2 items-center justify-between mb-8">
        {/* Status Toggle Selector */}
        {/* Status open */}
        <TouchableOpacity
          className={`flex-1 border rounded-xl p-4 items-center ${
            status === "open"
              ? "bg-primary border-primary"
              : "border-muted-foreground/20"
          }`}
          onPress={() => onStatusChange("open")}
        >
          <View className="flex-col items-center">
            <ToggleIcon
              icon={TablerIcons.IconLockOpen}
              size={24}
              active={status === "open"}
            />
            <Text
              className={`text-xs font-manrope-regular tracking-tight mt-1 ${
                status === "open" ? "text-primary-foreground" : "text-primary"
              }`}
            >
              {t("open")}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Status on hold */}
        <TouchableOpacity
          className={`flex-1 border rounded-xl p-4 items-center ${
            status === "onHold"
              ? "bg-primary border-primary"
              : "border-muted-foreground/20"
          }`}
          onPress={() => onStatusChange("onHold")}
        >
          <View className="flex-col items-center">
            <ToggleIcon
              icon={TablerIcons.IconPlayerPause}
              size={24}
              active={status === "onHold"}
            />
            <Text
              className={`text-xs font-manrope-regular tracking-tight mt-1 ${
                status === "onHold" ? "text-primary-foreground" : "text-primary"
              }`}
            >
              {t("onHold")}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Status in progress */}
        <TouchableOpacity
          className={`flex-1 border rounded-xl p-4 items-center ${
            status === "inProgress"
              ? "bg-primary border-primary"
              : "border-muted-foreground/20"
          }`}
          onPress={() => onStatusChange("inProgress")}
        >
          <View className="flex-col items-center">
            <ToggleIcon
              icon={TablerIcons.IconReload}
              size={24}
              active={status === "inProgress"}
            />
            <Text
              className={`text-xs font-manrope-regular tracking-tight mt-1 ${
                status === "inProgress"
                  ? "text-primary-foreground"
                  : "text-primary"
              }`}
            >
              {t("inProgress")}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Status completed */}
        <TouchableOpacity
          className={`flex-1 border rounded-xl p-4 items-center ${
            isStatusCompleted(status)
              ? "bg-primary border-primary"
              : "border-muted-foreground/20"
          }`}
          onPress={() => onStatusChange("completed")}
        >
          <View className="flex-col items-center">
            <ToggleIcon
              icon={TablerIcons.IconCheck}
              size={24}
              active={isStatusCompleted(status)}
            />
            <Text
              className={`text-xs font-manrope-regular tracking-tight mt-1 ${
                isStatusCompleted(status)
                  ? "text-primary-foreground"
                  : "text-primary"
              }`}
            >
              {t("completed")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="px-2">
        {sections.map((section, sectionIndex) => (
          <View key={section.title} className="mb-12">
            <Text className="text-xs font-manrope-regular uppercase text-muted-foreground mb-4 px-2">
              {t(section.title)}
            </Text>
            <View className="rounded-xl border border-muted-foreground/20 bg-card overflow-hidden shadow-sm">
              {section.data.map((item, itemIndex) => (
                item.link || item.action ? (
                  <View key={item.id}>
                  <TouchableOpacity
                    onPress={() =>
                      item.action
                        ? item.action()
                        : router.push({
                            pathname: item.link as string,
                            params: item.params && { ...item.params },
                          })}
                    disabled={!item.link && !item.action}
                    className="py-3 px-4 flex-row items-center"
                  >
                    {/* Icon at the left */}
                    {item.icon && (
                      <View className="w-8 justify-center items-center">
                        <ThemedIcon icon={item.icon} size={16} />
                      </View>
                    )}

                    {/* Value & Title in the middle, start aligned */}
                    <View className="flex-col flex-1 ml-2">
                      {item.value ? (
                        <>
                          <Text className="text-primary font-manrope-regular">
                            {item.value.toString()}
                          </Text>
                          <Text className="text-muted-foreground text-xs font-manrope-regular">
                            {t(item.title)}
                          </Text>
                        </>
                      ) : (
                        <Text className="text-primary font-manrope-regular">
                          {t(item.title)}
                        </Text>
                      )}
                    </View>

                    {/* Arrow at the right if item is a link */}
                    {item.link && <Text className="text-gray-400 ml-2">›</Text>}
                    {item.action && <ThemedIcon icon={TablerIcons.IconPencil} size={16} />}
                  </TouchableOpacity>
                  {itemIndex < section.data.length - 1 && (
                    <View className="h-px bg-muted-foreground/10 ml-12" />
                  )}
                </View>
                ):(
                  <View key={item.id} className="py-3 px-4 flex-row items-center">
                  
                    {/* Icon at the left */}
                    {item.icon && (
                      <View className="w-8 justify-center items-center">
                        <ThemedIcon icon={item.icon} size={16} />
                      </View>
                    )}

                    {/* Value & Title in the middle, start aligned */}
                    <View className="flex-col flex-1 ml-2">
                      {item.value ? (
                        <>
                          <Text className="text-primary font-manrope-regular">
                            {item.value.toString()}
                          </Text>
                          <Text className="text-muted-foreground text-xs font-manrope-regular">
                            {t(item.title)}
                          </Text>
                        </>
                      ) : (
                        <Text className="text-primary font-manrope-regular">
                          {t(item.title)}
                        </Text>
                      )}
                    </View>
                  {itemIndex < section.data.length - 1 && (
                    <View className="h-px bg-muted-foreground/10 ml-12" />
                  )}
                </View>
                )
              ))}
            </View>
          </View>
        ))}
      </View>
      {/* Equipment sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        visible={equipmentSheetVisible}
        onRequestClose={() => setEquipmentSheetVisible(false)}
      >
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-4" style={{ paddingBottom: insets.bottom + 24 }}>
            <View className="flex-row justify-start items-center mb-2">
              <TouchableOpacity onPress={() => setEquipmentSheetVisible(false)} className="p-2">
                <ThemedIcon icon={TablerIcons.IconX} size={24} />
              </TouchableOpacity>
              <Text className="text-lg text-primary font-manrope-semibold">
                {t("EquipmentInformation")}
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground mb-4">{t("EquipmentSheetHint")}</Text>
            {(
              [
                ["manufacturer", "equipment.Manufacturer"],
                ["model", "equipment.Model"],
                ["serialNumber", "equipment.SerialNumber"],
              ] as const
            ).map(([field, label]) => (
              <View key={field} className="mb-4">
                <Text className="text-sm text-primary font-manrope-semibold mb-2">{t(label)}</Text>
                <TextInput
                  className="border border-muted-foreground/20 rounded-lg p-2 text-primary"
                  value={equipmentForm[field]}
                  onChangeText={(text) => setEquipmentForm((form) => ({ ...form, [field]: text }))}
                  placeholder={t(label)}
                  placeholderTextColor="#9ca3af"
                  autoCapitalize={field === "serialNumber" ? "characters" : "words"}
                />
              </View>
            ))}
            <TouchableOpacity
              onPress={saveEquipment}
              disabled={isEquipmentSaving}
              className="py-3 px-4 rounded-lg flex-row justify-center items-center mt-2 bg-primary-foreground"
            >
              {isEquipmentSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-primary font-manrope-semibold">{t("Save")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Signature Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        hardwareAccelerated={true}
        presentationStyle={Platform.OS === "ios" ? "formSheet" : "fullScreen"}
        visible={signatureModalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => {
          setSignatureModalVisible(false);
          setPendingStatus(null);
        }}
      >
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-4" style={{ maxHeight: "92%", paddingBottom: insets.bottom + 24 }}>
            <View className="flex-row justify-start items-center mb-4">
              <TouchableOpacity
                onPress={() => {
                  setSignatureModalVisible(false);
                  setPendingStatus(null);
                }}
                className="p-2"
              >
                <ThemedIcon icon={TablerIcons.IconX} size={24} />
              </TouchableOpacity>
              <Text className="text-lg text-primary font-manrope-semibold">
                {t("signatureRequired")}
              </Text>
            </View>

            <ScrollView
              scrollEnabled={sheetScrollEnabled}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            {/* Observations: the "Observations" area of the service sheet */}
            <View className="mb-4">
              <Text className="text-sm text-primary font-manrope-semibold mb-2">
                {t("Observations")}
              </Text>
              <TextInput
                className="border border-muted-foreground/20 rounded-lg p-2 min-h-[80px] text-primary"
                multiline
                textAlignVertical="top"
                value={observations}
                onChangeText={setObservations}
                placeholder={t("ObservationsDefault")}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Somebody else signs when the person who asked for the work is not there */}
            <View className="mb-4">
              <View className="flex-row items-center">
                <Switch
                  value={signedByOther}
                  disabled={noSignatureChecked}
                  onValueChange={setSignedByOther}
                  trackColor={{ false: "#d1d5db", true: "#0F1729" }}
                />
                <Text className="ml-2 flex-1 text-primary font-manrope-semibold">
                  {t("SignedByOther")}
                </Text>
              </View>
              {signedByOther && !noSignatureChecked && (
                <View className="mt-2">
                  <Text className="text-sm text-muted-foreground mb-2">
                    {t("SignedByOtherName")}
                  </Text>
                  <TextInput
                    className="border border-muted-foreground/20 rounded-lg p-2 text-primary"
                    value={signedByName}
                    onChangeText={setSignedByName}
                    placeholder={t("SignedByOtherNamePlaceholder")}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              )}
            </View>

            <Text className="text-sm text-muted-foreground mb-4">
              {t("ProvideASignature")}
            </Text>

            {/* Signature Pad */}
            <View className="h-64 border border-muted-foreground/20 rounded-xl mb-4 overflow-hidden">
              <SignatureCanvas
                ref={signatureRef}
                onOK={handleSignatureSave}
                onBegin={() => {
                  setSignature("pending");
                  setSheetScrollEnabled(false);
                }}
                onEnd={() => {
                  setSignature("completed");
                  setSheetScrollEnabled(true);
                  // ask the pad for what was drawn: onGetData measures it
                  signatureRef.current?.getData();
                }}
                onGetData={(strokes: string) => setDrawnLength(signatureLength(strokes))}
                descriptionText={t("SignHere")}
                clearText={t("Clear")}
                confirmText={t("Save")}
                webStyle={`
                  body, html {
                    width: 100%; height: 100%;
                    margin: 0;
                    padding: 0;
                  }
                  .m-signature-pad {
                    margin: 0;
                    width: 100%; height: 100%;
                    border: none;
                    box-shadow: none;
                  }
                  .m-signature-pad--body {
                    border: none;
                  }
                  .m-signature-pad--footer {
                    display: none;
                  }
                  .m-signature-pad--body canvas {
                    width: 100%; height: 100%;
                  }
                `}
                autoClear={false}
                imageType="image/png"
              />
            </View>

            {signature === "completed" && drawnLength < MIN_SIGNATURE_LENGTH && (
              <Text className="text-sm text-destructive mb-2">{t("SignatureTooShort")}</Text>
            )}

            {/* Clear Button */}
            <TouchableOpacity
              onPress={handleClearSignature}
              className="py-2 px-4 border border-muted-foreground/20 rounded-lg self-start mb-4"
            >
              <Text className="text-primary font-manrope-semibold">
                {t("Clear")}
              </Text>
            </TouchableOpacity>

            {/* No Signature Option */}
            <View className="border-t border-muted-foreground/20 pt-4 mt-2">
              <View className="flex-row items-center mb-2">
                <Switch
                  value={noSignatureChecked}
                  onValueChange={(on) => {
                    setNoSignatureChecked(on);
                    if (on) setSignedByOther(false);
                  }}
                  trackColor={{ false: "#d1d5db", true: "#0F1729" }}
                />
                <Text className="ml-2 text-primary font-manrope-semibold">
                  {t("NoSignatureAvailable")}
                </Text>
              </View>

              {noSignatureChecked && (
                <View className="mb-4">
                  <Text className="text-sm text-muted-foreground mb-2">
                    {t("NoSignatureReason")}
                  </Text>
                  <TextInput
                    className="border border-muted-foreground/20 rounded-lg p-2 min-h-[80px] text-primary"
                    multiline
                    value={noSignatureReason}
                    onChangeText={setNoSignatureReason}
                    placeholder={t("EnterReasonHere")}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              )}
            </View>

            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isSignatureFormValid() || isSignatureSaving}
              className={`py-3 px-4 rounded-lg flex-row justify-center items-center mt-4 ${
                isSignatureFormValid() ? "bg-primary-foreground" : "bg-primary-foreground"
              }`}
            >
              {isSignatureSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className={isSignatureFormValid() ? "text-primary font-manrope-semibold" : "text-primary font-manrope-semibold"}>
                  {t("SaveAndMarkAsCompleted")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </SafeAreaView>
    </ScrollView>
  );
};

export default AppointmentDetails;
