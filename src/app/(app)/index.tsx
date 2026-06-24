import SignOutButton from '@/components/SignOutButton';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
    return (
        <View style={styles.container}>
            <Text>Welcome to the Home Screen!</Text>
            <SignOutButton />
         </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});