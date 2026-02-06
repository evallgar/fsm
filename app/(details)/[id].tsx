import {
  TouchableOpacity,
  Text,
  View,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  }[];
};
const AppointmentDetails = () => {
  const { id } = useLocalSearchParams() as { id: string };
  const queryClient = useQueryClient();
  const { data, isFetching, isError } = useQuery(
    useAppointmentByIdQueryOptions(id)
  ) as { data: Appointment; isFetching: boolean; isError: boolean };

  const { t } = useTranslation();

  // Status dialog state
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // Signature modal state
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [noSignatureReason, setNoSignatureReason] = useState("");
  const [noSignatureChecked, setNoSignatureChecked] = useState(false);
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

      // If signature is provided, save it
      if (signature && signature !== "pending") {
        // Create a unique path for this appointment's signature
        const storagePath = `appointments/${id}`;

        // Upload signature image to Firebase Storage using the existing service
        signatureUrl = await storageService.uploadSignatureToFirebase3(
          actualSignature,
          storagePath,
          `${id}.png`
        );
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
            signatureProvided: !!signature && signature !== "pending",
            noSignatureReason:
              !signature || signature === "pending" ? noSignatureReason : "",
            signatureUrl: signatureUrl || null,
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
  };

  // Check if form is valid
  const isSignatureFormValid = () => {
    // Either signature is provided OR no signature checkbox is checked AND reason is provided
    return (
      signature === "pending" ||
      !!signature ||
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
      setNoSignatureReason("");
      setNoSignatureChecked(false);
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
          link: data.serviced === "location" && data?.location?.location ? `/(maps)/${id}` : false,
        },
        {
          id: "21",
          title: "EventType",
          icon: TablerIcons.IconTool,
          value: t(data?.type),
        },
        {
          id: "23",
          title: "Priority",
          icon: TablerIcons.IconAlertCircle,
          value: data?.priority,
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
        },
        {
          id: "6",
          title: "equipment.Model",
          icon: TablerIcons.IconBlocks,
          value: data?.equipment?.model,
        },
        {
          id: "61",
          title: "equipment.SerialNumber",
          icon: TablerIcons.IconBarcode,
          value: data?.equipment?.serialNumber,
        },
      ],
    },
    {
      title: "actions.Title",
      data: [
        {
          id: "7",
          title: "Procedures",
          link: `/(actions)/procedures/${data?.equipmentId}`,
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
          onPressOut={Platform.OS === 'android' ? () => onStatusChange("open") : undefined}
          onPress={Platform.OS === 'ios' ? () => onStatusChange("open") : undefined}
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
          onPressOut={Platform.OS === 'android' ? () => onStatusChange("onHold") : undefined}
          onPress={Platform.OS === 'ios' ? () => onStatusChange("onHold") : undefined}
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
          onPressOut={Platform.OS === 'android' ? () => onStatusChange("inProgress") : undefined}
          onPress={Platform.OS === 'ios' ? () => onStatusChange("inProgress") : undefined}
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
          onPressOut={Platform.OS === 'android' ? () => onStatusChange("completed") : undefined}
          onPress={Platform.OS === 'ios' ? () => onStatusChange("completed") : undefined}
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
                item.link ? (
                  <View key={item.id}>
                  <TouchableOpacity
                    onPressOut={Platform.OS === 'android' ? () =>
                      router.push({
                        pathname: item.link as string,
                        params: item.params && { ...item.params },
                      }) : undefined}
                    onPress={Platform.OS === 'ios' ? () =>
                      router.push({
                        pathname: item.link as string,
                        params: item.params && { ...item.params },
                      }) : undefined}
                    disabled={!item.link}
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
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-4 pb-8">
            <View className="flex-row justify-start items-center mb-4">
              <TouchableOpacity
                onPressOut={Platform.OS === 'android' ? () => {
                  setSignatureModalVisible(false);
                  setPendingStatus(null);
                } : undefined}
                onPress={Platform.OS === 'ios' ? () => {
                  setSignatureModalVisible(false);
                  setPendingStatus(null);
                } : undefined}
                className="p-2"
              >
                <ThemedIcon icon={TablerIcons.IconX} size={24} />
              </TouchableOpacity>
              <Text className="text-lg text-primary font-manrope-semibold">
                {t("signatureRequired")}
              </Text>
            </View>

            <Text className="text-sm text-muted-foreground mb-4">
              {t("ProvideASignature")}
            </Text>

            {/* Signature Pad */}
            <View className="h-64 border border-muted-foreground/20 rounded-xl mb-4 overflow-hidden">
              <SignatureCanvas
                ref={signatureRef}
                onOK={handleSignatureSave}
                onBegin={() => setSignature("pending")}
                onEnd={() => setSignature("completed")}
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

            {/* Clear Button */}
            <TouchableOpacity
              onPressOut={Platform.OS === 'android' ? handleClearSignature : undefined}
              onPress={Platform.OS === 'ios' ? handleClearSignature : undefined}
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
                  onValueChange={setNoSignatureChecked}
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

            {/* Save Button */}
            <TouchableOpacity
              onPressOut={Platform.OS === 'android' ? handleSave : undefined}
              onPress={Platform.OS === 'ios' ? handleSave : undefined}
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
        </View>
      </Modal>
      </SafeAreaView>
    </ScrollView>
  );
};

export default AppointmentDetails;
