import { useColorScheme } from 'nativewind';
import * as TablerIcons from '@tabler/icons-react-native';
import { Text } from 'react-native';

const ThemedIcon = ({size = 12, icon: Icon, className, ...props }: { size?: number, icon: TablerIcons.Icon, className?: string }) => {
  const { colorScheme } = useColorScheme();
  const color = colorScheme === 'dark' ? 'white' : 'black';
  
  return (
    <Text className="text-primary mx-1">
      <Icon {...props} size={size || 12} color={color}/>
    </Text>
  );
};

export default ThemedIcon;
