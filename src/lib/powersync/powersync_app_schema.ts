import { Schema, Table, column } from '@powersync/react-native';

export const TODOS_TABLE = 'todos' as const
export const LISTS_TABLE = 'lists' as const

const todos = new Table({
    description: column.text,
    completed: column.integer,
    completed_by: column.text,
    created_by: column.text,
    list_id: column.text
});

const lists = new Table({
  name: column.text,
  owner_id: column.text,
});

export const AppSchema = new Schema({
    todos,
    lists,
});

export type Database = (typeof AppSchema)['types'];
export type Todo = Database['todos'];
export type List = Database['lists'];
