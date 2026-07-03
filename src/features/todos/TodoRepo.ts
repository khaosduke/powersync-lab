import { Todo } from "@/lib/powersync/powersync_app_schema"
import { db } from "@/lib/kysely_database
import { uuid } from "@/lib/powersync/powersync_uuid"


export async function getTodos() {
    return await db.select().from(todos)
}

export async function createTodo(text: string) {
    const todo = {
        id: uuid(),
        text,
        completed: false,
        createdAt: new Date().toISOString()
    }

    await db.insert(todos).values(todo)

    return todo
}

export async function updateTodo(id: string, completed: boolean) {
    await db
        .update(todos)
        .set({ completed })
        .where(eq(todos.id, id))
}

export async function deleteTodo(id: string) {
    await db
        .delete(todos)
        .where(eq(todos.id, id))
}