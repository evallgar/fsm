import { type VariantProps, cva } from 'class-variance-authority';
import { Text, View } from 'react-native';
import * as TablerIcons from '@tabler/icons-react-native';
import { cn } from '@/lib/utils';
import ThemedIcon from './ThemedIcon';

const badgeVariants = cva(
  'flex flex-row items-center rounded-full px-2 py-1 text-xs font-manrope',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        destructive: 'bg-destructive',
        success: 'bg-green-500 dark:bg-green-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const badgeTextVariants = cva('font-manrope tracking-tighter text-center text-xs mx-1', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      success: 'text-green-100',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps
  extends React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof badgeVariants> {
  label: string;
  labelClasses?: string;
  icon?: TablerIcons.Icon;
}
function Badge({
  label,
  labelClasses,
  icon,
  className,
  variant,
  ...props
}: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      <Text className={cn(badgeTextVariants({ variant }), labelClasses)}>
        {label}
      </Text>
      {icon && <ThemedIcon icon={icon}/>}
    </View>
  );
}

export { Badge, badgeVariants };
