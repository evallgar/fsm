import { DocumentData, QueryConstraint } from 'firebase/firestore';

/**
 * Type definition for the FirestoreCRUD factory
 * This represents the return type of createFirestoreCRUD function
 */
export type FirestoreCRUD<T extends DocumentData> = {
  /**
   * Creates a new document in the collection
   * @param data Document data to create
   * @returns Promise with the created document reference
   */
  create: (data: Omit<T, 'id'>) => Promise<T & { id: string }>;

  /**
   * Lists all documents in the collection that are not soft deleted
   * @param filters Optional query constraints
   * @returns Promise with array of documents
   */
  list: (filters?: QueryConstraint[]) => Promise<(T & { id: string })[]>;

  /**
   * Lists all documents in the collection including soft deleted documents
   * @param filters Optional query constraints
   * @returns Promise with array of documents
   */
  hardList: (filters?: QueryConstraint[]) => Promise<(T & { id: string })[]>;

  /**
   * Gets a single document by ID
   * @param id Document ID
   * @returns Promise with the document or undefined if not found
   */
  get: (id: string) => Promise<(T & { id: string }) | undefined>;

  /**
   * Updates a document in the collection
   * @param id Document ID to update
   * @param data Partial document data to update
   * @returns Promise that resolves when update is complete
   */
  update: (id: string, data: Partial<T>) => Promise<void>;

  /**
   * Deletes a document from the collection
   * @param id Document ID to delete
   * @returns Promise that resolves when deletion is complete
   */
  delete: (id: string) => Promise<void>;

  /**
   * Soft deletes a document from the collection
   * @param id Document ID to delete
   * @returns Promise that resolves when deletion is complete
   */
  softDelete: (id: string) => Promise<void>;

  /**
   * Soft undeletes a document from the collection
   * @param id Document ID to undelete
   * @returns Promise that resolves when undeletion is complete
   */
  softUndelete: (id: string) => Promise<void>;
};

