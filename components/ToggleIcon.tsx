import { useColorScheme } from 'nativewind';
import * as TablerIcons from '@tabler/icons-react-native';
import { Text } from 'react-native';

const ToggleIcon = ({size = 12, icon: Icon, active, className, ...props }: { size?: number, icon: TablerIcons.Icon, active: boolean, className?: string }) => {
  const { colorScheme } = useColorScheme();
  const color = colorScheme === 'dark' ? (active ? 'black' : 'white') : (active ? 'white' : 'black');
  
  return (
    <Text className="text-primary mx-1">
      <Icon {...props} size={size || 12} color={color}/>
    </Text>
  );
};

export default ToggleIcon;
