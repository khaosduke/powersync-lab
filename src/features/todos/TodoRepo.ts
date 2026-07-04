import { TODOS_TABLE } from "@/lib/powersync/powersync_app_schema";
import { system } from "@/lib/powersync/powersync_system";
import { uuid } from "@/lib/powersync/powersync_uuid";

const db = system.db;

//CRUD operations for todos

export async function getTodos() {
    return await db.selectFrom(TODOS_TABLE).selectAll().execute();
}

export async function createTodo(description: string, userId: string, activeListId: string) {
    const todoId = uuid();
    await db
            .insertInto(TODOS_TABLE)
            .values({ id: todoId, description, list_id: activeListId, created_by: userId, completed: 0 })
        .execute();
}

export async function updateTodo(id: string, completed: boolean) {
   await db
        .updateTable(TODOS_TABLE)
        .where('id', '=', id)
        .set({ completed: completed ? 1 : 0 })
        .execute();
}

export async function deleteTodo(id: string) {
  await db.deleteFrom(TODOS_TABLE).where('id', '=', id).execute();
}