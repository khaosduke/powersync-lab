import { useAuth } from '@/contexts/AuthContext';
import { Button } from 'react-native';


export default function SignOutButton() {
    const { signOut } = useAuth()
    return (
        <Button
            title="Sign Out"
            onPress={() => void signOut()}
        />
    );
}