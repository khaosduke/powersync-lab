import { create } from "zustand"
import * as todo_repo from "./TodoRepo"

export interface Todo {
    id: string
    description: string | null
    completed: number | null
    created_by: string | null
    list_id: string | null
    completed_by: string | null
}

interface TodoStore {

    //----------------------------------
    // state
    //----------------------------------

    todos: Todo[]
    loading: boolean
    error: string | null

    //----------------------------------
    // actions
    //----------------------------------

    loadTodos(): Promise<void>
    addTodo(description: string, userId: string, activeListId: string): Promise<void>
    toggleTodo(id: string): Promise<void>
    deleteTodo(id: string): Promise<void>
    refresh(): Promise<void>
    clearError(): void
}

export const useTodoStore = create<TodoStore>((set, get) => ({
    todos: [],
    loading: false,
    error: null,

    loadTodos: async () => {
        set({
            loading: true,
            error: null
        })

        try {
            const todos = await todo_repo.getTodos()
            set({
                todos,
                loading: false
            })
        } catch (err) {
            set({
                loading: false,
                error: err instanceof Error ? err.message : String(err)
            })
        }
    },

    addTodo: async (description: string, userId: string, activeListId: string) => {
        await todo_repo.createTodo(description, userId, activeListId)
        await get().loadTodos()
    },

    toggleTodo: async (id: string) => {
        const todo = get().todos.find(t => t.id === id)
        if (!todo) return
        await todo_repo.updateTodo(id, !Boolean(todo.completed))
        await get().loadTodos()
    },

    deleteTodo: async (id: string) => {
        await todo_repo.deleteTodo(id)
        await get().loadTodos()
    },

    refresh: async () => {
        await get().loadTodos()
    },

    clearError: () => {
        set({
            error: null
        })
    }

}))