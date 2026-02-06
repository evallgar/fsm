import { Tabs } from 'expo-router';
import { cssInterop } from 'nativewind';
import { ViewStyle } from 'react-native';

function StyledTabsImpl({
  tabBarStyle,
  headerStyle,
  ...props
}: React.ComponentProps<typeof Tabs> & {
  tabBarStyle?: ViewStyle;
  headerStyle?: ViewStyle;
}) {
  props.screenOptions = {
    ...props.screenOptions,
    tabBarStyle,
    headerStyle,
  };
  return <Tabs {...props} />;
}

export const StyledTabs = cssInterop(StyledTabsImpl, {
  tabBarClassName: 'tabBarStyle',
  headerClassName: 'headerStyle',
});
