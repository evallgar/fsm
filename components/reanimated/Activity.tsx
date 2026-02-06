import {Image, StyleSheet, Text, View} from 'react-native';
import {ActivityType} from './data';

type Props = {
  item: ActivityType;
};

const Activity = ({item}: Props) => {
  return (
    <View className="flex-row items-center justify-between" style={styles.container}>
      <View className="bg-muted rounded-2xl">
        <Image source={item.image} style={styles.image} />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-primary text-lg font-manrope-semibold">{item.name}</Text>
        <Text className="text-muted-foreground text-sm font-manrope-semibold">{item.date}</Text>
      </View>
      <Text className="text-primary text-lg font-manrope-semibold">{item.price}</Text>
    </View>
  );
};

export default Activity;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 14,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageContainer: {
    backgroundColor: '#222222',
    borderRadius: 18,
  },
  image: {
    width: 44,
    height: 44,
    margin: 14,
    resizeMode: 'contain',
  },
  textName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  textDate: {
    color: 'white',
    fontSize: 14,
  },
  nameContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  textPrice: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});