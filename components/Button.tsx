import { forwardRef } from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { cn } from '~/lib/cn';

type ButtonProps = {
  title?: string;
  className?: string;
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(({ title, className, ...touchableProps }, ref) => {
  return (
    <TouchableOpacity
      ref={ref}
      {...touchableProps}
      className={cn(
        'items-center bg-indigo-500 rounded-3xl flex-row justify-center p-4 shadow-lg',
        className
      )}
      style={[
        {
          shadowColor: '#000',
          shadowOffset: {
            height: 2,
            width: 0,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        },
        touchableProps.style,
      ]}
    >
      <Text className="text-white text-base font-semibold text-center">{title}</Text>
    </TouchableOpacity>
  );
});
