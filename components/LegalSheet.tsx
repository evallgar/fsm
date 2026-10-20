import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { IconX } from "@tabler/icons-react-native";
import ThemedIcon from "@/components/ThemedIcon";

export type LegalKind = "terms" | "privacy";

/** What each document says, by translation key: a heading with a paragraph, or with a list. Same text as the webapp. */
const DOCUMENTS: Record<LegalKind, { title: string; sections: { heading: string; paragraph?: string; items?: string[] }[] }> = {
  terms: {
    title: "proTermsConditions",
    sections: [
      { heading: "acceptanceOfTerms", paragraph: "acceptanceOfTermsParagraph" },
      { heading: "serviceDescription", paragraph: "serviceDescriptionParagraph" },
      { heading: "accountRegistration", paragraph: "accountRegistrationParagraph" },
      { heading: "deviceUsage", items: ["deviceUsageItem1", "deviceUsageItem2", "deviceUsageItem3", "deviceUsageItem4"] },
      { heading: "dataOwnership", paragraph: "dataOwnershipParagraph" },
      { heading: "serviceLevel", paragraph: "serviceLevelParagraph" },
      { heading: "liabilityLimitations", paragraph: "liabilityLimitationsParagraph" },
      {
        heading: "acceptableUse",
        items: ["acceptableUseItem1", "acceptableUseItem2", "acceptableUseItem3", "acceptableUseItem4", "acceptableUseItem5"],
      },
      { heading: "subscriptionTerms", paragraph: "subscriptionTermsParagraph" },
      { heading: "termination", paragraph: "terminationParagraph" },
      { heading: "modifications", paragraph: "modificationsParagraph" },
      { heading: "governingLaw", paragraph: "governingLawParagraph" },
      { heading: "generalProvisions", paragraph: "generalProvisionsParagraph" },
    ],
  },
  privacy: {
    title: "proPrivacy",
    sections: [
      { heading: "proPrivacy", paragraph: "proPrivacyParagraph" },
      { heading: "privacyPersonalData", paragraph: "privacyPersonalDataParagraph" },
      { heading: "privacyTechnologies", paragraph: "privacyTechnologiesParagraph" },
      { heading: "privacyChanges", paragraph: "privacyChangesParagraph" },
    ],
  },
};

/** A full-height sheet from the bottom: the terms and conditions or the privacy policy. */
export function SheetFrame({ title, visible, onClose, children }: { title: string; visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
        <View className="flex-row items-center justify-between border-b border-muted-foreground/20 px-4 py-3">
          <Text className="flex-1 pr-3 text-lg font-manrope-bold text-primary">{title}</Text>
          <Pressable
            accessibilityLabel={t("legalClose")}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => onClose()}
          >
            <ThemedIcon icon={IconX} size={22} />
          </Pressable>
        </View>
        {children}
      </SafeAreaView>
    </Modal>
  );
}

export default function LegalSheet({ kind, onClose }: { kind: LegalKind | null; onClose: () => void }) {
  const { t } = useTranslation();
  // keep the last document while the sheet slides away
  const doc = DOCUMENTS[kind ?? "terms"];
  return (
    <SheetFrame title={t(`web_${doc.title}`)} visible={kind !== null} onClose={onClose}>
      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 pb-10 gap-5">
        {doc.sections.map((section) => (
          <View key={section.heading} className="gap-1">
            <Text className="font-manrope-bold text-primary">{t(`web_${section.heading}`)}</Text>
            {section.paragraph && <Text className="text-primary leading-5">{t(`web_${section.paragraph}`)}</Text>}
            {section.items?.map((item) => (
              <View key={item} className="flex-row gap-2 pl-2">
                <Text className="text-primary">{"\u2022"}</Text>
                <Text className="flex-1 text-primary leading-5">{t(`web_${item}`)}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SheetFrame>
  );
}
