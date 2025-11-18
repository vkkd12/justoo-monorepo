// Database utility functions
import db from '../config/dbConfig.js';
import { eq } from 'drizzle-orm';

export const findById = async (table, id) => {
    try {
        const result = await db.select().from(table).where(eq(table.id, id));
        return result[0] || null;
    } catch (error) {
        console.error('Error finding record by ID:', error);
        throw error;
    }
};

export const findByUsername = async (table, username) => {
    try {
        const result = await db.select().from(table).where(eq(table.username, username));
        return result[0] || null;
    } catch (error) {
        console.error('Error finding record by username:', error);
        throw error;
    }
};

export const createRecord = async (table, data) => {
    try {
        const result = await db.insert(table).values(data).returning();
        return result[0];
    } catch (error) {
        console.error('Error creating record:', error);
        throw error;
    }
};

export const updateRecord = async (table, id, data) => {
    try {
        const result = await db.update(table).set(data).where(eq(table.id, id)).returning();
        return result[0];
    } catch (error) {
        console.error('Error updating record:', error);
        throw error;
    }
};

export const deleteRecord = async (table, id) => {
    try {
        const result = await db.delete(table).where(eq(table.id, id)).returning();
        return result[0];
    } catch (error) {
        console.error('Error deleting record:', error);
        throw error;
    }
};

export const getAllRecords = async (table, limit = 100) => {
    try {
        const result = await db.select().from(table).limit(limit);
        return result;
    } catch (error) {
        console.error('Error fetching all records:', error);
        throw error;
    }
};
