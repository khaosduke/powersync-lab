import SignOutButton from '@/components/SignOutButton';
import AppleStyleSwipeableRow from '@/components/SwipeableRow';
import { Todo, useTodoStore } from '@/features/todos/TodoStore';
import { useSystem } from '@/lib/powersync/powersync_system';
import { uuid } from '@/lib/powersync/powersync_uuid';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';


//The todos index
export default function Index() {
    const [description, setDescription] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [activeListId, setActiveListId] = useState<string | null>(null);

    const { supabaseConnector, db } = useSystem();

    const todos = useTodoStore((s) => s.todos);
    const loadTodos = useTodoStore((s) => s.loadTodos);
    const addTodoToStore = useTodoStore((s) => s.addTodo);
    const toggleTodo = useTodoStore((s) => s.toggleTodo);
    const deleteTodoById = useTodoStore((s) => s.deleteTodo);


    async function getOrCreateDefaultList(userID: string) {
        const existing = await db
            .selectFrom("lists")
            .selectAll()
            .where("owner_id", "=", userID)
            .limit(1)
            .executeTakeFirst();

        if (existing) return existing.id;

        const listId = uuid() as string;

        await db
            .insertInto("lists")
            .values({
            id: listId,
            name: "Default",
            owner_id: userID,
            })
            .execute();

        return listId;
    }

    useEffect(() => {
        async function init() {
        const { userID } = await supabaseConnector.fetchCredentials();
        setUserId(userID);
        const listId = await getOrCreateDefaultList(userID);
        setActiveListId(listId);
        await loadTodos();
      }
      init();
  }, []);
  
    const addTodo = async () => {
      if (!description.trim()) return;
      if (!userId || !activeListId) return;

      await addTodoToStore(description, userId, activeListId);

      setDescription('');
    };




    const renderRow: ListRenderItem<Todo> = ({ item }) => {
      return (
        <AppleStyleSwipeableRow
          onDelete={() => deleteTodoById(item.id)}
          onToggle={() => toggleTodo(item.id)}
          todo={item}
        >
          <View style={{ padding: 12, flexDirection: 'row', gap: 10, height: 44 }}>
            <Text style={{ flex: 1 }}>{item.description}</Text>

            {item.completed === 1 && (
              <Ionicons name="checkmark-done-outline" size={24} color="#00d5ff" />
            )}
          </View>
        </AppleStyleSwipeableRow>
      );
    };
    
    
    return (
        <View style={{ flex: 1 }}>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Add new task"
              style={styles.input}
              value={description}
              onChangeText={setDescription}
            />
    
            <TouchableOpacity onPress={addTodo} disabled={description === ''}>
              <Ionicons name="add-outline" size={24} color="#A700FF" />
            </TouchableOpacity>
    
            <SignOutButton />
          </View>
    
          <FlatList
            data={todos}
            renderItem={renderRow}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: StyleSheet.hairlineWidth,
                  width: '100%',
                  backgroundColor: 'gray',
                }}
              />
            )}
          />
        </View>
      );
}


const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#151515',
    padding: 6,
    alignItems: 'center',
    marginTop: 100,
  },
  input: {
    flex: 1,
    backgroundColor: '#363636',
    color: '#fff',
    padding: 8,
    borderWidth: 1,
    borderColor: '#A700FF',
    borderRadius: 4,
  },
});