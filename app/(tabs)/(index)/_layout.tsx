import { StyledStack } from '@/components/navigation/stack';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import ThemedIcon from '@/components/ThemedIcon';
import { IconArrowLeft } from '@tabler/icons-react-native';
const Layout = () => {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <StyledStack
      contentClassName="bg-card text-primary"
      headerClassName="bg-card text-primary">
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          
          headerTitle: t('Details'),
          headerLargeTitle: true,
          headerTransparent: true,
          headerBlurEffect: 'regular',
          headerLargeTitleShadowVisible: false,
          headerLargeTitleStyle: {
            fontFamily: 'manrope-semibold',
          },
          headerBackButtonDisplayMode: 'default',
          headerBackTitle: t('back'),
          headerTitleStyle: {
            fontFamily: 'manrope-semibold',
          },
          headerBackTitleStyle: {
            fontFamily: 'manrope-medium',
          },
        }}
      />
    </StyledStack>
  );
};
export default Layout;