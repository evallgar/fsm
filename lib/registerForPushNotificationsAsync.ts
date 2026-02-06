import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if(Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if(existingStatus !== Notifications.PermissionStatus.GRANTED) {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if(finalStatus !== Notifications.PermissionStatus.GRANTED) {
            throw new Error('Permission not granted to token for push notification!');
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if(!projectId) {
            throw new Error('Project ID not found!');
        }

        try {
            const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('Expo Push Token: ', token);
            return token;
        } catch (error) {
            console.error('Error getting push token: ', error);
            throw error;
        }
    } else {
        console.warn('Must use physical device for Push Notifications');
        return null;
    }
}
    